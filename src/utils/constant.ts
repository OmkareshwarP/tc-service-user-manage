export const signInProviders: string[] = ['google.com', 'password'];

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidUsername = (username: string): boolean => {
  if (!username) return false;
  username = username.replace(/\s+/g, '');
  if (username.length >= 4 && username.length <= 15 && /^[a-zA-Z0-9_]+$/.test(username)) {
    return true;
  }
  return false;
};

export const isValidName = (name: string): boolean => {
  if (name.length > 0 && name.length <= 35) {
    return true;
  }
  return false;
};
