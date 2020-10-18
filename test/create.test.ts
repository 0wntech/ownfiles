import { expect } from 'chai';
import FileClient from '../lib';
import { FolderType } from '../lib/read';
import { cleanUp } from './utils';
const config = require('./podConfig.json');

const rdf = require('rdflib');
const ns = require('solid-namespace');
const podClient = new FileClient();

describe('Create', function() {
    this.timeout(config.timeOut);
    before('Setting up auth...', async function() {
        await cleanUp(podClient);
    });

    describe('create()', async function() {
        it('should create a folder at the specified url', async function() {
            const res = await podClient.create(config.testFolder);
            expect(res.status).to.equal(201);
        });

        it('should not create a folder if there is an invalid url and throw an error instead', function() {
            expect(() =>
                podClient.create(
                    config.testFolder.replace('https://', 'lala://'),
                ),
            ).to.throw(Error);
        });

        it('should create a turtle file at the specified url with the turtle contents', async function() {
            const contents = [
                rdf.st(
                    rdf.sym(
                        'https://lalasepp1.solid.community/profile/card#me',
                    ),
                    ns(rdf).foaf('knows'),
                    rdf.sym('https://ludwig.owntech.de/profile/card#me'),
                    rdf.sym(config.testFile),
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
                                'https://lalasepp1.solid.community/profile/card#me',
                            ),
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
            const res = (await podClient.fetcher.load(
                config.testFile.replace('ttl', 'txt'),
            )) as Response & {
                responseText: string;
            };
            expect(res.responseText).to.equal('Hello I am a text file.');
        });

        it('should not create a plaintext file if it already exists', async function() {
            const folderContents = await podClient.read(config.podUrl);
            await podClient.createIfNotExist(config.podUrl + 'robots.txt', {
                contentType: 'text/html',
                contents: '<b>Hello I am a different text file.</b>',
            });
            const folder = (await podClient.read(config.podUrl)) as FolderType;
            expect(folder).to.deep.equal(folderContents);
        });
    });

    after('Cleaning up...', async () => {
        const profileContents = (await podClient.read(
            config.podUrl + 'profile/',
        )) as FolderType;
        await Promise.all(
            profileContents.files.map((file) => {
                if (file !== config.podUrl + 'profile/card') {
                    return podClient.delete(file as string);
                }
            }),
        );
    });
});
