import { CiBuildActionResponse, CiProductsResponse, ScmGitReferencesResponse } from "appstore-connect-sdk";

export function sleep(time: number) {
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

type ResponseType = CiBuildActionResponse | ScmGitReferencesResponse | CiProductsResponse

export async function exponentialRetry<T>(
  asyncRequest: () => Promise<ResponseType>,
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
    catch (error: unknown) {
      if (retries === 0) {
        throw error;
      }
    }

    await sleep(waitTime);
    waitTime *= 2;
  }

  throw new Error(`Request ${identifier} failed after ${maxRetries} times.`)
}