import { objectType } from 'nexus';

export const UserBasicInfo = objectType({
  name: 'UserBasicInfo',
  definition(t) {
    t.nonNull.string('userId');
    t.nonNull.string('username');
    t.nonNull.string('name');
    t.nullable.string('profilePictureMediaId');
    t.nonNull.int('followersCount');
    t.nonNull.int('followingCount');
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
    t.nonNull.int('followersCount');
    t.nonNull.int('followingCount');
    t.nullable.string('bio');
    t.nullable.string('location');
    t.nullable.string('website');
    t.nullable.string('dob');
    t.nullable.list.nonNull.string('socialLinks');
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

export const UserFollowingOrFollowerData = objectType({
  name: 'UserFollowingOrFollowerData',
  definition(t) {
    t.nonNull.string('userId');
    t.nonNull.string('username');
    t.nonNull.string('name');
    t.nullable.string('profilePictureMediaId');
    t.nonNull.string('createdAt');
  },
});

export const GetUserFollowingOrFollowersListResponse = objectType({
  name: 'GetUserFollowingOrFollowersListResponse',
  definition(t) {
    t.nonNull.boolean('error');
    t.nonNull.string('message');
    t.nonNull.int('statusCode');
    t.nonNull.string('errorCodeForClient');
    t.nonNull.list.nonNull.field('data', { type: 'UserFollowingOrFollowerData' });
  },
});

export const CheckUserFollowStatusData = objectType({
  name: 'CheckUserFollowStatusData',
  definition(t) {
    t.nonNull.boolean('isFollowed');
  },
});

export const CheckUserFollowStatusResponse = objectType({
  name: 'CheckUserFollowStatusResponse',
  definition(t) {
    t.nonNull.boolean('error');
    t.nonNull.string('message');
    t.nonNull.int('statusCode');
    t.nonNull.string('errorCodeForClient');
    t.nullable.field('data', { type: 'CheckUserFollowStatusData' });
  },
});

export const RecommendedUserData = objectType({
  name: 'RecommendedUserData',
  definition(t) {
    t.nonNull.string('userId');
    t.nonNull.string('username');
    t.nonNull.string('name');
    t.nullable.string('profilePictureMediaId');
  },
});

export const RecommendedUsersData = objectType({
  name: 'RecommendedUsersData',
  definition(t) {
    t.nonNull.string('sectionId');
    t.nonNull.string('sectionTitle');
    t.nonNull.list.nonNull.field('users', { type: 'RecommendedUserData' });
  },
});

export const GetRecommendedUsersResponse = objectType({
  name: 'GetRecommendedUsersResponse',
  definition(t) {
    t.nonNull.boolean('error');
    t.nonNull.string('message');
    t.nonNull.int('statusCode');
    t.nonNull.string('errorCodeForClient');
    t.nullable.field('data', { type: 'RecommendedUsersData' });
  },
});
