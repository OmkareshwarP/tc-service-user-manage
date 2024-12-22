import { objectType } from 'nexus';

export const GenericResponse = objectType({
  name: 'GenericResponse',
  definition(t) {
    t.nonNull.boolean('error');
    t.nonNull.string('message');
    t.nonNull.int('statusCode');
    t.nonNull.string('errorCodeForClient');
    t.string('data');
  },
});

export const LoginResponseData = objectType({
  name: 'LoginResponseData',
  definition(t) {
    t.nonNull.boolean('isNewUser');
    t.nonNull.string('token');
  },
});

export const LoginResponse = objectType({
  name: 'LoginResponse',
  definition(t) {
    t.nonNull.boolean('error');
    t.nonNull.string('message');
    t.nonNull.int('statusCode');
    t.nonNull.string('errorCodeForClient');
    t.nullable.field('data', { type: 'LoginResponseData' });
  },
});

export const LogoutResponseData = objectType({
  name: 'LogoutResponseData',
  definition(t) {
    t.nonNull.string('userId');
  },
});

export const LogoutResponse = objectType({
  name: 'LogoutResponse',
  definition(t) {
    t.nonNull.boolean('error');
    t.nonNull.string('message');
    t.nonNull.int('statusCode');
    t.nonNull.string('errorCodeForClient');
    t.nullable.field('data', { type: 'LogoutResponseData' });
  },
});
