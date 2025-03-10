import { extendType, nonNull, nullable, stringArg } from 'nexus';
import { generateResponse, isValidName, isValidUsername, logError, signInProviders, verifyFirebaseToken } from '../utils/index.js';
import AuthUtil from '../auth/index.js';

export const UserMutations = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('login', {
      type: 'LoginResponse',
      args: {
        userIdentifier: nonNull(stringArg()),
        provider: nonNull(stringArg()),
        deviceInfo: nullable(stringArg()),
        operatingSystem: nullable(stringArg()),
      },
      async resolve(_, { userIdentifier, provider, deviceInfo, operatingSystem }, { dataSources, req }) {
        const token = req.headers.authorization;
        await verifyFirebaseToken(token, userIdentifier);

        if (!userIdentifier || !provider || !signInProviders.includes(provider)) {
          return generateResponse(true, 'Something went wrong while validating your request', 'inputParamsValidationFailed', 403, null);
        }

        try {
          const response = await dataSources.UserAPI().login({ userIdentifier, provider, deviceInfo, operatingSystem });
          return response;
        } catch (error) {
          logError(error.message, 'loginError', 5, error, { args: req.body?.variables });
          return generateResponse(true, `Something went wrong while logging in. We're working on it`, 'loginError', 500, null);
        }
      },
    });
    t.field('createUser', {
      type: 'GenericResponse',
      args: {
        userIdentifier: nonNull(stringArg()),
        provider: nonNull(stringArg()),
        name: nonNull(stringArg()),
        username: nonNull(stringArg()),
        profilePictureMediaId: nullable(stringArg()),
        signUpIpv4Address: nullable(stringArg()),
      },
      async resolve(_, { userIdentifier, provider, name, username, profilePictureMediaId, signUpIpv4Address }, { dataSources, req }) {
        const token = req.headers.authorization;
        const user = await verifyFirebaseToken(token, userIdentifier);

        if (!userIdentifier || !provider || !name || !username) {
          return generateResponse(true, 'Something went wrong while validating your request', 'inputParamsValidationFailed', 403, null);
        }
        if (!isValidUsername(username)) {
          return generateResponse(true, 'Username must be between 5 and 15 characters long', 'usernameValidationFailed', 403, null);
        }
        if (!isValidName(name)) {
          return generateResponse(true, 'The name must not exceed 35 characters.', 'nameValidationFailed', 403, null);
        }

        try {
          const { userId, email } = user;
          const response = await dataSources.UserAPI().createUser({ userId, email, provider, name, username, profilePictureMediaId, signUpIpv4Address });
          return response;
        } catch (error) {
          logError(error.message, 'createUserError', 5, error, { args: req.body?.variables });
          return generateResponse(true, `Something went wrong while creating user. We're working on it`, 'createUserError', 500, null);
        }
      },
    });
    t.field('logout', {
      type: 'GenericResponse',
      args: {
        userId: nonNull(stringArg()),
      },
      async resolve(_, { userId }, { dataSources, req }) {
        const token = req.headers.authorization;
        const user = await AuthUtil().verifyToken(token);

        if (!userId) {
          return generateResponse(true, 'Something went wrong while validating your request', 'inputParamsValidationFailed', 403, null);
        }
        if (user.userId !== userId) {
          return generateResponse(true, 'You are not authorized to perform this action', 'unauthorizedAction', 403, null);
        }

        try {
          const response = await dataSources.UserAPI().logout(userId, token);
          return response;
        } catch (error) {
          logError(error.message, 'logoutError', 5, error, { args: req.body?.variables });
          return generateResponse(true, `Something went wrong while logging out. We're working on it`, 'logoutError', 500, null);
        }
      },
    });
    t.field('followUser', {
      type: 'GenericResponse',
      args: {
        followeeUserId: nonNull(stringArg()),
      },
      async resolve(_, { followeeUserId }, { dataSources, req }) {
        const token = req.headers.authorization;
        const user = await AuthUtil().verifyToken(token);
        const followerUserId = user.userId;
        try {
          if (!followeeUserId) {
            return generateResponse(true, 'Something went wrong while validating your request', 'inputParamsValidationFailed', 403, null);
          }
          const response = await dataSources.UserAPI().followUser(followeeUserId, followerUserId);
          return response;
        } catch (error) {
          logError(error.message, 'followUserError', 5, error, { args: req.body?.variables, followeeUserId, followerUserId });
          return generateResponse(true, `Something went wrong while following user. We're working on it`, 'followUserError', 500, null);
        }
      },
    });
    t.field('unFollowUser', {
      type: 'GenericResponse',
      args: {
        followeeUserId: nonNull(stringArg()),
      },
      async resolve(_, { followeeUserId }, { dataSources, req }) {
        const token = req.headers.authorization;
        const user = await AuthUtil().verifyToken(token);
        const followerUserId = user.userId;
        try {
          if (!followeeUserId) {
            return generateResponse(true, 'Something went wrong while validating your request', 'inputParamsValidationFailed', 403, null);
          }
          const response = await dataSources.UserAPI().unFollowUser(followeeUserId, followerUserId);
          return response;
        } catch (error) {
          logError(error.message, 'unFollowUserError', 5, error, { args: req.body?.variables, followeeUserId, followerUserId });
          return generateResponse(true, `Something went wrong while unfollowing user. We're working on it`, 'unFollowUserError', 500, null);
        }
      },
    });
  },
});
