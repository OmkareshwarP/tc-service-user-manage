import AuthUtil from '../auth/index.js';
import { getMongoDBClient } from '../database/mongoUtil.js';
import { getKey, getRedisClient } from '../database/redisUtil.js';
import { IUser } from '../typeDefs.js';
import {
  generateAlphaNumericId,
  generateNumericId,
  generateResponse,
  getBrevoOTPMailOptions,
  getCurrentEpochTimestamp,
  isBrevoEmailOTPEnabled,
  sendBrevoMailAPI,
} from '../utils/index.js';
import { getUserInformationByUserId } from '../utils/userCacheUtil.js';

export const UserAPI = () => {
  return {
    async sendOTP(email: string) {
      try {
        const _isBrevoEmailOTPEnabled = await isBrevoEmailOTPEnabled();
        if (!_isBrevoEmailOTPEnabled) {
          return generateResponse(true, 'The maximum OTP limit for today has been reached.', 'maxOtpLimitReached', 400, null);
        }

        const redisClient = getRedisClient();
        const noOfOtpsSentForUserRedisKey = `${process.env.REDIS_KEY_NoOfOtpsSentForUser}:${email}`;
        const otpsCount = (await getKey(noOfOtpsSentForUserRedisKey)) || '0';
        const _userLimitPerDay = process.env.BREVO_USER_LIMIT_PER_DAY;
        if (parseInt(otpsCount) >= parseInt(_userLimitPerDay)) {
          return generateResponse(true, 'You have reached the maximum OTP limit.', 'userMaxOtpLimitReached', 400, null);
        }

        const otp = generateNumericId(6);
        const otpKey = `${process.env.REDIS_KEY_OtpSentForUser}:${email}`;
        await redisClient
          .multi()
          .set(otpKey, otp)
          .expire(otpKey, 15 * 60)
          .exec();

        const _brevoMailOptions = getBrevoOTPMailOptions(email, otp);
        await sendBrevoMailAPI(_brevoMailOptions);

        if (otpsCount == '0') {
          await redisClient.set(noOfOtpsSentForUserRedisKey, 1, { EX: 24 * 60 * 60 });
        } else {
          await redisClient.incr(noOfOtpsSentForUserRedisKey);
        }
        return generateResponse(false, 'The OTP has been sent to your email successfully', '', 200, 'done');
      } catch (error) {
        throw error;
      }
    },
    async verifyOTP(email: string, otp: string) {
      try {
        const otpKey = `${process.env.REDIS_KEY_OtpSentForUser}:${email}`;
        const redisClient = getRedisClient();
        const otpToMatch = await redisClient.get(otpKey);
        if (!otpToMatch) {
          return generateResponse(true, `Your OTP has expired. Please try again`, 'otpExpired', 403, null);
        }
        const isOtpVerified = parseInt(otp) == parseInt(otpToMatch);
        if (!isOtpVerified) {
          return generateResponse(true, `Your OTP is incorrect. Please try again with correct OTP`, 'incorrectOtpProvided', 403, null);
        }
        await redisClient.del(otpKey);
        return generateResponse(false, 'The OTP for your account has been verified successfully.', '', 200, 'done');
      } catch (error) {
        throw error;
      }
    },
    async login(inputArgs: any) {
      try {
        const { userIdentifier, provider, deviceInfo, operatingSystem } = inputArgs;
        const dbClient = getMongoDBClient();
        const _collectionName = process.env.UsersCollection;
        const user: IUser = (await dbClient.collection(_collectionName).findOne({ email: userIdentifier })) as any;
        if (user) {
          if (user.verificationStatus == 'verified') {
            const token = await AuthUtil().generateToken({
              userId: user.userId,
              provider,
              userIdentifier,
              deviceInfo,
              operatingSystem,
            });
            return generateResponse(false, 'User successfully logged in', 'userFoundAndVerified', 200, {
              isNewUser: false,
              token,
            });
          } else if (user.verificationStatus == 'notverified') {
            return generateResponse(true, 'User not verified', 'userFoundAndNotVerified', 400, null);
          } else {
            return generateResponse(true, 'Invalid input found', 'invalidInput', 400, null);
          }
        } else {
          return generateResponse(true, 'User does not exists', 'userNotFound', 404, {
            isNewUser: true,
            token: '',
          });
        }
      } catch (error) {
        throw error;
      }
    },
    async createUser(inputArgs: any) {
      try {
        const { email, provider, verificationStatus, name, username, profilePictureMediaId, signUpIpv4Address } = inputArgs;
        const _userId = generateAlphaNumericId(32);

        const _userData: IUser = {
          userId: _userId,
          email,
          provider,
          verificationStatus,
          name,
          username,
          profilePictureMediaId,
          signUpIpv4Address,
          moderationStatus: 'unmoderated',
          deletionStatus: 'notdeleted',
          publicTags: [],
          internalTags: [],
          profileLink: null,
          profileRejectionReasons: [],
          createdAt: getCurrentEpochTimestamp(),
          updatedAt: getCurrentEpochTimestamp(),
        };

        const dbClient = getMongoDBClient();
        const _collectionName = process.env.UsersCollection;

        try {
          await dbClient.collection(_collectionName).insertOne({ ..._userData });
        } catch (err) {
          if (err.code === 11000) {
            const field = Object.keys(err.keyPattern)[0];
            return generateResponse(true, `${field} already exists`, `${field}AlreadyExists`, 400, null);
          } else {
            throw err;
          }
        }

        return generateResponse(false, 'User created successfully', '', 200, 'done');
      } catch (error) {
        throw error;
      }
    },
    //******* authorization required *********//
    async logout(userId: string, currentUserId: any, authorization: string) {
      try {
        if (userId != currentUserId) {
          return generateResponse(true, 'Invalid logout action', 'invalidUser', 403, null);
        }

        const user = await getUserInformationByUserId(userId);
        if (!user) {
          return generateResponse(true, 'Something went wrong. Please try again', 'invalidUser', 403, null);
        }

        await AuthUtil().deleteParticularTokenByUserId(userId, authorization);
        return generateResponse(false, 'User has been logged out successfully', '', 200, { userId });
      } catch (error) {
        throw error;
      }
    },
    async getUserAuthInfo(userId: string) {
      try {
        const user = await getUserInformationByUserId(userId);
        if (!user) {
          return generateResponse(true, 'Something went wrong. Please try again', 'userNotFound', 404, null);
        }
        return generateResponse(false, 'User auth info fetched successfully', '', 200, user);
      } catch (error) {
        throw error;
      }
    },
    async getUserInfoByUsername(username: string) {
      try {
        const dbClient = getMongoDBClient();
        const _collectionName = process.env.UsersCollection;
        const userData = (await dbClient.collection(_collectionName).findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') }, deletionStatus: 'notdeleted' })) as any;
        if (!userData?.userId) {
          return generateResponse(true, 'Something went wrong. Please try again', 'userNotFound', 404, null);
        }
        return generateResponse(false, 'User data fetched successfully', '', 200, userData);
      } catch (error) {
        throw error;
      }
    },
    async checkUsernameStatus(username: string) {
      try {
        const dbClient = getMongoDBClient();
        const _collectionName = process.env.UsersCollection;
        const userData = (await dbClient.collection(_collectionName).findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } })) as any;
        let isUsernameAvailable = false;
        if (!userData?.username) {
          isUsernameAvailable = true;
        }
        return generateResponse(false, 'User data fetched successfully', '', 200, { isUsernameAvailable });
      } catch (error) {
        throw error;
      }
    },
  };
};
