import { expect } from 'chai';

import FileClient from '../lib';
import { ExtendedResponseType } from '../lib/create';
import { FolderType } from '../lib/read';
import { cleanUp } from './utils';

const config = require('./podConfig.json');

const podClient = new FileClient();

describe('Delete', function() {
    before('Setting up auth...', async function() {
        await cleanUp(podClient);
    });

    describe('delete()', function() {
        it('should delete the specified file', async function() {
            await podClient.create(config.testFile);
            await podClient.delete(config.testFile).then((res) => {
                res = res as ExtendedResponseType;
                expect(res.status).to.equal(200);
            });
        });
    });
    describe('delete()', function() {
        it('should delete the specified folder', async function() {
            await podClient.create(config.testFolder);
            await podClient.create(config.testFolder + '/test.txt');
            await podClient.delete(config.testFolder).then((res) => {
                res = res as ExtendedResponseType;
                expect(res.status).to.equal(200);
            });
            const rootFolder = (await podClient.read(
                config.podUrl,
            )) as FolderType;
            expect(rootFolder.folders.includes(config.testFolder)).to.equal(
                false,
            );
        });
    });
    describe('delete()', function() {
        it('should delete a big folder', async function() {
            await podClient.create(config.testFolder);
            await podClient.create(config.testFolder + '/test.txt');
            await podClient.create(config.testFolder + '/test1.txt');
            await podClient.create(config.testFolder + '/test2.txt');
            await podClient.create(config.testFolder + '/test3.txt');
            await podClient.create(config.testFolder + '/test4.txt');
            await podClient.create(config.testFolder + '/test5.txt');
            await podClient.create(config.testFolder + '/test6.txt');
            await podClient.delete(config.testFolder).then((res) => {
                res = res as ExtendedResponseType;
                expect(res.status).to.equal(200);
            });
            const rootFolder = (await podClient.read(
                config.podUrl,
            )) as FolderType;
            expect(rootFolder.folders.includes(config.testFolder)).to.equal(
                false,
            );
        });
    });
});
