const fetch = require('node-fetch');
const data = require('./data');
const { Api, JsonRpc, RpcError } = require('eosjs');
const { TextEncoder, TextDecoder } = require('util');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');
require('dotenv').config();

const colName = data.colName;
const atomicEndpoints = data.atomicEndpoints;
const rpcEndpoints = data.rpcEndpoints;

payWeeklyRplm();

async function payWeeklyRplm () {

    const signatureProvider = new JsSignatureProvider([process.env.PVK]);

    const re = getRpcEndpoint();
    const rpc = new JsonRpc(re, { fetch });

    const api = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), 
        textEncoder: new TextEncoder() });

    // const payoutList = await getIncomeTemplates().then(it => getTemplateOwners(it));

    // if (payoutList.hasOwnProperty('atomicmarket')) {
    //     delete payoutList['atomicmarket']; // removing pesky atomicmarket account :)
    // }
    
    // console.log(payoutList);

    const payoutList = data.curList;

    await pay(payoutList, api);

}

async function pay (payoutList, api) {

    const addresses = Object.keys(payoutList);
    const amounts = Object.values(payoutList);

    let allTrxComleted = false;
    let startIndex = 0;
    let endIndex = 0;
    const batchCount = 20;
    const payMultiplier = 1;

    while (!allTrxComleted && addresses.length !== 0) {
        if (addresses.length <= batchCount) {
            endIndex = addresses.length;
        } else {
            endIndex = startIndex + batchCount;
        }

        const batchAddresses = addresses.slice(startIndex, endIndex);
        const batchAmounts = amounts.slice(startIndex, endIndex);

        const actions = batchAddresses.map(function (ba, i) {

            const qty = (batchAmounts[i] * payMultiplier).toFixed(4);

            return {
                account: 'metatoken.gm',
                name: 'transfer',
                authorization: [{
                    actor: 'coin.reptile',
                    permission: 'owner'
                }],
                data: {
                    from: 'coin.reptile',
                    to: ba,
                    quantity: qty + ' RPLM',
                    memo: 'Reptilium Weekly Payout'
                }
            }
        });

        let trxCompleted = false;

        while (!trxCompleted) {
            console.log('sending ' + batchAddresses);
            const res = await transact(api, actions);
            console.log(res);
    
            if (res) {
                trxCompleted = true;
                console.log('transacted ' + batchAmounts + ' RPLM to ' + batchAddresses);
                break;
            }
        }

        if (addresses.length <= batchCount) {
            allTrxComleted = true;
            break;
        } else {
            addresses.splice(0, batchCount);
            amounts.splice(0, batchCount);
        }
    }
    



    for (const recipient in payoutList) {
        const amt = payoutList[recipient].toFixed(4);
        let trxCompleted = false;

        const tmpList = {}
        const tmpListSize = Object.keys(tmpList).length;


        
        while (!trxCompleted && tmpListSize !== 0 && tmpListSize <= 25) {
            const res = await transact(api, recipient, amt);
            console.log(res);
            if (res) {
                trxCompleted = true;
                console.log('transacted ' + amt + ' RPLM to ' + recipient);
                break;
            }
        }
    }
}

async function getTemplateOwners (incomeTemplates) {

    const breederSchema = 'breedernft';
    const breederShare = 0.5;
    let payouts = {}

    for (const { id, schema, rpw } of incomeTemplates) {

        
        let allOwnersGathered = false;
        let page = 1;
        let limit = 100;
        
        while (!allOwnersGathered) {
            console.log('fetching for ' + id);
            const owners = await getAccounts(colName, id, page, limit)
                .then(function (res) {
                    return res ? res.data : false;
                });

            if (owners) {

                for (const owner of owners) {
                    const { account, assets } = owner;
                    const a = Number(assets);

                    if (!payouts.hasOwnProperty(account)) {
                        payouts[account] = 0;
                    } 

                    if (schema === breederSchema) {
                        payouts[account] += ( (a * rpw) * breederShare );
                    } else {
                        payouts[account] += (a * rpw);
                    }
                }

                if (owners.length < limit) {
                    allOwnersGathered = true;
                    break;
                } else {
                    page++;
                }

            } else {
                await sleep(2000);
            }
        }
    }

    return payouts;
}

async function getIncomeTemplates () {

    let allTemplatesGathered = false;
    let page = 1;
    let limit = 100;
    let allTemplates = []
    const incomeTemplates = []

    while (!allTemplatesGathered) {
        const templates = await getAllTemplates(colName, true, page, limit)
            .then(function (res) {
                return res ? res.data : false;
            });

        if (templates) {
            allTemplates = [ ...allTemplates, ...templates ]

            if (templates.length < limit) {
                allTemplatesGathered = true;
                break;
            } else {
                page++
            }
        } else {
            await sleep(2000);
        }
    }

    console.log('all Templates: ' + allTemplates.length);
    
    for (const template of allTemplates) {
        const incomeKeys = ['Reptilium Per Week', 'RPLM/Week', 'RPLM Per Week']
        const immData = template.immutable_data;

        for (const incomeKey of incomeKeys) {
            if (immData.hasOwnProperty(incomeKey)) {
                const id = template.template_id;
                const schema = template.schema.schema_name;
                const rpw = Number(immData[incomeKey]);
    
                incomeTemplates.push({ id, schema, rpw });
                break;
            }
        }
    }

    console.log('income Templates: ' + incomeTemplates.length);

    return incomeTemplates;
}

function sleep (ms) {
    return new Promise(function (r) {
        return setTimeout(r, ms);
    });
}

function getRpcEndpoint () {
    const rand = Math.floor(Math.random() * rpcEndpoints.length);
    return 'https://' + data.rpcEndpoints[rand];
}

function getAtomicEndpoint () {
    const rand = Math.floor(Math.random() * atomicEndpoints.length);
    return 'https://' + data.atomicEndpoints[rand] + '/atomicassets/v1';
}

async function getAllTemplates (colName, hasAssets, page, limit) {
    const ae = getAtomicEndpoint();
    const order = 'desc';
    const sort = 'created';
    const tmptEndpoint = ae + '/templates?collection_name=' + colName + '&has_assets=' 
    + hasAssets + '&page=' + page + '&limit=' + limit + '&order=' + order + 
    '&sort=' + sort;
    const res = await fetch(tmptEndpoint)
        .then(function (resp) {
            return resp.json();
        })
        .catch(function (err) {
            console.log(err);
        });
    return res;
}

async function getAccounts (colName, id, page, limit) {
    const ae = getAtomicEndpoint();
    const order = 'desc';
    const acctEndpoint = ae + '/accounts?collection_name=' + colName + '&template_id=' 
    + id + '&page=' + page + '&limit=' + limit + '&order=' + order;
    const res = await fetch(acctEndpoint)
        .then(function (resp) {
            return resp.json();
        })
        .catch(function (err) {
            console.log(err);
        });
    return res;
}

async function transact (api, actions) {

    try {
        const trx = { actions }
    
        const trxConfig = {
            useLastIrreversible: true,
            expireSeconds: 300
        }
    
        const res = await api.transact(trx, trxConfig);

        console.log(res);

        if (res && res.processed) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.log('\nCaught Exception: ' + error);
        if (error instanceof RpcError) {
            console.log(JSON.stringify(error.json, null, 2));
        }
        return false;
    }
}

module.exports = {
    payWeeklyRplm: payWeeklyRplm
}