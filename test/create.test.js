const expect = require('chai').expect;
const auth = require('solid-auth-cli');
const rdf = require('rdflib');
const ns = require('solid-namespace')(rdf);
const FileClient = require('../lib/index.js');
const config = require('./podConfig.json');

const podClient = new FileClient({ podUrl: config.podUrl });

describe('Create', function() {
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

    describe('create()', async function() {
        it('should create a folder at the specified url', async function() {
            const res = await podClient.create(config.testFolder);
            expect(res.status).to.equal(201);
        });

        it('should not create a folder if there is no specified url and throw an error instead', function() {
            expect(() => podClient.create()).to.throw(Error);
        });

        it('should not create a folder if there is an invalid url and throw an error instead', function() {
            expect(() =>
                podClient.create(
                    config.testFolder.replace('https://', 'lala://')
                )
            ).to.throw(Error);
        });

        it('should create a turtle file at the specified url with the turtle contents', async function() {
            const contents = [
                rdf.st(
                    rdf.sym(
                        'https://lalasepp1.solid.community/profile/card#me'
                    ),
                    ns.foaf('knows'),
                    rdf.sym('https://ludwig.owntech.de/profile/card#me'),
                    rdf.sym(config.testFile)
                ),
            ];
            await podClient
                .create(config.testFile, {
                    contents: contents,
                })
                .then(() => {
                    const store = rdf.graph();
                    const fetcher = new rdf.Fetcher(store);
                    return fetcher.load(config.testFile).then(() => {
                        const testTriples = store.statementsMatching(
                            rdf.sym(
                                'https://lalasepp1.solid.community/profile/card#me'
                            )
                        );
                        expect(testTriples).to.deep.equal(contents);
                    });
                });
        });

        it('should create a plaintext file at the specified url with the contents', async function() {
            await podClient.create(config.testFile, {
                contentType: 'text/plain',
                contents: 'Hello I am a text file.',
            });
            await podClient.fetcher
                .load(config.testFile.replace('ttl', 'txt'))
                .then((res) => {
                    expect(res.responseText).to.equal(
                        'Hello I am a text file.'
                    );
                });
        });

        it('should not create a plaintext file if it already exists', async function() {
            const folderContents = await podClient.read(config.podUrl);
            await podClient.createIfNotExist(config.podUrl + 'robots.txt', {
                contentType: 'text/html',
                contents: '<b>Hello I am a different text file.</b>',
            });
            await podClient.read(config.podUrl).then((res) => {
                expect(res).to.deep.equal(folderContents);
            });
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
