import { Client } from 'cassandra-driver';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { createWriteStream } from 'fs';
import { Readable } from 'stream';
import { logData, logError } from '../utils/index.js';

let currentCassandraDBInstance: Client;

export const initializeCassandraDBClient = async () => {
  await downloadConnectionBundleFromS3();
  currentCassandraDBInstance = new Client({
    cloud: {
      secureConnectBundle: process.env.ASTRA_DB_SECURE_CONNECT_BUNDLE_PATH,
    },
    credentials: {
      username: process.env.ASTRA_DB_CLIENT_ID,
      password: process.env.ASTRA_DB_CLIENT_SECRET,
    },
  });

  currentCassandraDBInstance
    .connect()
    .then((data) => {
      logData('Connected to Astra DB', 'astraReady', 1, data);
    })
    .catch((err) => {
      logError(
        'Failed to create Astra DB connection',
        'astraConnectionError',
        10,
        err
      );
      process.exit(1);
    });
};

const downloadConnectionBundleFromS3 = async () => {
  const accessKeyId = process.env.S3_AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_AWS_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('Missing required environment variables.');
  }

  const s3Client = new S3Client({
    region: process.env.S3_AWS_REGION,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
  const getObjectCommand = new GetObjectCommand({
    Bucket: process.env.ASTRA_DB_CONNECTION_BUNDLE_BUCKET,
    Key: process.env.ASTRA_DB_CONNECTION_BUNDLE_PATH,
  });

  const response = await s3Client.send(getObjectCommand);

  if (response.Body) {
    const writeStream = createWriteStream(
      process.env.ASTRA_DB_SECURE_CONNECT_BUNDLE_PATH,
    );

    await new Promise((resolve, reject) => {
      if (response.Body instanceof Readable) {
        response.Body.pipe(writeStream)
          .on('close', resolve)
          .on('error', reject);
      }
    });
  }
};

export const getCassandraDBClient = (): Client => {
  if (currentCassandraDBInstance === null) {
    throw new Error('Cassandra DB client has not been initialized.');
  }
  return currentCassandraDBInstance;
};
