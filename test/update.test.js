const expect = require('chai').expect;
const auth = require('solid-auth-cli');
const rdf = require('rdflib');
const PodClient = require('../lib/index.js');
const config = require('./podConfig.json');
const podClient = new PodClient();

describe('Update', function() {
    this.timeout(config.timeOut);
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
            console.log(file);
            expect(file).to.equal(content);
        });
    });
});
