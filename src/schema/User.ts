import { objectType } from 'nexus';

export const UserBasicInfo = objectType({
  name: 'UserBasicInfo',
  definition(t) {
    t.nonNull.string('userId');
    t.nonNull.string('username');
    t.nonNull.string('name');
    t.nullable.string('profilePictureMediaId');
  },
});

export const GetUserBasicInfoResponse = objectType({
  name: 'GetUserBasicInfoResponse',
  definition(t) {
    t.nonNull.boolean('error');
    t.nonNull.string('message');
    t.nonNull.int('statusCode');
    t.nonNull.string('errorCodeForClient');
    t.nullable.field('data', { type: 'UserBasicInfo' });
  },
});

export const UserData = objectType({
  name: 'UserData',
  definition(t) {
    t.nonNull.string('userId');
    t.nonNull.string('email');
    t.nonNull.string('username');
    t.nonNull.string('name');
    t.nullable.string('profilePictureMediaId');
    t.nullable.string('bio');
    t.nullable.string('location');
    t.nullable.string('website');
    t.nullable.string('dob');
    t.nonNull.string('createdAt');
    t.nonNull.string('updatedAt');
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
