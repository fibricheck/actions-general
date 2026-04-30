import { AppStoreConnectConfig } from "appstore-connect-sdk";
import { AppStoreApi, assertRepositoryId, CreateXCodeCloudBuildInput } from "./appstore-sdk.js";
import * as core from "@actions/core";

export async function startXCodeCloudBuild(
  input: AppStoreConnectConfig & CreateXCodeCloudBuildInput
) {
  core.debug(`Creating AppStore API...`);
  const { workflowName, gitRef, bundleId } = input;
  const appStoreApi = new AppStoreApi(input);
  core.debug(`AppStore API Created!`);

  core.debug(`Retrieving Product ID`);
  const product = await appStoreApi.getProductByBundleId(bundleId);
  core.debug(`Product retrieved: ${product.id}`);

  core.debug(`Asserting Repository ID`)
  const repositoryId = assertRepositoryId(product);
  core.debug(`Repository id asserted: ${repositoryId}`);

  core.debug(`Retrieving Git Reference`);
  const gitReference = await appStoreApi.getGitReference(repositoryId, gitRef);
  core.debug(`Git reference retrieved: ${gitReference.id}`);

  core.debug(`Retrieving Workflow`);
  const workflow = await appStoreApi.getWorkflowByName(
    product.id,
    workflowName
  );
  core.debug(`Workflow retrieved: ${workflow.id}`);

  core.debug(`Starting build...`);
  const buildRun = await appStoreApi.createBuildRun(
    workflow.id,
    gitReference.id
  );
  core.debug(`Build started, id: ${buildRun?.data?.data?.id}, number: ${buildRun?.data?.data?.attributes?.number}`);

  return {
    repositoryId,
    productId: product.id,
    workflowId: workflow.id,
    buildId: buildRun?.data?.data?.id,
    buildNumber: buildRun?.data?.data?.attributes?.number,
  };
}

export async function cancelXCodeCloudBuild(
  input: AppStoreConnectConfig & { buildId: string }
) {
  core.debug(`Creating AppStore API...`);
  const { buildId } = input;
  const appStoreApi = new AppStoreApi(input);
  core.debug(`AppStore API Created!`);

  const result = await appStoreApi.cancelBuildRun(buildId)
  return result.data;
}
