import Ably from 'ably';
import { nanoid } from 'nanoid';
import { getCurrentEpochTimestamp, logData, logError } from './index.js';
import { AnalyticsEventData, BgMessageData } from '../typeDefs.js';

let ably: Ably.Realtime;

export const initializeAbly = () => {
  ably = new Ably.Realtime({
    key: process.env.ABLY_API_KEY,
  });

  ably.connection.once('connected', () => {
    logData('Connected to Ably!', 'ablyReady', 2, '');
  });
};

export const publishMessageToBgsChannel = async (messageData) => {
  try {
    const bgChannel = ably.channels.get(process.env.BACKGROUND_CHANNEL);
    const messageIdentifier = nanoid(16);
    const createdAt = getCurrentEpochTimestamp().toString();
    const { messageName, entityId, entityType, actionInputOne, actionInputTwo, ...metadata } = messageData;

    const message: BgMessageData = {
      messageIdentifier,
      createdAt,
      messageName,
      entityId,
      entityType,
      actionInputOne,
      actionInputTwo,
      metadata,
    };
    const messageBuffer = Buffer.from(JSON.stringify(message));
    await bgChannel.publish(messageName, messageBuffer);
  } catch (error) {
    logError(`publishMessageToChannel Error: ${error}`, 'publishMessageToBgsChannelError', 5, error);
  }
};

export const publishEventToAnalyticsChannel = async (eventData: AnalyticsEventData) => {
  try {
    const analyticsChannel = ably.channels.get(process.env.ANALYTICS_CHANNEL);
    const { eventName } = eventData;
    const messageBuffer = Buffer.from(JSON.stringify(eventData));
    await analyticsChannel.publish(eventName, messageBuffer);
  } catch (error) {
    logError(`publishMessageToChannel Error: ${error}`, 'publishEventToAnalyticsChannelError', 5, error);
  }
};
