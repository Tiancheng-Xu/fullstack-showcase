# babystepschain
**babystepschain** is a blockchain built using Cosmos SDK and Tendermint and created with [Ignite CLI](https://ignite.com/cli).

## Get started

```
cd ..
make start
```

The parent project installs the commit-pinned Ignite binary under `.tools/bin`.
The start command builds, initializes, and starts the blockchain locally.

### Configure

Your blockchain in development can be configured with `config.yml`. To learn more, see the [Ignite CLI docs](https://docs.ignite.com).

### Install
This repository uses a project-local, commit-pinned Ignite build. From the parent
`apps/cosmos-local-chain` directory, prepare the toolchain and chain with:

```
make bootstrap
```

## Learn more

- [Ignite CLI](https://ignite.com/cli)
- [Tutorials](https://docs.ignite.com/guide)
- [Ignite CLI docs](https://docs.ignite.com)
- [Cosmos SDK docs](https://docs.cosmos.network)
- [Developer Chat](https://discord.com/invite/ignitecli)
