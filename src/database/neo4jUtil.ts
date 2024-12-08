/* eslint-disable @typescript-eslint/no-explicit-any */
import neo4j, { Driver, Session } from 'neo4j-driver';
import { logData, logError } from '../utils/index.js';

let neo4jDriver: Driver;
let session: Session;

export const initializeNeo4j = () => {
  const uri = process.env.NEO4J_URI;
  const user = process.env.NEO4J_USERNAME;
  const password = process.env.NEO4J_PASSWORD;

  neo4jDriver = neo4j.driver(uri, neo4j.auth.basic(user, password));

  try {
    session = neo4jDriver.session();
    logData('Connected to Neo4j', 'neo4jReady', 1, {});
  } catch (err) {
    logError('Failed to create Neo4j connection', 'neo4jConnectionError', 10, err);
    process.exit(1);
  }
};

export const getNeo4jSession = (): Session => {
  if (!session) {
    throw new Error('Neo4j session is not initialized');
  }
  return session;
};

export const getNeo4jDriver = (): Driver => {
  if (!neo4jDriver) {
    throw new Error('Neo4j driver is not initialized');
  }
  return neo4jDriver;
};
