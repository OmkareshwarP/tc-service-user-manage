/* eslint-disable no-console */
import { closeCassandraDBClient } from '../database/astraUtil.js';
import { closeNeo4jDriver } from '../database/neo4jUtil.js';
import { logError } from './index.js';

export const gracefulShutdown = async () => {
  try {
    console.log('\n🔄 Shutting down gracefully...');

    await closeCassandraDBClient();
    await closeNeo4jDriver();

    console.log('✅ All connections closed. Exiting...');
    process.exit(0);
  } catch (err) {
    logError('Error during shutdown', 'shutdownError', 10, err);
    process.exit(1);
  }
};
