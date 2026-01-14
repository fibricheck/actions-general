import { ResponseError } from "appstore-connect-sdk/openapi";

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
    identifier?: string;
}

const doNotRetryCodes = [400, 401, 403, 404, 409, 422];

export async function exponentialRetry<T>(
   asyncRequest: () => Promise<T>,
   {
    maxRetries = 5,
    timeBetween = 3 * 1000,
    identifier
   }: ExponentialRetryOptions = {}
  ) {
    let retries = maxRetries;
    let waitTime = timeBetween;
  
    while (retries > 0) {
      try {
        retries--;

        const result = await asyncRequest();
        return result;
      }
      catch (error) {
        if (retries === 0 ||
          !(error instanceof ResponseError) ||
          (error instanceof ResponseError && doNotRetryCodes.includes(error.response.status))
        ) {
          throw error;
        }
      }

      await sleep(waitTime);
      waitTime *= 2;
    }
  
    throw new Error(`Request ${identifier} failed after ${maxRetries} times.`)
  }