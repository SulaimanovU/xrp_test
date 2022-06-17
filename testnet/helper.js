const xrpl = require('xrpl')
const BigNumber = require('bignumber.js')
const client = new xrpl.Client("wss://s.altnet.rippletest.net:51233");
const Wallet = xrpl.Wallet

async function getXRPBalance() {
    let address = 'rMcjaY2WJuXL6TmQdnA7auWoi1sFUnkdHh';
    await client.connect()

    const {result: {account_data: {Balance: balance}}} = await client.request({
        "command": "account_info",
        "account": address,
        "ledger_index": "validated"
    })

    console.log('Balance ->', balance / (10 ** 6));

    client.disconnect()
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


getXRPBalance()














/*  ADDRESS WITH TOKEN
address {
    "publicKey": "ED51AAA758A7AC4A15EC292EDD831A76ADADF4B6D79C4B4D98002CBF4F3F801AC2",
    "privateKey": "ED0FCD135056242451FC1F3D039A6544CB4DDD02E7CED76EF29078A2A6E67CB651",
    "classicAddress": "r94JnW46SVfF993hCdLWXRkfjW2x1C8TxD",
    "seed": "sEdSdM2JL6Fsw2GSF8XyfUmonyWCNfi"
}
*/


/*  ADDRESS WITHOUT TOKEN
address {
  "publicKey": "EDB282350462185EC8B12635808D875968B30A90DC14531999B75A30E0AD87EF49",
  "privateKey": "ED8468E38C6A34C57292318FFDD8A0E506A60E757722884BB08989088C0489FD93",
  "classicAddress": "rMcjaY2WJuXL6TmQdnA7auWoi1sFUnkdHh",
  "seed": "sEd7A77wHNUBwqCEqXfAD25ukGrjFsD"
}
*/