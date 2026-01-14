import "@dotenvx/dotenvx/config";
import { describe, test, expect, afterAll } from "@jest/globals";
import { AppStoreApi, assertRepositoryId } from "./appstore-sdk.js";

const api = new AppStoreApi({
  issuerId: process.env.ISSUER_ID,
  privateKeyId: process.env.PRIVATE_KEY_ID,
  privateKey: process.env.PRIVATE_KEY,
});

const bundleId = process.env.BUNDLE_ID;

describe("api test", () => {
  test("can retrieve repository and product", async () => {
    const product = await api.getProductByBundleId(bundleId);
    const repositoryId = assertRepositoryId(product);

    expect(repositoryId).toBeDefined();
    expect(product.id).toBeDefined();
  });

  test("can retrieve git reference", async () => {
    const gitReference = await api.getGitReference(
      process.env.REPOSITORY_ID,
      process.env.GIT_REF
    );
    expect(gitReference.id).toBeDefined();
  });

  test("can retrieve workflow", async () => {
    const workflow = await api.getWorkflowByName(
      process.env.PRODUCT_ID,
      process.env.WORKFLOW_NAME
    );
    expect(workflow.id).toBeDefined();
  });
});
