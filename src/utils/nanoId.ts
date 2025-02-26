import { customAlphabet, nanoid } from 'nanoid';

const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

export const generateAlphaNumericId = (length: number) => {
  const customNanoid = customAlphabet(alphabet, length);
  const generatedNanoid = customNanoid();
  return generatedNanoid;
};

export const generateNumericId = (length: number) => {
  const customNanoid = customAlphabet('0123456789', length);
  const generatedNanoid = customNanoid();
  return generatedNanoid;
};

export const generateNanoId = (length: number) => {
  const generatedNanoid = nanoid(length);
  return generatedNanoid;
};
