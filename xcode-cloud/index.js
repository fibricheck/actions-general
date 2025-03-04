import { AppStoreConnectAPI } from "appstore-connect-sdk";
import * as core from "@actions/core";
import * as github from "@actions/github";
import {
  CiBuildRunCreateRequestDataTypeEnum,
  CiBuildRunRelationshipsSourceBranchOrTagDataTypeEnum,
  CiBuildRunRelationshipsWorkflowDataTypeEnum,
  CiBuildRunsApi,
  CiProductsApi,
  CiProductsGetCollectionFilterProductTypeEnum,
  CiProductsGetCollectionIncludeEnum,
  CiProductsWorkflowsGetToManyRelatedIncludeEnum,
  ScmRepositoriesApi,
  ScmRepositoriesGetCollectionFieldsScmGitReferencesEnum,
} from "appstore-connect-sdk/openapi";

function sleep(time) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
}

function getInput() {
  const issuerId = core.getInput("appstore-issuer-id");
  const privateKeyId = core.getInput("appstore-private-key-id");
  const privateKey = core.getInput("appstore-private-key");
  const repositoryName = core.getInput("repository-name");
  const workflowName = core.getInput("workflow-name");
  const gitRef = core.getInput("git-ref");

  return {
    issuerId,
    privateKeyId,
    privateKey,
    repositoryName,
    workflowName,
    gitRef,
  };
}

function getAppStoreClient(input) {
  return new AppStoreConnectAPI({
    issuerId: input.issuerId,
    privateKeyId: input.privateKeyId,
    privateKey: input.privateKey,
  });
}

async function getRepositoryAndProduct(appstoreClient, repositoryName) {
  const ciApi = await appstoreClient.create(CiProductsApi);

  const result = await ciApi.ciProductsGetCollection({
    filterProductType: [CiProductsGetCollectionFilterProductTypeEnum.App],
    include: [
      CiProductsGetCollectionIncludeEnum.PrimaryRepositories,
      CiProductsGetCollectionIncludeEnum.BundleId,
    ],
  });

  const repository = result.included?.find(
    (includedItem) =>
      includedItem.type === "scmRepositories" &&
      includedItem.attributes.repositoryName === repositoryName
  );

  if (!repository) {
    throw new Error(`Repository ${input.repositoryName} not found`);
  }

  console.log(
    `[xcode-cloud] found repository ${repository.attributes.ownerName}/${repository.attributes.repositoryName}, id: ${repository.id}`
  );

  const product = result.data.find(
    (ciProduct) =>
      ciProduct.relationships?.primaryRepositories?.data?.find(
        (repo) => repo.id === repository.id
      ) !== undefined
  );
  if (!product) {
    throw new Error(`Product for repository ${repository.id} not be found.`);
  }

  console.log(`[xcode-cloud] found product, id: ${product.id}`);

  return { repository, product };
}

async function getWorkflow(appstoreClient, productId, workflowName) {
  const ciApi = await appstoreClient.create(CiProductsApi);

  const allWorkflows = await ciApi.ciProductsWorkflowsGetToManyRelated({
    id: productId,
    include: [CiProductsWorkflowsGetToManyRelatedIncludeEnum.Repository],
  });
  const correctWorkflow = allWorkflows.data.find(
    (workflow) => workflow.attributes.name === workflowName
  );
  if (!correctWorkflow) {
    throw new Error(`Workflow ${workflowName} not found`);
  }

  console.log(
    `[xcode-cloud] found workflow ${workflowName}, id: ${correctWorkflow.id}`
  );

  return correctWorkflow;
}

async function getGitReference(appstoreClient, repositoryId, gitRef) {
  const scmApi = await appstoreClient.create(ScmRepositoriesApi);

  let retries = 10;
  let timeBetween = 10 * 1000;
  
  while (retries > 0) {
    const names = await scmApi.scmRepositoriesGitReferencesGetToManyRelated({
      id: repositoryId,
      fieldsScmGitReferences: [
        ScmRepositoriesGetCollectionFieldsScmGitReferencesEnum.CanonicalName,
      ],
    });

    const gitReference = names.data.find(
      (reference) => reference.attributes.canonicalName === gitRef
    );

    if (!!gitReference) {
      return gitReference;
    }

    await sleep(timeBetween);
    retries--;
    timeBetween *= 1.5;
  }
  
  throw new Error(`Git reference ${gitRef} not found`);

  console.log(
    `[xcode-cloud] found git reference ${gitRef}, id: ${gitReference.id}`
  );

  return gitReference;
}

async function startBuildRun(appstoreClient, workflowId, gitRefId) {
  const buildRunApi = await appstoreClient.create(CiBuildRunsApi);

  const buildRun = await buildRunApi.ciBuildRunsCreateInstance({
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
}

try {
  const { workflowName, gitRef, ...input } = getInput();
  const appstoreClient = getAppStoreClient(input);

  const { repository, product } = await getRepositoryAndProduct(
    appstoreClient,
    input.repositoryName
  );
  const gitReference = await getGitReference(
    appstoreClient,
    repository.id,
    gitRef
  );
  const workflow = await getWorkflow(appstoreClient, product.id, workflowName);
  const buildRun = await startBuildRun(
    appstoreClient,
    workflow.id,
    gitReference.id
  );

  core.setOutput("repository-id", repository.id);
  core.setOutput("product-id", product.id);
  core.setOutput("workflow-id", workflow.id);
  core.setOutput("build-id", buildRun.id);
} catch (error) {
  core.setFailed(error.message);
}
