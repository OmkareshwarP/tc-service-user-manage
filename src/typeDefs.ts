export interface IUser {
  userId: string;
  email: string;
  username: string;
}

export interface BgMessageData {
  messageIdentifier?: string;
  createdAt?: string;
  messageName: string;
  entityId: string;
  entityType?: string;
  actionInputOne?: unknown;
  actionInputTwo?: unknown;
  metadata?: unknown;
}

export interface AnalyticsEventData {
  eventName: string;
  entityId: string;
  entityType?: string;
  typeOfOperation?: string;
  actionInputOne?: unknown;
  actionInputTwo?: unknown;
  actionInputThree?: unknown;
  actionInputFour?: unknown;
  actionInputFive?: unknown;
}
