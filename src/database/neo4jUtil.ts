import neo4j, { Driver, Session } from 'neo4j-driver';
import { logData, logError } from '../utils/index.js';

let neo4jDriver: Driver | null = null;

export const getNeo4jDriver = (): Driver => {
  if (!neo4jDriver) {
    const uri = process.env.NEO4J_URI;
    const user = process.env.NEO4J_USERNAME;
    const password = process.env.NEO4J_PASSWORD;

    try {
      neo4jDriver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    } catch (err) {
      neo4jDriver = null;
      throw err;
    }
  }
  return neo4jDriver;
};

export const createNeo4jSession = (): Session => {
  return getNeo4jDriver().session();
};

export const closeNeo4jDriver = async () => {
  if (neo4jDriver) {
    await neo4jDriver.close();
    neo4jDriver = null;
  }
};

export const initializeNeo4j = async () => {
  const session = createNeo4jSession();

  try {
    await session.run('RETURN 1'); // Test query
    logData('Connected to Neo4j successfully', 'neo4jConnected', 1, {});
  } catch (err) {
    logError('Failed to connect to Neo4j', 'neo4jConnectionError', 10, err);
    process.exit(1);
  } finally {
    await session.close();
  }
};

export const testNeo4jConnection = async () => {
  const session = createNeo4jSession();
  try {
    const result = await session.run(`
        MERGE (n:TestNode {id: 1}) 
        ON CREATE SET n.count = 1
        ON MATCH SET n.count = n.count + 1
        RETURN n.count AS count
      `);

    const count = result.records[0].get('count');
    logData(`TestNode count updated: ${count}`, 'neo4jTestNodeUpdate', 1, { count });

    return count;
  } catch (err) {
    logError('Error updating TestNode', 'neo4jTestNodeError', 10, err);
    return null;
  } finally {
    await session.close();
  }
};
