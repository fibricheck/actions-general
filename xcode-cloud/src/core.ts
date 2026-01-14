import {
  AppStoreConnectAPIOptions,
} from "appstore-connect-sdk";
import { AppStoreApi, assertRepositoryId, CreateXCodeCloudBuildInput } from "./appstore-sdk.js";

export async function startXCodeCloudBuild(
  input: AppStoreConnectAPIOptions & CreateXCodeCloudBuildInput
) {
  console.log(`Creating AppStore API...`);
  const { workflowName, gitRef, bundleId } = input;
  const appStoreApi = new AppStoreApi(input);
  console.log(`AppStore API Created!`);

  console.log(`Retrieving Product ID`);
  const product = await appStoreApi.getProductByBundleId(bundleId);
  console.log(`Product retrieved: ${product.id}`);

  console.log(`Asserting Repository ID`)
  const repositoryId = assertRepositoryId(product);
  console.log(`Repository id asserted: ${repositoryId}`);

  console.log(`Retrieving Git Reference`);
  const gitReference = await appStoreApi.getGitReference(repositoryId, gitRef);
  console.log(`Git reference retrieved: ${gitReference.id}`);

  console.log(`Retrieving Workflow`);
  const workflow = await appStoreApi.getWorkflowByName(
    product.id,
    workflowName
  );
  console.log(`Workflow retrieved: ${workflow.id}`);

  console.log(`Starting build...`);
  const buildRun = await appStoreApi.createBuildRun(
    workflow.id,
    gitReference.id
  );
  console.log(`Build started, id: ${buildRun.data.id}, number: ${buildRun.data.attributes.number}`);

  return {
    repositoryId,
    productId: product.id,
    workflowId: workflow.id,
    buildId: buildRun.data.id,
    buildNumber: buildRun.data.attributes.number,
  };
}
