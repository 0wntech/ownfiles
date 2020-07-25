const expect = require('chai').expect;
const auth = require('solid-auth-cli');
const rdf = require('rdflib');
const FileClient = require('../lib/index.js');
const config = require('./podConfig.json');

const podClient = new FileClient({ podUrl: config.podUrl });

describe('Delete', function() {
    this.timeout(config.timeOut);
    before('Setting up auth...', async function() {
        return new Promise(async (resolve, reject) => {
            const credentials = await auth.getCredentials();
            await auth.login(credentials);
            podClient.fetcher = new rdf.Fetcher(podClient.graph, {
                fetch: auth.fetch,
            });
            const folder = await podClient.read(config.podUrl);
            cleanUps = [];
            folder.folders.forEach((element) => {
                if (!config.podContents.folders.includes(element)) {
                    cleanUps.push(podClient.delete(element));
                }
            });
            folder.files.forEach((element) => {
                if (!config.podContents.files.includes(element)) {
                    cleanUps.push(podClient.delete(element));
                }
            });
            await Promise.all(cleanUps).then(() => {
                resolve();
            });
        });
    });

    describe('delete()', function() {
        it('should delete the specified file', async function() {
            await podClient.create(config.testFile);
            await podClient.delete(config.testFile).then((res) => {
                expect(res.status).to.equal(200);
            });
        });
    });
});
