import '@dotenvx/dotenvx/config';
import { describe, test, expect, afterAll } from '@jest/globals'
import { AppStoreApi } from './appstore-sdk.js';

const api = new AppStoreApi({
    issuerId: process.env.ISSUER_ID,
    privateKeyId: process.env.PRIVATE_KEY_ID,
    privateKey: process.env.PRIVATE_KEY
});

const repositoryName = process.env.REPOSITORY_NAME;

describe('api test', () => {
    test('can retrieve repository and product', async () => {
        const {
            repository,
            product
        } = await api.getRepositoryAndProductByName(
            repositoryName
        )

        expect(repository.id).toBeDefined();
        expect(product.id).toBeDefined();

        console.log(repository.id)
        console.log(product.id)
    });

    test('can retrieve git reference', async () => {
        const gitReference = await api.getGitReference(process.env.REPOSITORY_ID, process.env.GIT_REF);
        expect(gitReference.id).toBeDefined();
    });

    test('can retrieve workflow', async () => {
        const workflow = await api.getWorkflowByName(process.env.PRODUCT_ID, process.env.WORKFLOW_NAME);
        expect(workflow.id).toBeDefined();
    })
})