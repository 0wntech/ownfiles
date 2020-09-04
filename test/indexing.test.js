const expect = require('chai').expect;
const auth = require('solid-auth-cli');
const rdf = require('rdflib');
const FileClient = require('../lib/index.js');
const config = require('./podConfig.json');

const podClient = new FileClient({ podUrl: config.podUrl });

describe('Indexing', function() {
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
            await Promise.all(cleanUps)
                .then(() => {
                    resolve();
                })
                .catch((err) => {
                    reject(err);
                });
        });
    });

    describe('indexing()', async function() {
        it('should index a folder at the specified url', async function() {
            const index = await podClient.createIndex(config.podUrl);
            expect(index).to.deep.equal(config.fileIndex);
        });
    });

    after('Cleaning up...', async () => {
        const profileContents = await podClient.read(
            config.podUrl + 'profile/'
        );
        await Promise.all(
            profileContents.files.map((file) => {
                if (file !== config.podUrl + 'profile/card') {
                    return podClient.delete(file);
                }
            })
        );
    });
});
