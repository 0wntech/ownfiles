import { expect } from 'chai';
import FileClient from '../lib';

describe('FileClient', function() {
    describe('constructor()', function() {
        it('should instantiate without Error', function() {
            expect(() => {
                new FileClient();
            }).to.not.throw(Error);
        });
    });
});
