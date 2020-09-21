import { expect } from 'chai';
import url from 'url';
const auth = require('solid-auth-cli');
const rdf = require('rdflib');

import FileClient from '../lib';
import { cleanUp } from './utils';

const config = require('./podConfig.json');

const podClient = new FileClient();

describe('Copy', function() {
    before('Setting up auth...', async function() {
        const credentials = await auth.getCredentials();
        await auth.login(credentials);
        podClient.fetcher = new rdf.Fetcher(podClient.graph, {
            "fetch": auth.fetch,
        });
    });

    describe('copy()', function() {
        it('should copy a file to the specified location', async function() {
            const content = 'Hello I am a text file.';
            await podClient.create(config.testFile, {
                "contentType": 'text/plain',
                "contents": content,
            });
            const copyLocation = url.resolve(config.podUrl, 'profile') + '/';
            await podClient.copy(
                config.testFile.replace('ttl', 'txt'),
                copyLocation,
            );
            const file = await podClient.read(
                url.resolve(copyLocation, 'test.txt'),
            );
            expect(file).to.equal(content);
        });

        it('should copy a non text file file to the specified location', async function() {
            const copyLocation = url.resolve(config.podUrl, 'profile') + '/';
            const content = await podClient.read(config.podUrl + 'favicon.ico');
            await podClient.copy(config.podUrl + 'favicon.ico', copyLocation);
            const file = await podClient.read(
                url.resolve(copyLocation, 'favicon.ico'),
            );
            expect(file).to.deep.equal(content);
        });

        it('should copy a folder to the specified location', async function() {
            const folderLocation = config.testFolder;
            const nestedFile = url.resolve(config.testFolder, 'testFile');
            const nestedFolder = url.resolve(folderLocation, 'test') + '/';
            const deepNestedFile = url.resolve(nestedFolder, 'testFile');

            await podClient.create(folderLocation);
            const content = 'Hello I am a text file.';
            await podClient.create(nestedFile, {
                "contentType": 'text/plain',
                "contents": content,
            });

            await podClient.create(nestedFolder);
            await podClient.create(deepNestedFile, {
                "contentType": 'text/plain',
                "contents": content,
            });

            await podClient.createFolder(config.podUrl, { "name": 'test2' });
            const copyLocation = url.resolve(config.podUrl, '/test2');
            await podClient.copy(folderLocation, copyLocation);

            const copiedFolder = url.resolve(copyLocation, 'test');
            const file = await podClient.read(
                url.resolve(copiedFolder + '/', 'testFile.txt'),
            );
            expect(file).to.equal(content);

            const copiedNestedFolder = url.resolve(copiedFolder + '/', 'test');
            const file2 = await podClient.read(
                url.resolve(copiedNestedFolder + '/', 'testFile.txt'),
            );
            expect(file2).to.equal(content);
        });
    });

    afterEach(async function() {
        await cleanUp(podClient);
    });
});
