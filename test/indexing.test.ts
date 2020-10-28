import { expect } from 'chai';

import FileClient from '../lib';
import { cleanUp } from './utils';

const config = require('./podConfig.json');

const podClient = new FileClient();

describe('Indexing', function() {
    before('Setting up auth...', async function() {
        await cleanUp(podClient);
        await podClient.deleteIndex(config.podUrl);
    });

    describe.only('indexing()', async function() {
        it('should index a folder at the specified url', async function() {
            const index = await podClient.createIndex(
                config.podUrl + 'profile',
            );
            expect(index).to.deep.equal(config.fileIndex);
        });
    });

    after('Cleaning up...', async () => {
        await podClient.deleteIndex(config.podUrl);
    });
});
