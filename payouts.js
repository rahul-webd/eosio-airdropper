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

    const payoutList = data.curList;

    for (const recipient in payoutList) {
        const amt = payoutList[recipient].toFixed(4);
        const trxCompleted = false;

        console.log('sending ' + recipient);
        
        while (!trxCompleted) {
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

async function transact (api, recipient, qty) {

    try {
        const trx = {
            actions: [
                {
                    account: 'metatoken.gm',
                    name: 'transfer',
                    authorization: [{
                        actor: 'coin.reptile',
                        permission: 'active'
                    }],
                    data: {
                        from: 'coin.reptile',
                        to: recipient,
                        quantity: '1.0000 RPLM',
                        memo: 'Reptilium Weekly Payout'
                    }
                }
            ]
        }
    
        const trxConfig = {
            blocksBehind: 3,
            expireSeconds: 30
        }
    
        const res = await api.transact(trx, trxConfig);

        if (res && res.wasBroadcast) {
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