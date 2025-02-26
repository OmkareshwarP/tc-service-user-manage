const getCurrentTime = () => {
  const now = Date.now();
  return now;
};

const getCurrentEpochTimestamp = (): number => {
  return +getCurrentTime();
};

export { getCurrentTime, getCurrentEpochTimestamp };
