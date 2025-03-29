export interface IUser {
  userId: string;
  provider: string;
  email: string;
  username: string;
  name: string;
  profilePictureMediaId: string;
  headerPictureMediaId: string;
  signUpIpv4Address: string;
  moderationStatus: string;
  deletionStatus: string;
  internalTags: string[];
  profileLink: string;
  profileRejectionReasons: string[];
  createdAt: number;
  updatedAt: number;
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
