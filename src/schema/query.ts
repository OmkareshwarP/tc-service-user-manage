import { extendType, nonNull, stringArg } from 'nexus';
import { generateResponse, logError } from '../utils/index.js';
import AuthUtil from '../auth/index.js';

export const Queries = extendType({
  type: 'Query',
  definition(t) {
    t.field('hello', {
      type: 'GenericResponse',
      async resolve() {
        try {
          return generateResponse(false, 'fecthed successfully', '', 200, 'Hello world!');
        } catch (error) {
          logError(error.message, 'helloError', 5, error);
          return generateResponse(true, `Something went wrong. We're working on it`, 'helloError', 500, null);
        }
      },
    });
    t.field('getUserAuthInfo', {
      type: 'GetUserAuthInfoResponse',
      async resolve(root, _, { dataSources, req }) {
        const token = req.headers.authorization;
        const user = await AuthUtil().verifyToken(token);
        try {
          const response = await dataSources.UserAPI().getUserAuthInfo(user.userId);
          return response;
        } catch (error) {
          logError(error.message, 'getUserAuthInfoError', 5, error, { args: req.body?.variables, userId: user.userId });
          return generateResponse(true, `Something went wrong while getting basic user auth info. We're working on it`, 'getUserAuthInfoError', 500, null);
        }
      },
    });
    t.field('getUserInfoByUsername', {
      type: 'GetUserInfoByUsernameResponse',
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
          return generateResponse(true, `Something went wrong while getting basic user info. We're working on it`, 'getUserInfoByUsernameError', 500, null);
        }
      },
    });
    t.field('checkUsernameStatus', {
      type: 'CheckUsernameStatusResponse',
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
          const response = await dataSources.UserAPI().checkUsernameStatus(username);
          return response;
        } catch (error) {
          logError(error.message, 'checkUsernameStatusError', 5, error, { args: req.body?.variables, username });
          return generateResponse(true, `Something went wrong while getting info. We're working on it`, 'checkUsernameStatusError', 500, null);
        }
      },
    });
  },
});
