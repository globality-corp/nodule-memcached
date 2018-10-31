import Cache from '../memcached-promisify';

const mockConfig = {
    logger: {
        warning: jest.fn(),
    },
};

jest.mock('@globality/nodule-config', () => ({
    getContainer: () => (mockConfig),
}));

const cache = new Cache({ maxExpiration: 900, hosts: 'localhost:11211' });
describe('memcached promisify', () => {
    it('should have various methods', () => {
        expect(cache.get).toBeDefined();
        expect(cache.getMulti).toBeDefined();
        expect(cache.set).toBeDefined();
        expect(cache.add).toBeDefined();
        expect(cache.del).toBeDefined();
    });

    xdescribe('execute methods', () => {

        it('should set/get something in the cache', async () => {
            await cache.set('foo', 'bar', 20);
            const res1 = await cache.get('foo');
            expect(res1).toEqual('bar');
            await cache.set('foo', 'bas', 20);
            const res2 = await cache.get('foo');
            expect(res2).toEqual('bas');
        });

        it('should set/multiGet something in the cache', async () => {
            await cache.set('foo', 'bar', 20);
            await cache.set('fos', 'bas', 20);
            const getMultiResult = await cache.getMulti(['foo', 'fos']);
            expect(getMultiResult.foo).toEqual('bar');
            expect(getMultiResult.fos).toEqual('bas');
        });

        it('should del something in the cache', async () => {
            await cache.set('foo', 'bar', 20);
            await cache.del('foo');
            const response = await cache.get('foo');
            expect(response).toBeUndefined();
        });

        it('should add something to the cache', async () => {
            await cache.del('foo');
            await cache.add('foo', 'bar', 20);
            const response = await cache.get('foo');
            expect(response).toEqual('bar');
        });

        it('should fail adding when there is a TTL on the key', async () => {
            expect.assertions(1);

            await cache.set('foo', 'bar', 20);
            try {
                await cache.add('foo', 'baz', 20);
            } catch (err) {
                expect(err).toBeDefined();
            }
        });

        it('adds a key safely', async () => {
            await cache.del('foo');
            await cache.safeSave({}, 'foo', 'bar', 20);
            await cache.safeSave({}, 'foo', 'baz', 20);
            const res = await cache.get('foo');
            expect(res).toEqual('bar');
        });

        it('reads keys safely', async () => {
            await cache.set('foo', 'bar', 20);
            await cache.set('bar', 'baz', 20);
            const res = await cache.safeGet({}, ['foo', 'bar', 'pow']);
            expect(res).toEqual(['bar', 'baz', undefined]);
        });

        it('should return undefined if attempting to get something that does not exist', async () => {
            const keyName = `test-${Date.now().toString()}`;
            const response = await cache.get(keyName);
            expect(response).toBeUndefined();
        });

        it('should return false if attempting to del something that does not exist', async () => {
            const keyName = `test-${Date.now().toString()}`;
            const response = await cache.del(keyName);
            expect(response).toBeFalsy();
        });

        it('should limit the expiration value', () => {
            expect.assertions(1);
            try {
                cache.set('foo', 'bar', 10000000);
            } catch (err) {
                expect(err).toBeDefined();
            }
        });
    });
});
