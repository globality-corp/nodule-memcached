import initializeCacheClient from '../initializeCacheClient';
import Cache from '../memcached-promisify';

let bound;
const mockBind = jest.fn((key, fn) => {
    bound = fn();
});
const mockDisabled = jest.fn();
const mockEnabled = jest.fn();

const mockConfig = {
    config: {
        cache: {
            enabled: true,
            memcached: {
                hosts: 'localhost:11211,localhost:11212',
                maxExpiration: 1000,
            },
        },
    },
    terminal: {
        disabled: mockDisabled,
        enabled: mockEnabled,
    },
};

jest.mock('@globality/nodule-config', () => ({
    getContainer: () => (mockConfig),
    getMetadata: () => ({ testing: false }),
    bind: (key, fn) => mockBind(key, fn),
}));

describe('initializeCacheClient', () => {
    it('binds a cache client to the graph', () => {
        initializeCacheClient();
        expect(mockBind).toHaveBeenCalledWith('cache', expect.anything());
        expect(bound).toBeInstanceOf(Cache);
    });

    it('notifies that cache is enabled', () => {
        initializeCacheClient();
        expect(mockEnabled).toHaveBeenCalledWith('caching');
    });

    it('notifies that cache is disabled', () => {
        mockConfig.config.cache.enabled = false;
        initializeCacheClient();
        expect(mockDisabled).toHaveBeenCalledWith('caching');
    });
});
