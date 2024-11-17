import { ApolloServer } from '@apollo/server';
import { GraphQLError } from 'graphql';
import express from 'express';
import { makeSchema } from 'nexus';
import * as dotenv from 'dotenv';
import path from 'path';
import * as types from './schema/index.js';
import {
  logError,
  getDirname,
  logData,
} from './utils/index.js';
import { UserAPI } from './datasources/index.js';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import http from 'http';
import { initializeMongoDB } from './database/mongoUtil.js';
import { initializeRedis } from './database/redisUtil.js';
import { initializeNeo4j } from './database/neo4jUtil.js';

dotenv.config({ path: '.env' });

if (process.env.SM) {
  process.env = { ...process.env, ...JSON.parse(process.env.SM) }
}

initializeRedis();
initializeMongoDB();
initializeNeo4j();

//  __dirname returns the absolute path, whereas the getDirname function in the given code returns the directory name relative to the current working directory
const __dirname = getDirname(import.meta.url);

const schema = makeSchema({
  types,
  sourceTypes: {
    modules: [
      {
        module: path.join(__dirname, 'typeDefs.ts'),
        alias: 't'
      }
    ]
  },
  contextType: {
    module: path.join(__dirname, 'context.ts'),
    export: 'Context'
  }
});

const port = process.env.PORT;
const GQL_INTROSPECTION_KEY = process.env.GQL_INTROSPECTION_KEY;

// Initialize an Express app
const app = express();
const httpServer = http.createServer(app);

const server = new ApolloServer({
  schema,
  introspection: process.env.introspection === 'true',
  includeStacktraceInErrorResponses:
    process.env.includeStacktraceInErrorResponses === 'true',
  plugins: [
    {
      async requestDidStart(requestContext) {
        // Within this returned object, define functions that respond
        // to request-specific lifecycle events.
        return {
          async willSendResponse({ response, errors }) {
            for (const error of errors || []) {
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              logError(error.message, 'GraphQLError', 5, error, { response: response?.body?.singleResult?.data })
            }
          }
        };
      },
    },
  ],
});

// Ensure we wait for our server to start
await server.start();

// CORS configuration
const corsOptions = {
  origin: '*',  // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: '*',
  maxAge: 300,  // Cache preflight response for 5 minutes
  exposedHeaders: '*',
  credentials: false,
};

app.use('/',
  cors<cors.CorsRequest>(corsOptions),
  express.json(),
  // expressMiddleware accepts the same arguments:
  // an Apollo Server instance and optional configuration options
  expressMiddleware(server, {
    context: async ({ req }) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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
          UserAPI
        },
      };
    },

  }),

);

// Modified server startup
await new Promise<void>((resolve) =>
  httpServer.listen({ port: parseInt(port) }, resolve),
);

logData(`🚀 Server listening at http://localhost:${port}`, 'serverStarted', 2, '')

// eslint-disable-next-line @typescript-eslint/no-explicit-any
process.on('unhandledRejection', (reason: any) => {
  logError(
    'unhandledRejection',
    'unhandledRejection',
    9,
    reason
  );
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
process.on('uncaughtException', (reason: any) => {
  logError(
    'unhandledException',
    'unhandledException',
    9,
    reason
  );
});
