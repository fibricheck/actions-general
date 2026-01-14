import {
  AppStoreConnectAPI,
  AppStoreConnectAPIOptions,
} from "appstore-connect-sdk";
import {
  CiBuildRunCreateRequestDataTypeEnum,
  CiBuildRunRelationshipsSourceBranchOrTagDataTypeEnum,
  CiBuildRunRelationshipsWorkflowDataTypeEnum,
  CiBuildRunsApi,
  CiProductResponse,
  CiProductsApi,
  CiProductsGetCollectionFilterProductTypeEnum,
  CiProductsGetCollectionIncludeEnum,
  CiProductsResponse,
  CiProductsWorkflowsGetToManyRelatedIncludeEnum,
  CiWorkflowsResponse,
  ScmGitReferencesResponse,
  ScmRepositoriesApi,
  ScmRepositoriesGetCollectionFieldsScmGitReferencesEnum,
} from "appstore-connect-sdk/openapi";
import { exponentialRetry, sleep } from "./utils.js";
import { PaginationHelper } from "./pagination-helper.js";

export interface CreateXCodeCloudBuildInput {
  bundleId: string;
  workflowName: string;
  gitRef: string;
}

enum InitState {
  Uninitialized,
  Initializing,
  Initialized,
}
export class AppStoreApi {
  private client: AppStoreConnectAPI;
  private ciProductsApi: CiProductsApi;
  private ciBuildRunsApi: CiBuildRunsApi;
  private scmRepositoriesApi: ScmRepositoriesApi;
  private initState = InitState.Uninitialized;

  constructor(input: AppStoreConnectAPIOptions) {
    this.client = new AppStoreConnectAPI(input);
  }

  async init() {
    while (this.initState === InitState.Initializing) {
      await sleep(100);
    }

    if (this.initState === InitState.Initialized) {
      return;
    }

    this.initState = InitState.Initializing;
    this.ciProductsApi = await this.client.create(CiProductsApi);
    this.ciBuildRunsApi = await this.client.create(CiBuildRunsApi);
    this.scmRepositoriesApi = await this.client.create(ScmRepositoriesApi);
    this.initState = InitState.Initialized;
  }

  async getProductById(productId: string) {
    await this.init();

    return await exponentialRetry(
      async () => {
        const ciProductResponse =
          await this.ciProductsApi.ciProductsGetInstance({
            id: productId,
            include: [
              CiProductsGetCollectionIncludeEnum.PrimaryRepositories,
              CiProductsGetCollectionIncludeEnum.BundleId,
            ],
          });

        return ciProductResponse.data;
      },
      { identifier: "get-repository-by-name" }
    );
  }

  async getProductByBundleId(bundleId: string) {
    await this.init();

    return await exponentialRetry(
      async () => {
        const paginated = new PaginationHelper(this.client, this.ciProductsApi.ciProductsGetCollection({
          filterProductType: [
            CiProductsGetCollectionFilterProductTypeEnum.App,
          ],
          include: [
            CiProductsGetCollectionIncludeEnum.PrimaryRepositories,
            CiProductsGetCollectionIncludeEnum.BundleId,
          ],
        }));

        while (!paginated.isDone) {
          const productResponse = await paginated.getNext()
          const foundRef = findProductByBundleId(productResponse, bundleId)
          if (foundRef) {
            return foundRef
          }
          await sleep(200);
        }

        throw new Error(`Product for bundle id ${bundleId} could not be found.`);
      },
      { identifier: "get-repository-by-name" }
    );
  }

  async getGitReference(repositoryId: string, gitRef: string) {
    await this.init();

    // When the github action is triggered too soon after pushing a tag
    // It's possible that the xcode cloud repository is not yet updated with the tag
    // So we keep retrying until we find it.
    return await exponentialRetry(
      async () => {
        const paginated = new PaginationHelper(this.client, this.scmRepositoriesApi.scmRepositoriesGitReferencesGetToManyRelated(
          {
            id: repositoryId,
            fieldsScmGitReferences: [
              ScmRepositoriesGetCollectionFieldsScmGitReferencesEnum.CanonicalName,
            ],
          }
        ))

        while (!paginated.isDone) {
          const gitReferences = await paginated.getNext()
          const foundRef = findGitReference(gitReferences, gitRef)
          if (foundRef) {
            return foundRef
          }
          await sleep(200);
        }

        throw new Error(`Git reference for ref ${gitRef} not be found.`);
      },
      {
        identifier: "get-git-reference",
      }
    );
  }

  async getWorkflowByName(productId: string, workflowName: string) {
    await this.init();

    return await exponentialRetry(
      async () => {
        const paginated = new PaginationHelper(this.client, this.ciProductsApi.ciProductsWorkflowsGetToManyRelated({
          id: productId,
          include: [
            CiProductsWorkflowsGetToManyRelatedIncludeEnum.Repository,
          ],
        }));

        while (!paginated.isDone) {
          const workflowResponse = await paginated.getNext()
          const foundRef = findWorkflow(workflowResponse, workflowName)
          if (foundRef) {
            return foundRef
          }
          await sleep(200);
        }

        throw new Error(`Workflow ${workflowName} not found`);
      },
      { identifier: "get-workflow-by-name" }
    );
  }

  async createBuildRun(workflowId: string, gitRefId: string) {
    await this.init();

    return await exponentialRetry(
      async () => {
        const buildRun = await this.ciBuildRunsApi.ciBuildRunsCreateInstance({
          ciBuildRunCreateRequest: {
            data: {
              type: CiBuildRunCreateRequestDataTypeEnum.CiBuildRuns,
              relationships: {
                workflow: {
                  data: {
                    id: workflowId,
                    type: CiBuildRunRelationshipsWorkflowDataTypeEnum.CiWorkflows,
                  },
                },
                sourceBranchOrTag: {
                  data: {
                    id: gitRefId,
                    type: CiBuildRunRelationshipsSourceBranchOrTagDataTypeEnum.ScmGitReferences,
                  },
                },
              },
            },
          },
        });

        return buildRun;
      },
      { identifier: "create-build-run" }
    );
  }
}

function findProductByBundleId(
  products: CiProductsResponse,
  bundleId: string
) {
  const product = products.data?.find(
    (tempProduct) => tempProduct.relationships?.bundleId?.data?.id === bundleId
  );

  return product;
}

export function assertRepositoryId(
  productData: CiProductResponse["data"]
): string {
  const repositoryInfo =
    productData.relationships?.primaryRepositories?.data?.find(
      (x) => x.type === "scmRepositories"
    );

  if (!repositoryInfo) {
    throw new Error(`No repository attached to product ${productData.id}`);
  }

  return repositoryInfo.id;
}

function findGitReference(
  response: ScmGitReferencesResponse,
  gitRef: string
) {
  // console.log(`Checking ${response.data.length} entries`)
  const gitReference = response.data.find(
    (reference) =>  {
      // console.log(reference.attributes.canonicalName)
      return reference.attributes.canonicalName === gitRef
    }
  );

  if (!gitReference) {
    return undefined
  }

  return gitReference;
}

function findWorkflow(
  response: CiWorkflowsResponse,
  workflowName: string
) {
  const correctWorkflow = response.data.find(
    (workflow) => workflow.attributes.name === workflowName
  );

  return correctWorkflow;
}