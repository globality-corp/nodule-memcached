# nodule-memcached

Nodule memcached client bindings

Nodule-memcached is a library wrapper around the Memcached client, porting code from `memcached-promisify`
and using it in the nodule-graphql context, binding the client to the graph,

## Usage

This library assumes that in the `config` object of your `nodule-config` container
you have a few config keys:
* `config.cache.enabled` - true/false
* `config.cache.memcached.hosts` - a comma-delimited array of memcached hosts
* `config.cache.memcached` - an object configuring the Memcached client itself (see [API here](https://github.com/3rd-Eden/memcached#options))

inside a `nodule-graphql` project's app.js:

```js
import { bindServices } from '@globality/nodule-graphql';
import initializeCacheClient from '@globality/nodule-memcached';

// inside createApp()
initializeCacheClient();

```
`initializeCacheClient` binds the cache client on the graph, the client is accessible by:
```js
const { client } = getContainer();
```

The memcached client itself is also available for import:
```js
import { Cache } from from '@globality/nodule-memcached';

const client = new Cache({hosts: 'host1,host2', ...});
```


## Local Development

Local development of `nodule-memcached` with other repos has a few common pitfalls related to the
usage of peer dependencies:

 -  `nodule-config` is a peer-dependency because various libraries act as plugins to it and it needs
    a single import of `bottlejs` to share plugin state

To work with `nodule-memcached` locally:

 1. Run `yarn build` within `nodule-memcached` to transpile the source.

 2. Change directories to your local repo that you want to test against `nodule-memcached`.

 3. Run `yarn add /path/to/nodule-memcached` to copy the transpiled source into your local repo.
    Do **NOT** use `yarn link`

 4. After running `yarn add`, remove (or move-of-the-way) the `nodule_modules` from **within**
    `nodule_modules/@globality/nodule-memcached/`
