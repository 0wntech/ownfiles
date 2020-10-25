import { expect } from 'chai';

import FileClient from '../lib';
import { ExtendedResponseType } from '../lib/create';
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
});
