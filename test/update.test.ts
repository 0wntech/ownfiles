import { expect } from 'chai';

import FileClient from '../lib';

const auth = require('solid-auth-cli');
const rdf = require('rdflib');

const config = require('./podConfig.json');

const podClient = new FileClient();

describe('Update', function() {
    before('Setting up auth...', async function() {
        const credentials = await auth.getCredentials();
        await auth.login(credentials);
        podClient.fetcher = new rdf.Fetcher(podClient.graph, {
            fetch: auth.fetch,
        });
    });

    after('Cleaning up', async function() {
        return podClient.update(
            config.updateTestFile,
            config.updateTestContent,
        );
    });

    describe('update()', function() {
        it('should update the specified file', async function() {
            const content = config.updateTestContent + ' test';
            await podClient.update(config.updateTestFile, content);
            const file = await podClient.read(config.updateTestFile);
            expect(file).to.equal(content);
        });
    });
});
