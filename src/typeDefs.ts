export interface IBrevoMailOptions {
  receiverEmail: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
}

export interface IUser {
  userId: string;
  email: string;
  username: string;
  provider: string;
  firstname: string;
  lastname: string;
  gender: string;
  profilePictureMediaId: string;
  moderationStatus: string;
  verificationStatus: string;
  deletionStatus: string;
  publicTags: string[];
  internalTags: string[];
  profileLink: string;
  createdAt: number;
  updatedAt: number;
  signUpIpv4Address: string;
  profileRejectionReasons: string[];
}
