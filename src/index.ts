/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { GraphQLError } from 'graphql';
import { makeSchema } from 'nexus';
import * as dotenv from 'dotenv';
import path from 'path';
import * as types from './schema/index.js';
import { getDirname, gracefulShutdown, initializeAbly, initializeFirebaseApp, initializeSentry, loadEnv, logData, logError } from './utils/index.js';
import { initializeRedis } from './database/redisUtil.js';
import { initializeMongoDB } from './database/mongoUtil.js';
import { initializeNeo4j } from './database/neo4jUtil.js';
import { initializeAstraDB } from './database/astraUtil.js';

dotenv.config({ path: path.resolve('.env') });

await loadEnv();

initializeSentry();
await initializeFirebaseApp();
initializeRedis();
initializeMongoDB();
await initializeNeo4j();
await initializeAstraDB();
initializeAbly();

const __dirname = getDirname(import.meta.url);

const schema = makeSchema({
  types,
  sourceTypes: {
    modules: [
      {
        module: path.join(__dirname, 'typeDefs.ts'),
        alias: 't',
      },
    ],
  },
  contextType: {
    module: path.join(__dirname, 'context.ts'),
    export: 'Context',
  },
});

const PORT = process.env.PORT || '4000';
const GQL_INTROSPECTION_KEY = process.env.GQL_INTROSPECTION_KEY;

const server = new ApolloServer({
  schema,
  introspection: process.env.INTROSPECTION === 'true',
  includeStacktraceInErrorResponses: process.env.INCLUDE_STACK_TRACE_IN_ERROR_RESPONSES === 'true',
  formatError: (error) => {
    // Remove sensitive information from error object
    const { locations, path, ...otherErrorFields } = error;

    // Return the modified error object
    return otherErrorFields;
  },
  plugins: [
    {
      async requestDidStart(requestContext) {
        // Within this returned object, define functions that respond
        // to request-specific lifecycle events.
        return {
          async willSendResponse({ response, errors, request }) {
            for (const error of errors || []) {
              if (error.extensions.code == 'UNAUTHENTICATED' || error.extensions.validationErrorCode === 'INTROSPECTION_DISABLED') {
                // @ts-ignore
                response.data = undefined;
                // @ts-ignore
                response.body.singleResult.data = {};
                response.http.status = 401;
              } else {
                // @ts-ignore
                logError(error.message, 'GraphQLError', 5, error, { response: response?.body?.singleResult?.data, request: request });
              }
            }
          },
        };
      },
    },
  ],
});

const { url } = await startStandaloneServer(server, {
  context: async ({ req }) => {
    //@ts-ignore
    const isIntroSpectionQuery = req.body.operationName === 'IntrospectionQuery';
    if (isIntroSpectionQuery) {
      const introspectionKey = req.headers['gql-introspection-key'];
      if (!introspectionKey || introspectionKey !== GQL_INTROSPECTION_KEY) {
        throw new GraphQLError('Unauthorized introspection', {
          extensions: {
            code: 'UNAUTHENTICATED',
            http: { status: 401 },
          },
        });
      }
    }
    return {
      dataSources: {},
      req,
    };
  },
  listen: { port: parseInt(PORT) },
});

logData(`🚀 Server listening at ${url}`, 'serverStarted', 2, '');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
process.on('unhandledRejection', (reason: any) => {
  logError('unhandledRejection', 'unhandledRejection', 9, reason);
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
process.on('uncaughtException', (reason: any) => {
  logError('uncaughtException', 'uncaughtException', 9, reason);
});

process.on('SIGINT', async () => {
  // eslint-disable-next-line no-console
  console.log('🛑 Received SIGINT (CTRL + C)');
  await gracefulShutdown();
});

process.on('SIGTERM', async () => {
  // eslint-disable-next-line no-console
  console.log('🛑 Received SIGTERM (Docker Stop, Kill Command)');
  await gracefulShutdown();
});
