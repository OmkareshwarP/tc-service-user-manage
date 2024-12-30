export const signInProviders: string[] = ['google.com', 'password'];

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidUsername = (username: string): boolean => {
  if (username.length >= 8 && username.length <= 15) {
    return true;
  }
  return false;
}

export const isValidName = (name: string): boolean => {
  if (name.length > 0 && name.length <= 35) {
    return true;
  }
  return false;
}
