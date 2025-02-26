import { extendType, nonNull, stringArg } from 'nexus';
import { generateResponse, logError } from '../utils/index.js';

export const UserMutations = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('createUser', {
      type: 'GenericResponse',
      args: {
        email: nonNull(stringArg()),
      },
      async resolve(_, { email }, { req }) {
        try {
          if (!email) {
            return generateResponse(true, 'Something went wrong while validating your request', 'inputParamsValidationFailed', 403, null);
          }
          return generateResponse(false, 'user created successfully.', '', 200, 'done');
        } catch (error) {
          logError(error.message, 'createUserError', 5, error, { args: req.body?.variables });
          return generateResponse(true, `Something went wrong while creating user. We're working on it`, 'createUserError', 500, null);
        }
      },
    });
  },
});
