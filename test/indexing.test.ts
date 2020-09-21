import { expect } from 'chai';

import FileClient from '../lib';
import { cleanUp } from './utils';

const config = require('./podConfig.json');

const podClient = new FileClient();

describe('Indexing', function() {
    this.timeout(config.timeOut);
    before('Setting up auth...', async function() {
        await cleanUp(podClient);
    });

    describe('indexing()', async function() {
        it('should index a folder at the specified url', async function() {
            const index = await podClient.createIndex(config.podUrl);
            expect(index).to.deep.equal(config.fileIndex);
        });
    });

    after('Cleaning up...', async () => {
        await podClient.deleteIndex(config.podUrl);
    });
});
