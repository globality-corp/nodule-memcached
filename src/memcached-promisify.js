// forked from https://github.com/flightstats/memcached-promisify

import Memcached from 'memcached';
import { getContainer } from '@globality/nodule-config';

const MAX_EXPIRATION = 60 * 60 * 24 * 30; // memcached's max exp in seconds (30 days)
const DEFAULT_HOST = 'localhost:11211';

function cachePromise(cache, method, ...args) {
    return new Promise((resolve, reject) => {
        cache.client[method](...args, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

/**
 * Cache
 *
 * @constructor
 * @param {Object} options - options passed to memcached
 * @param {string} options.hosts - comma-separated list of memcached hosts
 *
 * @example
 *    new Cache({ hosts: 'host1,host2', maxExpiration: 900 });
 */
class Cache {
    constructor(options = {
        maxExpiration: MAX_EXPIRATION,
        hosts: DEFAULT_HOST,
    }) {
        if (options.timeout) {
            options.timeout = parseInt(options.timeout, 10);
        }

        this.maxExpiration = options.maxExpiration;
        const hosts = options.hosts.split(',');
        this.client = new Memcached(hosts, options);
    }

    /**
    * get a cache item
    * @param {string} key - cache key
    * @returns {Promise}
    * @resolves {string} - cached value, or undefined when no value
    * @rejects - passes memcached exceptions
    */
    get(key) {
        return cachePromise(this, 'get', key);
    }

    /**
     * get an object of cache items
     * @param {array} keys - an array of cache keys
     * @returns {Promise} with object of key:value pairs
     * @resolves {Object} - key:value pairs
     * @rejects - passes memcached exceptions
     */
    getMulti(keys) {
        return cachePromise(this, 'getMulti', keys);
    }

    /**
     * set an item in the cache
     * @param {string} key - cache key
     * @param {string|number|Object} data - data to set in cache
     * @param {number} [expires=900] - expiration of data in seconds
     * @returns {Promise}
     * @resolves {boolean} - true/false for write success/fail
     * @rejects - passes memcached exceptions
     */
    set(key, data, expires) {
        if (expires > this.maxExpiration) {
            throw new Error(`Cache.set: Expiration must be no greater than ${this.maxExpiration} seconds.`);
        }

        return cachePromise(this, 'set', key, data, expires);
    }

    /**
     * add an item in the cache - raises exception if key exists
     * @param {string} key - cache key
     * @param {string|number|Object} data - data to set in cache
     * @param {number} [expires=900] - expiration of data in seconds
     * @returns {Promise}
     * @resolves {boolean} - true/false for write success/fail
     * @rejects - passes memcached exceptions
     */
    add(key, data, expires) {
        if (expires > this.maxExpiration) {
            throw new Error(`Cache.add: Expiration must be no greater than ${this.maxExpiration} seconds.`);
        }

        return cachePromise(this, 'add', key, data, expires);
    }

    /**
     * delete an item in the cache
     * @param {string} key - cache key
     * @returns {Promise}
     * @resolves {boolean} - true/false for delete success/no-op
     * @rejects - passes memcached exceptions
     */
    del(key) {
        return cachePromise(this, 'del', key);
    }

    async safeSave(req, key, value, ttl) {
        try {
            await this.add(key, value, ttl);
        } catch (error) {
            // Two cases here:
            //
            //  1. error.notStored => data was already present, either because
            //     of a concurrent write from another gateway process or an
            //     invalidation from backend services.
            //
            //  2. !error.notStored => something actually went wrong
            if (!error.notStored) {
                const { logger } = getContainer();
                logger.warning(req, 'unable to add cache data', {
                    error: error.message,
                    key,
                });
            }
        }
        return value;
    }

    /* Fetch values from the cache by (multiple) keys.
     *
     * Returns an array of values; uses `undefined` for missing values.
     */
    async safeGet(req, keys) {
        try {
            const values = await this.getMulti(keys);
            return keys.map(key => values[key]);
        } catch (err) {
            const { logger } = getContainer();
            logger.warning(req, err.message, {
                error: err,
                keys,
            });
            return keys.map(() => undefined);
        }
    }
}

export default Cache;
