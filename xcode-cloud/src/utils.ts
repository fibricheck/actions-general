export function sleep(time) {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
}

interface ExponentialRetryOptions {
    maxRetries?: number;
    timeBetween?: number;
    timeMultiplier?: number;
    identifier?: string;
}

export async function exponentialRetry<T>(
   asyncRequest: () => Promise<T>,
   {
    maxRetries = 10,
    timeBetween = 10 * 1000,
    timeMultiplier = 1.5,
    identifier
   }: ExponentialRetryOptions = {}
  ) {
    let retries = maxRetries;
    let waitTime = timeBetween;
  
    while (retries > 0) {
      try {
        retries--;

        const result = await asyncRequest();
        if (result !== undefined) {
          return result;
        }

        await sleep(waitTime);
        waitTime *= timeMultiplier;
      }
      catch (error) {
        console.warn(error);
        if (retries === 0) {
          throw error;
        }
      }
    }
  
    throw new Error(`Request ${identifier} failed after ${maxRetries} times.`)
  }