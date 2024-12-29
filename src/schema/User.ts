import { objectType } from 'nexus';

export const UserData = objectType({
  name: 'UserData',
  definition(t) {
    t.nonNull.string('userId');
    t.nonNull.string('username');
    t.nonNull.string('firstname');
    t.nonNull.string('lastname');
    t.nonNull.string('fullname');
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

export const GetUserByIdResponse = objectType({
  name: 'GetUserByIdResponse',
  definition(t) {
    t.nonNull.boolean('error');
    t.nonNull.string('message');
    t.nonNull.int('statusCode');
    t.nonNull.string('errorCodeForClient');
    t.nullable.field('data', { type: 'UserData' });
  },
});

export const GetUserByUsernameResponse = objectType({
  name: 'GetUserByUsernameResponse',
  definition(t) {
    t.nonNull.boolean('error');
    t.nonNull.string('message');
    t.nonNull.int('statusCode');
    t.nonNull.string('errorCodeForClient');
    t.nullable.field('data', { type: 'UserData' });
  },
});

export const BasicUserInfo = objectType({
  name: 'BasicUserInfo',
  definition(t) {
    t.nonNull.string('userId');
    t.nonNull.string('email');
    t.nonNull.string('username');
    t.nonNull.string('firstname');
    t.nonNull.string('lastname');
    t.nullable.string('profilePictureMediaId');
  },
});

export const GetBasicUserInfoResponse = objectType({
  name: 'GetBasicUserInfoResponse',
  definition(t) {
    t.nonNull.boolean('error');
    t.nonNull.string('message');
    t.nonNull.int('statusCode');
    t.nonNull.string('errorCodeForClient');
    t.nullable.field('data', { type: 'BasicUserInfo' });
  },
});

export const GetBasicUserInfoByUsernameResponse = objectType({
  name: 'GetBasicUserInfoByUsernameResponse',
  definition(t) {
    t.nonNull.boolean('error');
    t.nonNull.string('message');
    t.nonNull.int('statusCode');
    t.nonNull.string('errorCodeForClient');
    t.nullable.field('data', { type: 'BasicUserInfo' });
  },
});