/* Memcached cache client. */
import { get } from 'lodash';
import { bind, getContainer, getMetadata } from '@globality/nodule-config';

import Cache from './memcached-promisify';


function logCacheEvent(logger, eventType, details) {
    logger.warning(null, `memcached server event: ${eventType}`, details);
}

function createCacheClient() {
    const { config, logger } = getContainer();
    const memcachedConfig = get(config, 'cache.memcached');
    const cache = new Cache(
        memcachedConfig,
    );
    if (logger) {
        cache.client.on('issue', details => (logCacheEvent(logger, 'issue', details)));
        cache.client.on('failure', details => (logCacheEvent(logger, 'failure', details)));
        cache.client.on('reconnecting', details => (logCacheEvent(logger, 'reconnecting', details)));
        cache.client.on('reconnect', details => (logCacheEvent(logger, 'reconnect', details)));
        cache.client.on('remove', details => (logCacheEvent(logger, 'remove', details)));
    }
    return cache;
}

/* Configure caching for a nodule-graphql framework.
 */

export default function initializeCacheClient() {
    const { config, terminal } = getContainer();
    if (get(config, 'cache.enabled')) {
        if (!getMetadata().testing) {
            terminal.enabled('caching');
        }
        bind('cache', () => createCacheClient());
    } else if (!getMetadata().testing) {
        terminal.disabled('caching');
    }
}
