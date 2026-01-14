import { AppStoreConnectAPI } from "appstore-connect-sdk"
import { PagedDocumentLinks } from "appstore-connect-sdk/openapi"

interface PagedResponse {
  links: PagedDocumentLinks
}

export class PaginationHelper<ResponseType extends PagedResponse> {
  private originalPromise: Promise<ResponseType>

  private nextLink?: string
  public isDone: boolean = false

  constructor(private client: AppStoreConnectAPI, firstPromise: Promise<ResponseType>) {
    this.originalPromise = firstPromise
  }

  async getNext(): Promise<ResponseType | undefined> {
    if (this.isDone) {
      return undefined
    }

    const nextLinkCopy = this.nextLink;
    if (!nextLinkCopy) {
      const response = await this.originalPromise
      this.nextLink = response?.links?.next
      if (!this.nextLink) {
        this.isDone = true;
      }

      return response;
    }

    const clientResponse = await this.client.request({
      url: nextLinkCopy
    })

    const clientJson = await clientResponse.json()
    return clientJson as unknown as ResponseType
  }
}
