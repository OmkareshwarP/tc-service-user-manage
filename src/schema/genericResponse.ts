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

export const LoginData = objectType({
  name: 'LoginData',
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
    t.nullable.field('data', { type: 'LoginData' });
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
