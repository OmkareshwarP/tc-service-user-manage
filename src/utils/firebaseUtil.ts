import { ServiceAccount, cert, initializeApp } from 'firebase-admin/app';
import admin from 'firebase-admin';
import { logData, logError } from './index.js';
import { GraphQLError } from 'graphql';

export const initializeFirebaseApp = async () => {
  try {
    // if (!initializeApp.name) {
    const credentials: ServiceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
    initializeApp({
      credential: cert(credentials),
    });
    logData('Firebase initialized successfully.', 'firebaseReady', 2, '');
    // }
  } catch (error) {
    logError(error.message, 'firebaseInitializeError', 5, error);
  }
};

const unAuthenticatedOptions = {
  extensions: {
    code: 'UNAUTHENTICATED',
    http: { status: 401 },
  },
};

export const verifyFirebaseToken = async (token: string, userIdentifier: string) => {
  try {
    if (!token || token?.length <= 5) {
      throw new GraphQLError('Token Not Found', unAuthenticatedOptions);
    }
    if (!userIdentifier || userIdentifier?.length <= 5) {
      throw new GraphQLError('Invalid User', unAuthenticatedOptions);
    }
    const decodedToken = await admin.auth().verifyIdToken(token);
    const _email = decodedToken.email;
    const _userId = decodedToken.uid;
    if (decodedToken && _email?.length > 5 && _email === userIdentifier) {
      return { userId: _userId, email: _email };
    }
    throw new GraphQLError('User is not authenticated', unAuthenticatedOptions);
  } catch (err) {
    if (err.code == 'auth/id-token-expired') {
      throw new GraphQLError('Token Expired', unAuthenticatedOptions);
    }
    throw err;
  }
};
