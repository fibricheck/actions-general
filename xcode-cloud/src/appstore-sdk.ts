import { exponentialRetry } from "./utils.js";
import { PaginationHelper } from "./pagination-helper.js";
import { AppStoreConnectConfig, ciBuildRunsCreateInstance, CiProductResponse, ciProductsGetCollection, ciProductsGetInstance, CiProductsResponse, ciProductsWorkflowsGetToManyRelated, CiWorkflowsResponse, Client, createClient, ScmGitReferencesResponse, scmRepositoriesGitReferencesGetToManyRelated } from "appstore-connect-sdk";

export interface CreateXCodeCloudBuildInput {
  bundleId: string;
  workflowName: string;
  gitRef: string;
}

export class AppStoreApi {
  private client: Client;

  constructor(input: AppStoreConnectConfig) {
    this.client = createClient(input);
  }

  async getProductById(productId: string) {
    const product = await ciProductsGetInstance({
      client: this.client,
      path: { id: productId },
      query: { include: ['primaryRepositories', 'bundleId'] }
    })

    return product.data
  }

  async getProductByBundleId(bundleId: string) {
    const paginated = new PaginationHelper(this.client, ciProductsGetCollection({
      client: this.client,
      query: {
        "filter[productType]": ['APP'],
        include: ['primaryRepositories', 'bundleId']
      }
    }));

    const productInfo = await paginated.find(x => findProductByBundleId(x, bundleId));
    if (!productInfo) {
      throw new Error(`Product for bundle id ${bundleId} could not be found.`);
    }

    return productInfo;
  }

  async getGitReference(repositoryId: string, gitRefToFind: string) {
    // When the github action is triggered too soon after pushing a tag
    // It's possible that the xcode cloud repository is not yet updated with the tag
    // So we keep retrying until we find it.
    const paginated = new PaginationHelper(this.client, scmRepositoriesGitReferencesGetToManyRelated(
      {
        client: this.client,
        path: { id: repositoryId },
        query: {
          "fields[scmGitReferences]": ['canonicalName']
        }
      }
    ))

    const gitReference = await paginated.find(x => findGitReference(x, gitRefToFind));
    if (!gitReference) {
      throw new Error(`Git reference for ref ${gitRefToFind} could not be found.`);
    }

    return gitReference;
  }

  async getWorkflowByName(productId: string, workflowName: string) {
    const paginated = new PaginationHelper(this.client, ciProductsWorkflowsGetToManyRelated({
      client: this.client,
      path: { id: productId },
      query: {
        include: ['repository']
      },
    }));

    const workflow = await paginated.find(x => findWorkflow(x, workflowName));
    if (!workflow) {
      throw new Error(`Workflow ${workflowName} not found`);
    }

    return workflow;
  }

  async createBuildRun(workflowId: string, gitRefId: string) {
    const buildRun = await ciBuildRunsCreateInstance({
      client: this.client,
      body: {
        data: {
          type: 'ciBuildRuns',
          relationships: {
            workflow: {
              data: {
                id: workflowId,
                type: 'ciWorkflows'
              }
            },
            sourceBranchOrTag: {
              data: {
                id: gitRefId,
                type: 'scmGitReferences'
              }
            }
          }
        }
      }
    });

    if (buildRun.error) {
      console.warn(buildRun.error);
    }

    return buildRun;
  }

  async cancelBuildRun(buildRunId: string) {
    const result = await this.client.delete({
      url: `/v1/ciBuildRuns/${buildRunId}`
    })

    return result;
  }
}

function findProductByBundleId(
  products: { data?: CiProductsResponse },
  bundleId: string
) {
  const product = products.data?.data?.find(
    (tempProduct) => tempProduct.relationships?.bundleId?.data?.id === bundleId
  );

  return product;
}

export function assertRepositoryId(
  productData: CiProductResponse["data"],
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
  response: { data?: ScmGitReferencesResponse },
  gitRef: string
) {
  const gitReference = response.data?.data.find(
    (reference) => {
      return reference.attributes?.canonicalName === gitRef
    }
  );

  if (!gitReference) {
    return undefined
  }

  return gitReference;
}

function findWorkflow(
  response: { data?: CiWorkflowsResponse },
  workflowName: string
) {
  const correctWorkflow = response.data?.data.find(
    (workflow) => workflow.attributes?.name === workflowName
  );

  return correctWorkflow;
}
