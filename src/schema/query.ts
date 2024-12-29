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
    t.field('getBasicUserInfo', {
      type: 'GetBasicUserInfoResponse',
      async resolve(root, _, { dataSources, req }) {
        const token = req.headers.authorization;
        const user = await AuthUtil().verifyToken(token);
        try {
          const response = await dataSources.UserAPI().getBasicUserInfo(user.userId);
          return response;
        } catch (error) {
          logError(error.message, 'getBasicUserInfoError', 5, error, { args: req.body?.variables });
          return generateResponse(true, `Something went wrong while getting basic user info. We're working on it`, 'getBasicUserInfoError', 500, null);
        }
      },
    });
    t.field('getBasicUserInfoByUsername', {
      type: 'GetBasicUserInfoByUsernameResponse',
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
          const response = await dataSources.UserAPI().getBasicUserInfoByUsername(username);
          return response;
        } catch (error) {
          logError(error.message, 'getBasicUserInfoByUsernameError', 5, error, { args: req.body?.variables, username });
          return generateResponse(true, `Something went wrong while getting basic user info. We're working on it`, 'getBasicUserInfoByUsernameError', 500, null);
        }
      },
    });
  },
});
