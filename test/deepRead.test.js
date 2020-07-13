const expect = require('chai').expect;
const auth = require('solid-auth-cli');
const rdf = require('rdflib');
const config = require('./podConfig.json');
const FileClient = require('../lib/index.js');
const podClient = new FileClient();
const { createLocalStorage } = require('localStorage-ponyfill');
const localStorage = createLocalStorage({ mode: 'memory' });

describe('DeepRead', function() {
    this.timeout(config.timeOut);
    before('Setting up auth...', async function() {
        const credentials = await auth.getCredentials();
        await auth.login(credentials);
        podClient.fetcher = new rdf.Fetcher(podClient.graph, {
            fetch: auth.fetch,
        });
    });

    after('Cleaning up', async function() {
        await podClient.delete(config.podUrl + 'test/');
    });

    describe('deepRead()', function() {
        it('should deep fetch and cache a hierarchy of files from a given url', async function() {
            await podClient.createFolder(config.podUrl, { name: 'test' });
            await podClient.createFolder(config.podUrl + 'test/', {
                name: 'test',
            });
            await podClient.createFile(config.podUrl + 'test/test/', {
                name: 'testFile',
                contentType: 'text/plain',
            });
            const deepFolder = await podClient.deepRead(
                config.podUrl + 'test/',
                { cacheResult: true }
            );
            expect(deepFolder).to.deep.equal([
                config.podUrl + 'test/test/testFile.txt',
                config.podUrl + 'test/test/',
                config.podUrl + 'test/',
            ]);
            const cached = localStorage.getItem(config.podUrl + 'test/');
            expect(JSON.parse(cached)).to.deep.equal(deepFolder);
        });
    });
});
