const rpcEndpoints = [
    // `wax.greymass.com`,
    `api.wax.alohaeos.com`,
    `wax.eu.eosamsterdam.net`,
    `wax.blacklusion.io`,
    `wax.blokcrafters.io`,
    `api-wax-mainnet.wecan.dev`,
    `wax.cryptolions.io`,
    `api-wax.eosarabia.net`,
    `wax.eosdublin.io`,
    `wax.eoseoul.io`,
    `wax.eosphere.io`,
    `wax-public1.neftyblocks.com`,
    `wax-public2-neftyblocks.com`,
    `wax.api.eosnation.io`,
    `api2.hivebp.io`,
    `api.waxsweden.org`
]

const atomicEndpoints = [
    `wax.api.atomicassets.io`,
    `wax-aa.eu.eosamsterdam.net`,
    `aa.wax.blacklusion.io`,
    `api.wax-aa.bountyblok.io`,
    `atomic-wax-mainnet.wecan.dev`,
    `aa.dapplica.io`,
    `aa-api-wax.eosauthority.com`,
    `wax-aa.eosdublin.io`,
    `wax-atomic-api.eosphere.io`,
    `atomic.wax.eosrio.io`,
    `api.atomic.greeneosio.com`,
    `aa-wax-public1.neftyblocks.com`,
    `wax.hkeos.com/aa`,
    `atomic.ledgerwise.io`,
    `atomic.tokengamer.io`,
]

const colName = `nft.reptile`;

let curPayoutList = {
}

module.exports = {
    rpcEndpoints: rpcEndpoints,
    atomicEndpoints: atomicEndpoints,
    colName: colName,
    curList: curPayoutList
}