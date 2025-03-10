import {
  AppStoreConnectAPIOptions,
} from "appstore-connect-sdk";
import { AppStoreApi, assertRepositoryId, CreateXCodeCloudBuildInput } from "./appstore-sdk.js";

export async function startXCodeCloudBuild(
  input: AppStoreConnectAPIOptions & CreateXCodeCloudBuildInput
) {
  const { workflowName, gitRef, bundleId } = input;
  const appStoreApi = new AppStoreApi(input);

  const product = await appStoreApi.getProductByBundleId(bundleId);
  const repositoryId = assertRepositoryId(product);

  const gitReference = await appStoreApi.getGitReference(repositoryId, gitRef);
  const workflow = await appStoreApi.getWorkflowByName(
    product.id,
    workflowName
  );
  const buildRun = await appStoreApi.createBuildRun(
    workflow.id,
    gitReference.id
  );

  return {
    repositoryId,
    productId: product.id,
    workflowId: workflow.id,
    buildId: buildRun.data.id,
    buildNumber: buildRun.data.attributes.number,
  };
}
