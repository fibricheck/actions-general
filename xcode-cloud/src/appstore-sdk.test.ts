import "@dotenvx/dotenvx/config";
import { describe, test, expect } from "@jest/globals";
import { AppStoreApi, assertRepositoryId } from "./appstore-sdk.js";
import { cancelXCodeCloudBuild, startXCodeCloudBuild } from "./core.js";

const api = new AppStoreApi({
  issuerId: process.env.ISSUER_ID,
  privateKeyId: process.env.PRIVATE_KEY_ID,
  privateKey: process.env.PRIVATE_KEY,
});

const bundleId = process.env.BUNDLE_ID!!;

describe("api test", () => {
  test("can retrieve repository and product", async () => {
    const product = await api.getProductByBundleId(bundleId);
    const repositoryId = assertRepositoryId(product);

    expect(repositoryId).toBeDefined();
    expect(product.id).toBeDefined();
  });

  test("can paginate through all product pages", async () => {
    await expect(api.getProductByBundleId("not existent")).rejects.toThrow();
  });

  test("can retrieve git reference", async () => {
    const gitReference = await api.getGitReference(
      process.env.REPOSITORY_ID!!,
      process.env.GIT_REF!!,
    );
    expect(gitReference.id).toBeDefined();
  }, 20_000);

  test("can paginate through all git references", async () => {
    await expect(
      api.getGitReference(process.env.REPOSITORY_ID!!, "non existent"),
    ).rejects.toThrow();
  }, 20_000);

  test("can retrieve workflow", async () => {
    const workflow = await api.getWorkflowByName(
      process.env.PRODUCT_ID!!,
      process.env.WORKFLOW_NAME!!,
    );
    expect(workflow.id).toBeDefined();
  });

  test("can paginate through all workflows", async () => {
    await expect(
      api.getWorkflowByName(process.env.PRODUCT_ID!!, "non existent"),
    ).rejects.toThrow();
  });

  // test("can build and cancel", async () => {
  //   const buildResult = await startXCodeCloudBuild({
  //     issuerId: process.env.ISSUER_ID!!,
  //     bundleId: bundleId!!,
  //     privateKeyId: process.env.PRIVATE_KEY_ID!!,
  //     privateKey: process.env.PRIVATE_KEY!!,
  //     workflowName: process.env.WORKFLOW_NAME!!,
  //     gitRef: process.env.GIT_REF!!,
  //   })

  //   expect(buildResult.buildId).toBeDefined();

  //   const cancelResult = await cancelXCodeCloudBuild({
  //     issuerId: process.env.ISSUER_ID!!,
  //     privateKeyId: process.env.PRIVATE_KEY_ID!!,
  //     privateKey: process.env.PRIVATE_KEY!!,
  //     buildId: buildResult.buildId!
  //   })

  //   expect(cancelResult).toBeDefined();
  // }, 20000)
});
