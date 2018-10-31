/* Memcached cache client. */
import { get } from 'lodash';
import { bind, getContainer, getMetadata } from '@globality/nodule-config';

import Cache from './memcached-promisify';

function createCacheClient() {
    const { config } = getContainer();
    const memcachedConfig = get(config, 'cache.memcached');
    return new Cache(
        memcachedConfig,
    );
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
