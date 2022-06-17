const xrpl = require('xrpl')
const BigNumber = require('bignumber.js')
const client = new xrpl.Client("wss://s1.ripple.com:443")
const Wallet = xrpl.Wallet;

async function fundWallet() {
  await client.connect()
  const wallet = (await client.fundWallet()).wallet
  console.log(`Got address ${JSON.stringify(wallet, null, 2)}.`)
  client.disconnect()
}

async function offerCreate() {
    await client.connect()

    const we_want = {
        currency: "TST",
        issuer: "rP9jPyP5kyvFRb6ZiRghAGw5u8SGAmU4bd",
        value: "5"
    }
    const we_spend = {
        currency: "XRP",
        value: xrpl.xrpToDrops(5*10*1.17)
    }

    const wallet = Wallet.fromSeed('sEdSdM2JL6Fsw2GSF8XyfUmonyWCNfi');

    const offer_1 = {
        "TransactionType": "OfferCreate",
        "Account": wallet.address,
        "TakerPays": we_want,
        "TakerGets": we_spend.value
    }

    const prepared = await client.autofill(offer_1)
    const signed = wallet.sign(prepared)
    const result = await client.submitAndWait(signed.tx_blob)

    if (result.result.meta.TransactionResult == "tesSUCCESS") {
        console.log(`Transaction succeeded: https://testnet.xrpl.org/transactions/${signed.hash}`)
    } 
    else {
        throw `Error sending transaction: ${result}`
    }

    client.disconnect()
}


async function getTokenBalance() {
    await client.connect()
    const address = 'rbYJCEJD2FGAdHrn8u6AufcUaBRfv8e3H';

    // Check balances ------------------------------------------------------------
    const balances = await client.request({
        command: "account_lines",
        account: address,
        ledger_index: "validated"
    })
    console.log('account_lines ->', JSON.stringify(balances.result, null, 2))

    // Check Offers --------------------------------------------------------------
    const acct_offers = await client.request({
        command: "account_offers",
        account: address,
        ledger_index: "validated"
    })
    console.log('account_offers ->', JSON.stringify(acct_offers.result, null, 2))

    client.disconnect()
}



getTokenBalance()


