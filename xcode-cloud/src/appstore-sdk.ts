import { AppStoreConnectAPI, AppStoreConnectAPIOptions } from "appstore-connect-sdk";
import { CiBuildRunCreateRequestDataTypeEnum, CiBuildRunRelationshipsSourceBranchOrTagDataTypeEnum, CiBuildRunRelationshipsWorkflowDataTypeEnum, CiBuildRunsApi, CiProductsApi, CiProductsGetCollectionFilterProductTypeEnum, CiProductsGetCollectionIncludeEnum, CiProductsResponse, CiProductsResponseIncludedInner, CiProductsWorkflowsGetToManyRelatedIncludeEnum, CiWorkflowResponse, CiWorkflowsResponse, ScmGitReferencesResponse, ScmRepositoriesApi, ScmRepositoriesGetCollectionFieldsScmGitReferencesEnum } from "appstore-connect-sdk/openapi";
import { exponentialRetry, sleep } from "./utils.js";

export interface CreateXCodeCloudBuildInput {
  repositoryName: string;
  workflowName: string;
  gitRef: string;
};

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

  async getRepositoryAndProductByName(repositoryName: string) {
    await this.init();

     return await exponentialRetry(async () => {
        const ciProductResponse = await this.ciProductsApi.ciProductsGetCollection({
          filterProductType: [CiProductsGetCollectionFilterProductTypeEnum.App],
          include: [
            CiProductsGetCollectionIncludeEnum.PrimaryRepositories,
            CiProductsGetCollectionIncludeEnum.BundleId,
          ],
        });
        
        const repository = assertRepositoryExists(ciProductResponse, repositoryName);
        const product = assertProductExists(ciProductResponse, repository.id);

        return {
          repository,
          product
        };
      }, { identifier: 'get-repository-by-name' })
  }

  async getGitReference(
    repositoryId: string,
    gitRef: string
  ) {
    await this.init();

    // When the github action is triggered too soon after pushing a tag
    // It's possible that the xcode cloud repository is not yet updated with the tag
    // So we keep retrying until we find it.
    return await exponentialRetry(async () => {
      const gitReferences = await this.scmRepositoriesApi.scmRepositoriesGitReferencesGetToManyRelated({
        id: repositoryId,
        fieldsScmGitReferences: [
          ScmRepositoriesGetCollectionFieldsScmGitReferencesEnum.CanonicalName,
        ],
      });
  
      return assertGitReferenceExists(gitReferences, gitRef);
    }, {
      identifier: 'get-git-reference'
    })
  }

  async getWorkflowByName(
    productId: string,
    workflowName: string
  ) {
    await this.init();

    return await exponentialRetry(async () => {
      const allWorkflows = await this.ciProductsApi.ciProductsWorkflowsGetToManyRelated({
        id: productId,
        include: [CiProductsWorkflowsGetToManyRelatedIncludeEnum.Repository],
      });
      
     
      return await assertWorkflowExists(allWorkflows, workflowName);
    }, { identifier: 'get-workflow-by-name'});
  }

  async createBuildRun(
    workflowId: string,
    gitRefId: string
  ) {
    await this.init();

    return await exponentialRetry(async () => {
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
      })

      return buildRun;
    }, { identifier: 'create-build-run' });
  }
}

function assertRepositoryExists(response: CiProductsResponse, repositoryName: string): CiProductsResponseIncludedInner {
  const repository = response.included?.find(
    (includedItem) =>
      includedItem.type === "scmRepositories" &&
      includedItem.attributes.repositoryName === repositoryName
  );

  if (!repository) {
    throw new Error(`Repository ${repositoryName} not found`);
  }

  return repository;
}

function assertProductExists(response: CiProductsResponse, repositoryId: string) {
  const product = response.data.find(
    (ciProduct) =>
      ciProduct.relationships?.primaryRepositories?.data?.find(
        (repo) => repo.id === repositoryId
      ) !== undefined
  );

  if (!product) {
    throw new Error(`Product for repository ${repositoryId} not be found.`);
  }

  return product;
}

function assertGitReferenceExists(response: ScmGitReferencesResponse, gitRef: string) {
  const gitReference = response.data.find(
    (reference) => reference.attributes.canonicalName === gitRef
  );

  if (!gitReference) {
    throw new Error(`Git reference for ref ${gitRef} not be found.`);
  }

  return gitReference;
}

function assertWorkflowExists(response: CiWorkflowsResponse, workflowName: string) {
  const correctWorkflow = response.data.find(
    (workflow) => workflow.attributes.name === workflowName
  );
  
  if (!correctWorkflow) {
    throw new Error(`Workflow ${workflowName} not found`);
  }

  return correctWorkflow;
}