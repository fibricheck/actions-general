import * as core from "@actions/core";
import { startXCodeCloudBuild } from "./core.js";

function getInput() {
  const issuerId = core.getInput("appstore-issuer-id");
  const bundleId = core.getInput("appstore-bundle-id");
  const privateKeyId = core.getInput("appstore-private-key-id");
  const privateKey = core.getInput("appstore-private-key");
  const workflowName = core.getInput("workflow-name");
  const gitRef = core.getInput("git-ref");

  return {
    issuerId,
    bundleId,
    privateKeyId,
    privateKey,
    workflowName,
    gitRef,
  };
}

try {
  const result = await startXCodeCloudBuild(getInput());
  
  core.setOutput("repository-id", result.repositoryId);
  core.setOutput("product-id", result.productId);
  core.setOutput("workflow-id", result.workflowId);
  core.setOutput("build-id", result.buildId);
  core.setOutput("build-number", result.buildNumber);
}
catch (error) {
  core.setFailed(error instanceof Error ? error.message : String(error));
}