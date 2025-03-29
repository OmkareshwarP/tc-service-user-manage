import { keepAstraDBActive } from '../database/astraUtil.js';
import { keepNeo4jDBActive } from '../database/neo4jUtil.js';

export const monitorHandler = async () => {
  try {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    if (hours === 10 && minutes >= 0 && minutes <= 2) {
      await keepNeo4jDBActive();
      await keepAstraDBActive();
    }
  } catch (error) {
    throw error;
  }
};
