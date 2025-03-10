import { extendType, nonNull, nullable, stringArg } from 'nexus';
import { generateResponse, isValidUsername, logError } from '../utils/index.js';
import AuthUtil from '../auth/index.js';
import { testNeo4jConnection } from '../database/neo4jUtil.js';

export const UserQueries = extendType({
  type: 'Query',
  definition(t) {
    t.field('hello', {
      type: 'GenericResponse',
      async resolve() {
        try {
          await testNeo4jConnection();
          return generateResponse(false, 'fecthed successfully', '', 200, 'Hello world!');
        } catch (error) {
          logError(error.message, 'helloError', 5, error);
          return generateResponse(true, `Something went wrong. We're working on it`, 'helloError', 500, null);
        }
      },
    });
    t.field('checkUsernameStatus', {
      type: 'CheckUsernameStatusResponse',
      args: {
        username: nonNull(stringArg()),
      },
      async resolve(_, { username }, { dataSources, req }) {
        if (!username) {
          return generateResponse(true, 'Something went wrong while validating your request', 'inputParamsValidationFailed', 403, null);
        }

        if (!isValidUsername(username)) {
          return generateResponse(true, 'Username must be between 5 and 15 characters long', 'inputParamsValidationFailed', 403, null);
        }

        try {
          const response = await dataSources.UserAPI().checkUsernameStatus(username);
          return response;
        } catch (error) {
          logError(error.message, 'checkUsernameStatusError', 5, error, { args: req.body?.variables, username });
          return generateResponse(true, `Something went wrong while getting info. We're working on it`, 'checkUsernameStatusError', 500, null);
        }
      },
    });
    t.field('getUserBasicInfo', {
      type: 'GetUserBasicInfoResponse',
      async resolve(root, _, { dataSources, req }) {
        const token = req.headers.authorization;
        const user = await AuthUtil().verifyToken(token);
        try {
          const response = await dataSources.UserAPI().getUserBasicInfo(user.userId);
          return response;
        } catch (error) {
          logError(error.message, 'getUserBasicInfoError', 5, error, { args: req.body?.variables, userId: user.userId });
          return generateResponse(true, `Something went wrong while getting user basic info. We're working on it`, 'getUserBasicInfoError', 500, null);
        }
      },
    });
    t.field('getUserInfo', {
      type: 'GetUserInfoResponse',
      async resolve(root, _, { dataSources, req }) {
        const token = req.headers.authorization;
        const user = await AuthUtil().verifyToken(token);
        try {
          const response = await dataSources.UserAPI().getUserInfo(user.userId);
          return response;
        } catch (error) {
          logError(error.message, 'getUserInfoError', 5, error, { args: req.body?.variables, userId: user.userId });
          return generateResponse(true, `Something went wrong while getting user info. We're working on it`, 'getUserInfoError', 500, null);
        }
      },
    });
    t.field('getUserInfoByUsername', {
      type: 'GetUserInfoResponse',
      args: {
        username: nonNull(stringArg()),
      },
      async resolve(_, { username }, { dataSources, req }) {
        const token = req.headers.authorization;
        await AuthUtil().verifyToken(token);
        try {
          if (!username) {
            return generateResponse(true, 'Something went wrong while validating your request', 'inputParamsValidationFailed', 403, null);
          }

          const response = await dataSources.UserAPI().getUserInfoByUsername(username);
          return response;
        } catch (error) {
          logError(error.message, 'getUserInfoByUsernameError', 5, error, { args: req.body?.variables, username });
          return generateResponse(true, `Something went wrong while getting user info. We're working on it`, 'getUserInfoByUsernameError', 500, null);
        }
      },
    });
    t.field('getFollowersListByUserId', {
      type: 'GetUserFollowingOrFollowersListResponse',
      args: {
        userId: nonNull(stringArg()),
        lastCreatedAt: nullable(stringArg()),
      },
      async resolve(_, { userId, lastCreatedAt }, { dataSources, req }) {
        const token = req.headers.authorization;
        await AuthUtil().verifyToken(token);
        try {
          if (!userId) {
            return generateResponse(true, 'Something went wrong while validating your request', 'inputParamsValidationFailed', 403, []);
          }
          const parsedLastCreatedAt = lastCreatedAt == null || isNaN(parseInt(lastCreatedAt)) ? null : parseInt(lastCreatedAt);
          const response = await dataSources.UserAPI().getFollowersListByUserId(userId, parsedLastCreatedAt);
          return response;
        } catch (error) {
          logError(error.message, 'getFollowersListByUserIdError', 5, error, { args: req.body?.variables });
          return generateResponse(true, `Something went wrong while getting followers list. We're working on it`, 'getFollowersListByUserIdError', 500, []);
        }
      },
    });
    t.field('getFollowingListByUserId', {
      type: 'GetUserFollowingOrFollowersListResponse',
      args: {
        userId: nonNull(stringArg()),
        lastCreatedAt: nullable(stringArg()),
      },
      async resolve(_, { userId, lastCreatedAt }, { dataSources, req }) {
        const token = req.headers.authorization;
        await AuthUtil().verifyToken(token);
        try {
          if (!userId) {
            return generateResponse(true, 'Something went wrong while validating your request', 'inputParamsValidationFailed', 403, []);
          }
          const parsedLastCreatedAt = lastCreatedAt == null || isNaN(parseInt(lastCreatedAt)) ? null : parseInt(lastCreatedAt);
          const response = await dataSources.UserAPI().getFollowingListByUserId(userId, parsedLastCreatedAt);
          return response;
        } catch (error) {
          logError(error.message, 'getFollowingListByUserIdError', 5, error, { args: req.body?.variables });
          return generateResponse(true, `Something went wrong while getting following list. We're working on it`, 'getFollowingListByUserIdError', 500, []);
        }
      },
    });
  },
});
