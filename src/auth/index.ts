/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateAlphaNumericId, getCurrentEpochTimestamp } from '../utils/index.js';
import { getRedisClient } from '../database/redisUtil.js';
import { GraphQLError } from 'graphql';

interface Authentication {
  generateToken: (inputData: any) => Promise<any>;
  verifyToken: (token: string) => Promise<any>;
  deleteAllTokensByUserId: (userId: string) => Promise<any>;
  deleteParticularTokenByUserId: (userId: string, token: string) => Promise<any>;
}

interface IUserData {
  userId: string;
  userIdentifier: string;
  provider: string;
  deviceInfo?: string;
  operatingSystem?: string;
  userAccessLevel?: string;
}

const AuthUtil = (): Authentication => {
  return {
    async generateToken(userInputData: IUserData) {
      try {
        const { userId, userIdentifier, provider, deviceInfo, operatingSystem, userAccessLevel } = userInputData;
        const token = generateAlphaNumericId(20);
        const redisKey = `${process.env.REDIS_KEY_AuthToken}:${token}`;
        const userMapObj: Record<string, any> = {
          userId: userId,
          token,
          provider,
          userIdentifier,
          userAccessLevel: userAccessLevel || 'default',
          device: deviceInfo || 'default',
          operatingSystem: operatingSystem || 'default',
          createdAt: getCurrentEpochTimestamp(),
          lastModifiedAt: getCurrentEpochTimestamp(),
        };
        const redisTokenListKey = `${process.env.REDIS_KEY_UserTokensList}:${userId}`;
        const redisClient = getRedisClient();
        await redisClient.multi().hSet(redisKey, userMapObj).lPush(redisTokenListKey, token).exec();
        return token;
      } catch (err) {
        throw err;
      }
    },
    async verifyToken(token: string) {
      try {
        const redisKey = `${process.env.REDIS_KEY_AuthToken}:${token}`;
        const redisClient = getRedisClient();
        const userData = await redisClient.hGetAll(redisKey);
        if (Object.keys(userData).length) {
          return userData;
        }
        //tokenNotFound
        throw new GraphQLError('User is not authenticated', {
          extensions: {
            code: 'UNAUTHENTICATED',
            http: { status: 401 },
          },
        });
      } catch (err) {
        throw err;
      }
    },
    async deleteAllTokensByUserId(userId: string) {
      try {
        const redisKey = `${process.env.REDIS_KEY_UserTokensList}:${userId}`;
        const redisClient = getRedisClient();
        const tokens = await redisClient.lRange(redisKey, 0, -1);
        const keysToDelete = [...tokens.map((token) => `${process.env.REDIS_KEY_AuthToken}:${token}`), redisKey];
        await redisClient.multi().del(keysToDelete).exec();
      } catch (err) {
        throw err;
      }
    },
    async deleteParticularTokenByUserId(userId: string, token: string) {
      try {
        const redisKey = `${process.env.REDIS_KEY_UserTokensList}:${userId}`;
        const authTokenRedisKey = `${process.env.REDIS_KEY_AuthToken}:${token}`;
        const redisClient = getRedisClient();
        await redisClient.multi().lRem(redisKey, 0, token).del(authTokenRedisKey).exec();
      } catch (err) {
        throw err;
      }
    },
  };
};

export default AuthUtil;
