/* eslint-disable @typescript-eslint/no-explicit-any */
import AuthUtil from '../auth/index.js';
import { getMongoDBClient } from '../database/mongoUtil.js';
import { createNeo4jSession } from '../database/neo4jUtil.js';
import { AnalyticsEventData, IUser } from '../typeDefs.js';
import {
  deleteUserInformationByUserId,
  generateResponse,
  getCurrentEpochTimestamp,
  getUserInformationByUserId,
  logError,
  publishEventToAnalyticsChannel,
  publishMessageToBgsChannel,
} from '../utils/index.js';

export const UserAPI = () => {
  return {
    async login(inputArgs: any) {
      const { userIdentifier, provider, deviceInfo, operatingSystem } = inputArgs;
      try {
        const dbClient = getMongoDBClient();
        const _collectionName = process.env.USERS_COLLECTION;
        const user: IUser = (await dbClient.collection(_collectionName).findOne({ email: userIdentifier })) as any;
        if (user) {
          const token = await AuthUtil().generateToken({
            userId: user.userId,
            provider,
            userIdentifier: user.email,
            deviceInfo,
            operatingSystem,
          });
          return generateResponse(false, 'User successfully logged in', '', 200, {
            isNewUser: false,
            token,
          });
        } else {
          return generateResponse(true, 'User does not exists', 'userNotFound', 404, {
            isNewUser: true,
            token: '',
          });
        }
      } catch (error) {
        throw error;
      }
    },
    async createUser(inputArgs: any) {
      try {
        const { userId, email, provider, name, username, profilePictureMediaId, signUpIpv4Address } = inputArgs;

        const _userData = {
          userId,
          email,
          provider,
          name,
          username,
          bio: null,
          dob: null,
          location: null,
          website: null,
          followersCount: 0,
          followingCount: 0,
          profilePictureMediaId,
          signUpIpv4Address,
          moderationStatus: 'unmoderated',
          deletionStatus: 'notdeleted',
          internalTags: [],
          profileLink: null,
          profileRejectionReasons: [],
          socialLinks: [],
          createdAt: getCurrentEpochTimestamp(),
          updatedAt: getCurrentEpochTimestamp(),
        };

        const dbClient = getMongoDBClient();
        const _collectionName = process.env.USERS_COLLECTION;

        try {
          await dbClient.collection(_collectionName).insertOne({ ..._userData });
        } catch (err) {
          if (err.code === 11000) {
            const field = Object.keys(err.keyPattern)[0];
            return generateResponse(true, `${field} already exists`, `${field}AlreadyExists`, 400, null);
          } else {
            throw err;
          }
        }

        const session = createNeo4jSession();
        const neo4jRoot = process.env.NEO4J_ROOT;
        const userNode = `${neo4jRoot}:${userId}`;
        try {
          await session.run(
            `MERGE (u:User {id: $userNode})
            ON CREATE SET u.userId = $userId, u.name = $name, u.username = $username, u.profilePictureMediaId = $profilePictureMediaId, u.joinedAt = $joinedAt`,
            { userNode, userId, name, username, profilePictureMediaId, joinedAt: _userData.createdAt }
          );
        } catch (error) {
          throw error;
        } finally {
          await session.close();
        }

        const bgMessageData: any = {
          messageName: 'userSignedUp',
          entityId: userId,
          entityType: 'user',
        };
        publishMessageToBgsChannel(bgMessageData);

        const analyticsEventData: AnalyticsEventData = {
          eventName: 'userInfoEvent',
          entityId: userId,
          entityType: 'user',
          typeOfOperation: 'create',
        };
        publishEventToAnalyticsChannel(analyticsEventData);

        return generateResponse(false, 'User created successfully', '', 200, 'done');
      } catch (error) {
        throw error;
      }
    },
    async logout(userId: string, authorization: string) {
      try {
        const user = await getUserInformationByUserId(userId);
        if (!user) {
          return generateResponse(true, 'Something went wrong. Please try again', 'invalidUser', 403, null);
        }

        await AuthUtil().deleteParticularTokenByUserId(userId, authorization);
        return generateResponse(false, 'User has been logged out successfully', '', 200, 'done');
      } catch (error) {
        throw error;
      }
    },
    async checkUsernameStatus(username: string) {
      try {
        const dbClient = getMongoDBClient();
        const _collectionName = process.env.USERS_COLLECTION;
        const userData = (await dbClient.collection(_collectionName).findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } })) as any;
        let isUsernameAvailable = false;
        if (!userData?.username) {
          isUsernameAvailable = true;
        }
        return generateResponse(false, 'Username status fetched successfully', '', 200, { isUsernameAvailable });
      } catch (error) {
        throw error;
      }
    },
    async getUserBasicInfo(userId: string) {
      try {
        const user = await getUserInformationByUserId(userId);
        if (!user) {
          return generateResponse(true, 'User does not exists', 'userNotFound', 404, null);
        }
        return generateResponse(false, 'User basic info fetched successfully', '', 200, user);
      } catch (error) {
        throw error;
      }
    },
    async getUserInfo(userId: string) {
      try {
        const user = await getUserInformationByUserId(userId);
        if (!user) {
          return generateResponse(true, 'User does not exists', 'userNotFound', 404, null);
        }
        return generateResponse(false, 'User info fetched successfully', '', 200, user);
      } catch (error) {
        throw error;
      }
    },
    async getUserInfoByUsername(username: string) {
      try {
        const dbClient = getMongoDBClient();
        const _collectionName = process.env.USERS_COLLECTION;
        const userData = (await dbClient.collection(_collectionName).findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } })) as any;
        if (!userData?.username) {
          return generateResponse(true, 'User does not exists', 'userNotFound', 404, null);
        }
        return generateResponse(false, 'User info fetched successfully', '', 200, userData);
      } catch (error) {
        throw error;
      }
    },
    async followUser(followeeUserId: string, followerUserId: string) {
      try {
        const session = createNeo4jSession();
        const neo4jRoot = process.env.NEO4J_ROOT;
        const followerUserNode = `${neo4jRoot}:${followerUserId}`;
        const followeeUserNode = `${neo4jRoot}:${followeeUserId}`;
        const currentEpochTimestamp = getCurrentEpochTimestamp();

        try {
          const result = await session.run(
            `MATCH (follower:User {id: $followerUserNode})
            OPTIONAL MATCH (followee:User {id: $followeeUserNode})
            WITH COUNT(follower) > 0 AS isFollowerExists, COUNT(followee) > 0 AS isFolloweeExists, follower, followee
            OPTIONAL MATCH (follower)-[r:FOLLOWS]->(followee)
            WITH isFollowerExists, isFolloweeExists, COUNT(r) AS relationshipCount
            RETURN isFollowerExists, isFolloweeExists, relationshipCount;`,
            { followerUserNode, followeeUserNode }
          );

          const record = result.records[0];
          const isFollowerExists = record.get('isFollowerExists');
          const isFolloweeExists = record.get('isFolloweeExists');
          const relationshipCount = record.get('relationshipCount').toNumber();

          if (!isFollowerExists || !isFolloweeExists) {
            logError('One or both users do not exist', 'oneOrBothUsersDoNotExist', 5, { followeeUserId, followerUserId, relationshipCount });
            return generateResponse(true, `One or both users do not exist`, 'userNotFound', 404, '');
          }

          if (relationshipCount > 0) {
            return generateResponse(false, `User followed successfully`, '', 200, 'done');
          }

          await session.run(
            `MATCH (follower:User {id: $followerUserNode}), (followee:User {id: $followeeUserNode})
             MERGE (follower)-[r:FOLLOWS]->(followee)
             ON CREATE SET r.createdAt = $currentEpochTimestamp
             `,
            { followerUserNode, followeeUserNode, currentEpochTimestamp }
          );
        } catch (error) {
          throw error;
        } finally {
          await session.close();
        }

        const dbClient = getMongoDBClient();
        const _collectionName = process.env.USERS_COLLECTION;
        await dbClient
          .collection(_collectionName)
          .updateOne({ userId: followeeUserId }, { $inc: { followersCount: 1 }, $set: { updatedAt: currentEpochTimestamp } });
        await deleteUserInformationByUserId(followeeUserId);

        const followeeBgMessageData: any = {
          messageName: 'userUpdated',
          entityId: followeeUserId,
          entityType: 'user',
        };
        publishMessageToBgsChannel(followeeBgMessageData);

        const followeeAnalyticsEventData: AnalyticsEventData = {
          eventName: 'userInfoEvent',
          entityId: followeeUserId,
          entityType: 'user',
          typeOfOperation: 'update',
        };
        publishEventToAnalyticsChannel(followeeAnalyticsEventData);

        await dbClient
          .collection(_collectionName)
          .updateOne({ userId: followerUserId }, { $inc: { followingCount: 1 }, $set: { updatedAt: currentEpochTimestamp } });
        await deleteUserInformationByUserId(followerUserId);

        const followerBgMessageData: any = {
          messageName: 'userUpdated',
          entityId: followerUserId,
          entityType: 'user',
        };
        publishMessageToBgsChannel(followerBgMessageData);

        const followerAnalyticsEventData: AnalyticsEventData = {
          eventName: 'userInfoEvent',
          entityId: followerUserId,
          entityType: 'user',
          typeOfOperation: 'update',
        };
        publishEventToAnalyticsChannel(followerAnalyticsEventData);

        return generateResponse(false, `User followed successfully`, '', 200, 'done');
      } catch (error) {
        throw error;
      }
    },
    async unFollowUser(followeeUserId: string, followerUserId: string) {
      try {
        const session = createNeo4jSession();
        const neo4jRoot = process.env.NEO4J_ROOT;
        const followerUserNode = `${neo4jRoot}:${followerUserId}`;
        const followeeUserNode = `${neo4jRoot}:${followeeUserId}`;
        try {
          const result = await session.run(
            `MATCH (follower:User {id: $followerUserNode})-[r:FOLLOWS]->(followee:User {id: $followeeUserNode})
             DELETE r
             RETURN COUNT(r) AS deletedCount`,
            { followerUserNode, followeeUserNode }
          );

          const deletedCount = result.records[0]?.get('deletedCount').toNumber();
          if (deletedCount === 0) {
            return generateResponse(false, `User unfollowed successfully`, '', 200, 'done');
          }
        } catch (error) {
          throw error;
        } finally {
          await session.close();
        }

        const dbClient = getMongoDBClient();
        const _collectionName = process.env.USERS_COLLECTION;
        const currentEpochTimestamp = getCurrentEpochTimestamp();
        await dbClient
          .collection(_collectionName)
          .updateOne({ userId: followeeUserId }, { $inc: { followersCount: -1 }, $set: { updatedAt: currentEpochTimestamp } });
        await deleteUserInformationByUserId(followeeUserId);

        const followeeBgMessageData: any = {
          messageName: 'userUpdated',
          entityId: followeeUserId,
          entityType: 'user',
        };
        publishMessageToBgsChannel(followeeBgMessageData);

        const followeeAnalyticsEventData: AnalyticsEventData = {
          eventName: 'userInfoEvent',
          entityId: followeeUserId,
          entityType: 'user',
          typeOfOperation: 'update',
        };
        publishEventToAnalyticsChannel(followeeAnalyticsEventData);

        await dbClient
          .collection(_collectionName)
          .updateOne({ userId: followerUserId }, { $inc: { followingCount: -1 }, $set: { updatedAt: currentEpochTimestamp } });
        await deleteUserInformationByUserId(followerUserId);

        const followerBgMessageData: any = {
          messageName: 'userUpdated',
          entityId: followerUserId,
          entityType: 'user',
        };
        publishMessageToBgsChannel(followerBgMessageData);

        const followerAnalyticsEventData: AnalyticsEventData = {
          eventName: 'userInfoEvent',
          entityId: followerUserId,
          entityType: 'user',
          typeOfOperation: 'update',
        };
        publishEventToAnalyticsChannel(followerAnalyticsEventData);

        return generateResponse(false, `User unfollowed successfully`, '', 200, 'done');
      } catch (error) {
        throw error;
      }
    },
    async getFollowersListByUserId(userId: string, lastCreatedAt: number) {
      try {
        const user = await getUserInformationByUserId(userId);
        if (!user) {
          return generateResponse(true, 'User does not exists.', 'userNotFound', 404, []);
        }

        const pageSize = '10';
        lastCreatedAt = lastCreatedAt || getCurrentEpochTimestamp();

        const session = createNeo4jSession();
        const neo4jRoot = process.env.NEO4J_ROOT;
        const userNodeId = `${neo4jRoot}:${userId}`;

        const query = `
          MATCH (follower:User)-[r:FOLLOWS]->(followee:User {id: $userNodeId})
          WHERE r.createdAt < $lastCreatedAt
          RETURN follower.userId AS userId, 
                follower.name AS name, 
                follower.username AS username, 
                follower.profilePictureMediaId AS profilePictureMediaId, 
                r.createdAt AS createdAt
          ORDER BY r.createdAt DESC
          LIMIT ${pageSize} 
        `;

        const result = await session.run(query, { userNodeId, lastCreatedAt });

        const usersData = [];
        result.records.map((record, i) => {
          usersData[i] = {
            userId: record.get('userId'),
            name: record.get('name'),
            username: record.get('username'),
            profilePictureMediaId: record.get('profilePictureMediaId'),
            createdAt: record.get('createdAt'),
          };
        });

        return generateResponse(false, `User follwers fetched successfully`, '', 200, usersData);
      } catch (error) {
        throw error;
      }
    },
    async getFollowingListByUserId(userId: string, lastCreatedAt: number) {
      try {
        const user = await getUserInformationByUserId(userId);
        if (!user) {
          return generateResponse(true, 'User does not exists.', 'userNotFound', 404, []);
        }

        const pageSize = '10';
        lastCreatedAt = lastCreatedAt || getCurrentEpochTimestamp();

        const session = createNeo4jSession();
        const neo4jRoot = process.env.NEO4J_ROOT;
        const userNodeId = `${neo4jRoot}:${userId}`;

        const query = `
          MATCH (follower:User {id: $userNodeId})-[r:FOLLOWS]->(followee:User)
          WHERE r.createdAt < $lastCreatedAt
          RETURN followee.userId AS userId, 
                followee.name AS name, 
                followee.username AS username, 
                followee.profilePictureMediaId AS profilePictureMediaId, 
                r.createdAt AS createdAt
          ORDER BY r.createdAt DESC
          LIMIT ${pageSize}
        `;

        const result = await session.run(query, { userNodeId, lastCreatedAt });

        const usersData = [];
        result.records.map((record, i) => {
          usersData[i] = {
            userId: record.get('userId'),
            name: record.get('name'),
            username: record.get('username'),
            profilePictureMediaId: record.get('profilePictureMediaId'),
            createdAt: record.get('createdAt'),
          };
        });

        return generateResponse(false, `Following users fetched successfully`, '', 200, usersData);
      } catch (error) {
        throw error;
      }
    },
  };
};
