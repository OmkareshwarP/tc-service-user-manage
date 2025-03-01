/* eslint-disable @typescript-eslint/no-explicit-any */
import AuthUtil from '../auth/index.js';
import { getMongoDBClient } from '../database/mongoUtil.js';
import { AnalyticsEventData, IUser } from '../typeDefs.js';
import {
  generateResponse,
  getCurrentEpochTimestamp,
  getUserInformationByUserId,
  publishEventToAnalyticsChannel,
  publishMessageToBgsChannel,
} from '../utils/index.js';

export const UserAPI = () => {
  return {
    async login(inputArgs: any) {
      const { userIdentifier, provider, deviceInfo, operatingSystem } = inputArgs;
      try {
        const dbClient = getMongoDBClient();
        const _collectionName = process.env.USERS_COLLECTION;
        const user: IUser = (await dbClient.collection(_collectionName).findOne({ email: userIdentifier })) as any;
        if (user) {
          const token = await AuthUtil().generateToken({
            userId: user.userId,
            provider,
            userIdentifier: user.email,
            deviceInfo,
            operatingSystem,
          });
          return generateResponse(false, 'User successfully logged in', '', 200, {
            isNewUser: false,
            token,
          });
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
        const { userId, email, provider, name, username, profilePictureMediaId, signUpIpv4Address } = inputArgs;

        const _userData: IUser = {
          userId,
          email,
          provider,
          name,
          username,
          profilePictureMediaId,
          signUpIpv4Address,
          moderationStatus: 'unmoderated',
          deletionStatus: 'notdeleted',
          internalTags: [],
          profileLink: null,
          profileRejectionReasons: [],
          createdAt: getCurrentEpochTimestamp(),
          updatedAt: getCurrentEpochTimestamp(),
        };

        const dbClient = getMongoDBClient();
        const _collectionName = process.env.USERS_COLLECTION;

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

        const bgMessageData: any = {
          messageName: 'userSignedUp',
          entityId: userId,
          entityType: 'user',
        };
        publishMessageToBgsChannel(bgMessageData);

        const analyticsEventData: AnalyticsEventData = {
          eventName: 'userInfoEvent',
          entityId: userId,
          entityType: 'user',
          typeOfOperation: 'create',
        };
        publishEventToAnalyticsChannel(analyticsEventData);

        return generateResponse(false, 'User created successfully', '', 200, 'done');
      } catch (error) {
        throw error;
      }
    },
    async logout(userId: string, authorization: string) {
      try {
        const user = await getUserInformationByUserId(userId);
        if (!user) {
          return generateResponse(true, 'Something went wrong. Please try again', 'invalidUser', 403, null);
        }

        await AuthUtil().deleteParticularTokenByUserId(userId, authorization);
        return generateResponse(false, 'User has been logged out successfully', '', 200, 'done');
      } catch (error) {
        throw error;
      }
    },
    async checkUsernameStatus(username: string) {
      try {
        const dbClient = getMongoDBClient();
        const _collectionName = process.env.USERS_COLLECTION;
        const userData = (await dbClient.collection(_collectionName).findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } })) as any;
        let isUsernameAvailable = false;
        if (!userData?.username) {
          isUsernameAvailable = true;
        }
        return generateResponse(false, 'Username status fetched successfully', '', 200, { isUsernameAvailable });
      } catch (error) {
        throw error;
      }
    },
    async getUserBasicInfo(userId: string) {
      try {
        const user = await getUserInformationByUserId(userId);
        if (!user) {
          return generateResponse(true, 'User does not exists', 'userNotFound', 404, null);
        }
        return generateResponse(false, 'User basic info fetched successfully', '', 200, user);
      } catch (error) {
        throw error;
      }
    },
  };
};
