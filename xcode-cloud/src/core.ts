import {
  AppStoreConnectAPIOptions,
} from "appstore-connect-sdk";
import { AppStoreApi, CreateXCodeCloudBuildInput } from "./appstore-sdk.js";

export async function startXCodeCloudBuild(
  input: AppStoreConnectAPIOptions & CreateXCodeCloudBuildInput
) {
  const { workflowName, gitRef, repositoryName } = input;
  const appStoreApi = new AppStoreApi(input);

  const { repository, product } =
    await appStoreApi.getRepositoryAndProductByName(repositoryName);
  const gitReference = await appStoreApi.getGitReference(repository.id, gitRef);
  const workflow = await appStoreApi.getWorkflowByName(
    product.id,
    workflowName
  );
  const buildRun = await appStoreApi.createBuildRun(
    workflow.id,
    gitReference.id
  );

  return {
    repositoryId: repository.id,
    productId: product.id,
    workflowId: workflow.id,
    buildId: buildRun.data.id,
    buildNumber: buildRun.data.attributes.number,
  };
}
