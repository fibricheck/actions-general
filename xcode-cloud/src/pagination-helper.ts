import { Client, PagedDocumentLinks } from "appstore-connect-sdk"
import { sleep } from "./utils.js"

interface PagedResponse<D, E> {
  data?: D & {
    links?: PagedDocumentLinks
  },
  error?: E
}

export class PaginationHelper<D, E> {
  private originalPromise: Promise<PagedResponse<D, E>>

  private nextLink?: string
  public isDone: boolean = false

  constructor(private client: Client, firstPromise: Promise<PagedResponse<D, E>>) {
    this.originalPromise = firstPromise
  }

  async getNext(): Promise<PagedResponse<D, E> | undefined> {
    if (this.isDone) {
      return undefined
    }

    const response = this.nextLink ?
      await this.client.get({
        security: [{ scheme: "bearer", type: "http" }],
        url: this.nextLink
      }) as unknown as PagedResponse<D, E> :
      await this.originalPromise

    if (response.error) {
      console.warn(JSON.stringify(response.error, undefined, '  '))
    }

    this.nextLink = toRelativePath(response.data?.links?.next);
    if (!this.nextLink) {
      this.isDone = true;
    }

    return response
  }

  async find<T>(transform: (x: PagedResponse<D, E>) => T | undefined, wait = 250): Promise<T | undefined> {
    while (!this.isDone) {
      const response = await this.getNext()
      if (!response) {
        return undefined;
      }

      const validatorResult = transform(response)
      if (validatorResult) {
        return validatorResult;
      }

      await sleep(wait);
    }
  }
}

function toRelativePath(url?: string) {
  if (!url) return undefined;

  const index = url.indexOf('/v1');
  if (index === -1) throw new Error(`Unexpected URL format, no /v1 found: ${url}`);
  return url.slice(index);
}
