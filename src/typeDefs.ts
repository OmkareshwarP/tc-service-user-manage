/* eslint-disable @typescript-eslint/no-explicit-any */
export interface IUser {
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  fullName: string;
}

export interface IBrevoMailOptions {
  receiverEmail: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
}