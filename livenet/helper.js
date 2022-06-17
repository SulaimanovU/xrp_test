const xrpl = require('xrpl')
const BigNumber = require('bignumber.js')
const client = new xrpl.Client("wss://s1.ripple.com:443");
const Wallet = xrpl.Wallet

async function getXRPBalance() {
    let address = 'r94JnW46SVfF993hCdLWXRkfjW2x1C8TxD';
    let tokenId = '';
    await client.connect()

    const {result: {account_data: {Balance: balance}}} = await client.request({
        "command": "account_info",
        "account": address,
        "ledger_index": "validated"
    })

    // const { result: { lines } } = await this.client.request({
    //     "command": "account_lines",
    //     "account": address,
    //     "ledger_index": "validated"
    // })
    
    // let { tokenBalance } = lines.find((line => {
    //     return line.currency === tokenId
    // }))

    // console.log('Token balance ->', tokenBalance);

    console.log('Balance ->', balance / (10 ** 6));

    await client.disconnect()
}


async function lookUpOffers() {
    await client.connect()

    const wallet = Wallet.fromSeed('sEdSdM2JL6Fsw2GSF8XyfUmonyWCNfi');

    const we_want = {
        currency: "TST",
        issuer: "rP9jPyP5kyvFRb6ZiRghAGw5u8SGAmU4bd",
        value: "25"
    }
    const we_spend = {
        currency: "XRP",
            // 25 TST * 10 XRP per TST * 15% financial exchange (FX) cost
        value: xrpl.xrpToDrops(25*10*1.15)
    }

    const proposed_quality = BigNumber(we_spend.value) / BigNumber(we_want.value)

    const orderbook_resp = await client.request({
        "command": "book_offers",
        "taker": wallet.address,
        "ledger_index": "current",
        "taker_gets": we_want,
        "taker_pays": we_spend
    })
    console.log(JSON.stringify(orderbook_resp.result, null, 2))

    const offers = orderbook_resp.result.offers
    const want_amt = BigNumber(we_want.value)
    let running_total = BigNumber(0)
    if (!offers) {
        console.log(`No Offers in the matching book.
                    Offer probably won't execute immediately.`)
    } else {
        for (const o of offers) {
        if (o.quality <= proposed_quality) {
            console.log(`Matching Offer found, funded with ${o.owner_funds}
                ${we_want.currency}`)
            running_total = running_total.plus(BigNumber(o.owner_funds))
            if (running_total >= want_amt) {
            console.log("Full Offer will probably fill")
            break
            }
        } else {
            console.log(`Remaining orders too expensive.`)
            break
        }
        }
        console.log(`Total matched:
            ${Math.min(running_total, want_amt)} ${we_want.currency}`)
        if (running_total > 0 && running_total < want_amt) {
        console.log(`Remaining ${want_amt - running_total} ${we_want.currency}
                would probably be placed on top of the order book.`)
        }
    }

    if (running_total == 0) {
        const orderbook2_resp = await client.request({
        "command": "book_offers",
        "taker": wallet.address,
        "ledger_index": "current",
        "taker_gets": we_spend,
        "taker_pays": we_want
        })
        console.log(JSON.stringify(orderbook2_resp.result, null, 2))

        const offered_quality = BigNumber(we_want.value) / BigNumber(we_spend.value)

        const offers2 = orderbook2_resp.result.offers
        let tally_currency = we_spend.currency
        if (tally_currency == "XRP") { tally_currency = "drops of XRP" }
        let running_total2 = 0
        if (!offers2) {
        console.log(`No similar Offers in the book. Ours would be the first.`)
        } else {
        for (const o of offers2) {
            if (o.quality <= offered_quality) {
            console.log(`Existing offer found, funded with
                    ${o.owner_funds} ${tally_currency}`)
            running_total2 = running_total2.plus(BigNumber(o.owner_funds))
            } else {
            console.log(`Remaining orders are below where ours would be placed.`)
            break
            }
        }
        console.log(`Our Offer would be placed below at least
                ${running_total2} ${tally_currency}`)
        if (running_total > 0 && running_total < want_amt) {
            console.log(`Remaining ${want_amt - running_total} ${tally_currency}
                will probably be placed on top of the order book.`)
        }
        }
    }

    client.disconnect()
}

async function getTxList() {
    await client.connect()

    const { result } = await client.request({
        command: 'account_tx',
        account: 'rbYJCEJD2FGAdHrn8u6AufcUaBRfv8e3H',
        ledger_index_min: 71906780,
        ledger_index_max: 71906780,
        ledger_index: 'validated',
        transactions: true,
        forward: false,
    });

    for (const transaction of result.transactions) {
        const { tx, meta } = transaction;
        console.log('tx ->', tx);
        console.log('meta ->', meta);
    }

    await client.disconnect()
}

getTxList();

// MAINET WALLET CREDENTIALS


/*  ADDRESS WITH TOKEN
address {
    classicAddress = 'r9vbzEihnp2gzsodkaf7UpVchU1d3L3od4';
    seed = 'snyGcUjYbPwjnAHfMxou4a2tcCZRs';
}

address {
    classicAddress: 'rbYJCEJD2FGAdHrn8u6AufcUaBRfv8e3H',
    seed: 'ssho4vg1MfxDKziyUMnDwF7piuEya',
}
*/


/*  ADDRESS WITHOUT TOKEN
address {
    classicAddress: 'rL34DRBh1wAHTfCtiEdi4bbU4vbfPfELti',
    seed: 'ssiTDJKRdfQ3gAC34cJYrXXpggZ1u',
}
*/