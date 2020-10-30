import { expect } from 'chai';
import FileClient from '../lib';
import { cleanUp } from './utils';

const config = require('./podConfig.json');
const podClient = new FileClient();

describe('DeepRead', function() {
    before('Setting up auth...', async function() {
        await cleanUp(podClient);
    });

    after('Cleaning up', async function() {
        await podClient.delete(config.podUrl + 'test/');
    });

    describe('deepRead()', function() {
        it('should deep fetch a hierarchy of files from a given url', async function() {
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
            );
            expect(deepFolder).to.deep.equal([
                config.podUrl + 'test/test/testFile.txt',
                config.podUrl + 'test/test/',
                config.podUrl + 'test/',
            ]);
        });

        it("should return nothing for something that doesn't exist", async function() {
            const deepFolder = await podClient.deepRead(
                'https://ludwig.aws.owntech.de/profile/lalatestIndex.ttl',
            );
            expect(deepFolder).to.deep.equal([]);
        });
        it('should return nothing for something that there is no permission for', async function() {
            const deepFolder = await podClient.deepRead(
                'https://ludwig.aws.owntech.de/settings/lalatestIndex.ttl',
            );
            expect(deepFolder).to.deep.equal([]);
        });
    });
});
