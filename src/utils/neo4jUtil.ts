import { getNeo4jDriver, getNeo4jSession } from '../database/neo4jUtil.js';

const closeNeo4jConnection = async () => {
  const neo4jDriver = getNeo4jDriver();
  const session = getNeo4jSession();
  if (neo4jDriver) {
    await session.close();
    await neo4jDriver.close();
  }
};

export const runNeo4jQuery = async (query: string) => {
  const session = getNeo4jSession();
  //ex:query---MATCH (n) RETURN n LIMIT 10
  try {
    const result = await session.run(query);
    return result;
  } catch (err) {
    throw err;
  } finally {
    await closeNeo4jConnection();
  }
};
