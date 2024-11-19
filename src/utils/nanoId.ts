import { customAlphabet } from 'nanoid';

const alphabet =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

export const generateAlphaNumericId = (length: number) => {
  const nanoid = customAlphabet(alphabet, length);
  const generatedNanoid = nanoid();

  return generatedNanoid;
};

export const generateNumericId = (length: number) => {
  const nanoid = customAlphabet('0123456789', length);
  const generatedNanoid = nanoid();
  return generatedNanoid;
};
