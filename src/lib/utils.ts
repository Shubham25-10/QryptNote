export const withTimeout = <T,>(promise: Promise<T>, ms = 15000, errorMsg = 'Network request timed out. Please check your internet connection and try again.'): Promise<T> => {
  let timer: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(errorMsg)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
};
