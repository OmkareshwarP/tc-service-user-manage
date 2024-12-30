import { objectType } from 'nexus';

export const UserAuthInfo = objectType({
  name: 'UserAuthInfo',
  definition(t) {
    t.nonNull.string('userId');
    t.nonNull.string('email');
    t.nonNull.string('username');
    t.nonNull.string('name');
    t.nullable.string('profilePictureMediaId');
  },
});

export const GetUserAuthInfoResponse = objectType({
  name: 'GetUserAuthInfoResponse',
  definition(t) {
    t.nonNull.boolean('error');
    t.nonNull.string('message');
    t.nonNull.int('statusCode');
    t.nonNull.string('errorCodeForClient');
    t.nullable.field('data', { type: 'UserAuthInfo' });
  },
});

export const UserData = objectType({
  name: 'UserData',
  definition(t) {
    t.nonNull.string('userId');
    t.nonNull.string('username');
    t.nonNull.string('name');
    t.nullable.string('profilePictureMediaId');
    t.nullable.string('bio');
    t.nullable.string('location');
    t.nullable.string('website');
    t.nullable.string('dob');
    t.nonNull.string('createdAt');
  },
});

export const CreateUserData = objectType({
  name: 'CreateUserData',
  definition(t) {
    t.nonNull.string('userId');
  },
});

export const CreateUserResponse = objectType({
  name: 'CreateUserResponse',
  definition(t) {
    t.nonNull.boolean('error');
    t.nonNull.string('message');
    t.nonNull.int('statusCode');
    t.nonNull.string('errorCodeForClient');
    t.nullable.field('data', { type: 'CreateUserData' });
  },
});

export const GetAllUsersResponse = objectType({
  name: 'GetAllUsersResponse',
  definition(t) {
    t.nonNull.boolean('error');
    t.nonNull.string('message');
    t.nonNull.int('statusCode');
    t.nonNull.string('errorCodeForClient');
    t.nullable.list.nonNull.field('data', { type: 'UserData' });
  },
});

export const GetUserInfoResponse = objectType({
  name: 'GetUserInfoResponse',
  definition(t) {
    t.nonNull.boolean('error');
    t.nonNull.string('message');
    t.nonNull.int('statusCode');
    t.nonNull.string('errorCodeForClient');
    t.nullable.field('data', { type: 'UserData' });
  },
});

export const GetUserInfoByUsernameResponse = objectType({
  name: 'GetUserInfoByUsernameResponse',
  definition(t) {
    t.nonNull.boolean('error');
    t.nonNull.string('message');
    t.nonNull.int('statusCode');
    t.nonNull.string('errorCodeForClient');
    t.nullable.field('data', { type: 'UserData' });
  },
});

export const UsernameStatus = objectType({
  name: 'UsernameStatus',
  definition(t) {
    t.nonNull.boolean('isUsernameAvailable');
  },
});

export const CheckUsernameStatusResponse = objectType({
  name: 'CheckUsernameStatusResponse',
  definition(t) {
    t.nonNull.boolean('error');
    t.nonNull.string('message');
    t.nonNull.int('statusCode');
    t.nonNull.string('errorCodeForClient');
    t.nullable.field('data', { type: 'UsernameStatus' });
  },
});