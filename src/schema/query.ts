import { extendType } from 'nexus';
import { generateResponse, logError } from '../utils/index.js';

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
  },
});
