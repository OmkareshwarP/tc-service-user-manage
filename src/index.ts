/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ApolloServer } from '@apollo/server';
import { GraphQLError } from 'graphql';
import express from 'express';
import { makeSchema } from 'nexus';
import * as dotenv from 'dotenv';
import path from 'path';
import * as types from './schema/index.js';
import { logError, getDirname, logData } from './utils/index.js';
import { UserAPI } from './datasources/index.js';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import http from 'http';
import { initializeMongoDB } from './database/mongoUtil.js';
import { initializeRedis } from './database/redisUtil.js';
import { initializeNeo4j } from './database/neo4jUtil.js';
import { initializeCassandraDBClient } from './database/astraUtil.js';
import { loadEnv } from './utils/dopplerUtil.js';

dotenv.config({ path: path.resolve('.env') });

await loadEnv();

const PORT = process.env.PORT || 4000;

initializeRedis();
initializeMongoDB();
initializeNeo4j();
initializeCassandraDBClient();

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

const GQL_INTROSPECTION_KEY = process.env.GQL_INTROSPECTION_KEY;

const startServer = async () => {
  const app = express();
  const httpServer = http.createServer(app);

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

  await server.start();

  const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: '*',
    maxAge: 300, //seconds
    exposedHeaders: '*',
    credentials: false,
  };

  app.use(
    '/',
    cors<cors.CorsRequest>(corsOptions),
    express.json(),
    expressMiddleware(server, {
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
          dataSources: {
            UserAPI,
          },
          req,
        };
      },
    })
  );
  await new Promise<void>((resolve) => httpServer.listen({ port: PORT }, resolve));
  logData(`🚀 Server listening at http://localhost:${PORT}`, 'serverStarted', 2, '');
};

startServer().catch((err) => {
  logError(err.message, 'startServerError', 5, err);
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
process.on('unhandledRejection', (reason: any) => {
  logError('unhandledRejection', 'unhandledRejection', 9, reason);
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
process.on('uncaughtException', (reason: any) => {
  logError('unhandledException', 'unhandledException', 9, reason);
});
