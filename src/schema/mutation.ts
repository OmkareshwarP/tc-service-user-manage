import { extendType, nonNull, nullable, stringArg } from 'nexus';
import { generateResponse, isValidEmail, logError, signInProviders } from '../utils/index.js';
import AuthUtil from '../auth/index.js';

export const PostMutations = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('sendOTP', {
      type: 'GenericResponse',
      args: {
        email: nonNull(stringArg()),
      },
      async resolve(_, { email }, { dataSources, req }) {
        try {
          if (!email || !isValidEmail(email)) {
            return generateResponse(true, 'Something went wrong while validating your request', 'inputParamsValidationFailed', 403, null);
          }
          const response = await dataSources.UserAPI().sendOTP(email);
          return response;
        } catch (error) {
          logError(error.message, 'sendOTPError', 5, error, { args: req.body?.variables });
          return generateResponse(true, `Something went wrong while sending OTP. We're working on it`, 'sendOTPError', 500, null);
        }
      },
    });
    t.field('verifyOTP', {
      type: 'GenericResponse',
      args: {
        email: nonNull(stringArg()),
        otp: nonNull(stringArg()),
      },
      async resolve(_, { email, otp }, { dataSources, req }) {
        try {
          if (!email || !isValidEmail(email) || !otp) {
            return generateResponse(true, 'Something went wrong while validating your request', 'inputParamsValidationFailed', 403, null);
          }
          const response = await dataSources.UserAPI().verifyOTP(email, otp);
          return response;
        } catch (error) {
          logError(error.message, 'verifyOTPError', 5, error, { args: req.body?.variables });
          return generateResponse(true, `Something went wrong while verifying OTP. We're working on it`, 'verifyOTPError', 500, null);
        }
      },
    });
    t.field('login', {
      type: 'LoginResponse',
      args: {
        userIdentifier: nonNull(stringArg()),
        provider: nonNull(stringArg()),
        deviceInfo: nullable(stringArg()),
        operatingSystem: nullable(stringArg()),
      },
      async resolve(_, { userIdentifier, provider, deviceInfo, operatingSystem }, { dataSources, req }) {
        try {
          if (!userIdentifier || !provider || !signInProviders.includes(provider)) {
            return generateResponse(true, 'Something went wrong while validating your request', 'inputParamsValidationFailed', 403, null);
          }
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
        email: nonNull(stringArg()),
        provider: nonNull(stringArg()),
        verificationStatus: nonNull(stringArg()),
        firstname: nonNull(stringArg()),
        lastname: nonNull(stringArg()),
        gender: nullable(stringArg()),
        profilePictureMediaId: nullable(stringArg()),
        signUpIpv4Address: nullable(stringArg()),
      },
      async resolve(_, { email, provider, verificationStatus, firstname, lastname, gender, profilePictureMediaId, signUpIpv4Address }, { dataSources, req }) {
        try {
          if (!email || !provider || !verificationStatus || !firstname || !lastname) {
            return generateResponse(true, 'Something went wrong while validating your request', 'inputParamsValidationFailed', 403, null);
          }
          const response = await dataSources
            .UserAPI()
            .createUser({ email, provider, verificationStatus, firstname, lastname, gender, profilePictureMediaId, signUpIpv4Address });
          return response;
        } catch (error) {
          logError(error.message, 'createUserError', 5, error, { args: req.body?.variables });
          return generateResponse(true, `Something went wrong while creating user. We're working on it`, 'createUserError', 500, null);
        }
      },
    });
    //******* authorization required *********//
    t.field('logout', {
      type: 'LogoutResponse',
      args: {
        userId: nonNull(stringArg()),
      },
      async resolve(_, { userId }, { dataSources, req }) {
        const token = req.headers.authorization;
        const user = await AuthUtil().verifyToken(token);
        try {
          if (!userId) {
            return generateResponse(true, 'Something went wrong while validating your request', 'inputParamsValidationFailed', 403, null);
          }
          const response = await dataSources.UserAPI().logout(userId, user.userId, token);
          return response;
        } catch (error) {
          logError(error.message, 'logoutError', 5, error, { args: req.body?.variables });
          return generateResponse(true, `Something went wrong while logging out. We're working on it`, 'logoutError', 500, null);
        }
      },
    });
  },
});
