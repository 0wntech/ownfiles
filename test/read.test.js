const expect = require('chai').expect;
const auth = require('solid-auth-cli');
const rdf = require('rdflib');
const PodClient = require('../lib/index.js');
const config = require('./podConfig.json');

const podClient = new PodClient({ podUrl: config.podUrl });

describe('Read', function() {
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

    describe('read()', function() {
        it('should read the specified folder', async function() {
            const folder = await podClient.read(config.podUrl);
            expect(folder).to.deep.equal(config.podContents);
        });

        it('should read the specified folder and types', async function() {
            const folder = await podClient.read(config.podUrl + 'profile/', {
                verbose: true,
            });
            expect(folder).to.deep.equal(config.verboseFolder);
        });

        it('should read the contents of the specified file', async function() {
            const content = 'Hello I am a text file.';
            await podClient.create(config.testFile, {
                contentType: 'text/plain',
                contents: content,
            });
            const file = await podClient.read(
                config.testFile.replace('ttl', 'txt')
            );
            expect(file).to.equal(content);
        });
    });
});
