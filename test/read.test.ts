import { expect } from 'chai';
import FileClient from '../lib';
import { FolderType } from '../lib/read';
import { cleanUp } from './utils';
const config = require('./podConfig.json');

const podClient = new FileClient();

describe('Read', function() {
    before('Setting up auth...', async function() {
        await cleanUp(podClient);
    });

    describe('read()', function() {
        it('should read the specified folder', async function() {
            const folder = await podClient.read(config.podUrl);
            expect(folder).to.deep.equal(config.folder);
        });

        it("should read a specified folder if there's no definitive Link header", async function() {
            const folder = await podClient.read('https://ludwig.inrupt.net/');
            expect(Array.isArray((folder as FolderType).folders)).to.be.true;
            expect(Array.isArray((folder as FolderType).files)).to.be.true;
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
                config.testFile.replace('ttl', 'txt'),
            );
            expect(file).to.equal(content);
        });
    });
});
