import { expect } from 'chai';
import url from 'url';

import FileClient from '../lib';
import { cleanUp } from './utils';

const config = require('./podConfig.json');

const podClient = new FileClient();

describe('Rename', function() {
    before('Setting up auth...', async function() {
        await cleanUp(podClient);
    });

    after('Cleaning up', async () => await cleanUp(podClient));

    describe('rename()', function() {
        it('should rename the specified file', async function() {
            const content = '{"test": 1}';
            const testFile = config.testFile.replace('.ttl', '.txt');
            await podClient.create(testFile, {
                contentType: 'text/plain',
                contents: content,
            });
            const newName = 'test2.txt';
            await podClient.renameFile(testFile, newName);
            const file = await podClient.read(
                testFile.replace('test.txt', 'test2.txt'),
            );
            expect(file).to.equal(content);
        });

        it('should change file type', async () => {
            const content = '{"test": 1}';
            const newNameWithType = 'test2.js';
            const testFile = config.testFile.replace('test.ttl', 'test2.txt');
            await podClient.renameFile(testFile, newNameWithType);
            const file = await podClient.read(testFile.replace('.txt', '.js'));

            expect(file).to.equal(content);
        });

        it('should rename the specified folder', async function() {
            const nestedFile = url.resolve(config.testFolder, 'testFile');
            const deepNestedFile = url.resolve(
                config.testFolder,
                'test/testFile',
            );

            const content = 'Hello I am a text file.';
            await podClient.create(nestedFile, {
                contentType: 'text/plain',
                contents: content,
            });

            await podClient.create(deepNestedFile, {
                contentType: 'text/plain',
                contents: content,
            });

            const newName = 'test2';
            await podClient.renameFolder(config.testFolder, newName);

            const renamedFolder = config.testFolder.replace('/test', '/test2');
            const renamedNestedFolder = url.resolve(renamedFolder, 'test/');

            const file = await podClient.read(
                url.resolve(renamedFolder, 'testFile.txt'),
            );
            expect(file).to.equal(content);

            const file2 = await podClient.read(
                url.resolve(renamedNestedFolder, 'testFile.txt'),
            );
            expect(file2).to.equal(content);
        });
    });
});
