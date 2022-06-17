const xrpl = require('xrpl')
const BigNumber = require('bignumber.js')
const client = new xrpl.Client("wss://s.altnet.rippletest.net:51233")
const Wallet = xrpl.Wallet;


async function configure() {
    await client.connect();
    const wallet = Wallet.fromSeed('sEdSdM2JL6Fsw2GSF8XyfUmonyWCNfi');

    settings_tx = {
        "TransactionType": "AccountSet",
        "Account": wallet.address,
        "SetFlag": xrpl.AccountSetAsfFlags.asfDefaultRipple
    }

    const cst_prepared = await client.autofill(settings_tx);
    const cst_signed = wallet.sign(cst_prepared);
    const cst_result = await client.submitAndWait(cst_signed.tx_blob)

    if (cst_result.result.meta.TransactionResult == "tesSUCCESS") {
		console.log('Account setting succeeded');
	} 
	else {
		console.log(`Error sending transaction: ${cst_result}`);
	}

    client.disconnect();
}


async function createTrustLine() {
    await client.connect();

    //const senderAddress = 'r94JnW46SVfF993hCdLWXRkfjW2x1C8TxD';
    const issuerAddress = 'rP9jPyP5kyvFRb6ZiRghAGw5u8SGAmU4bd';
    const receiverWallet = Wallet.fromSeed('sEdSdM2JL6Fsw2GSF8XyfUmonyWCNfi');

    const trustSet_tx = {
        "TransactionType": "TrustSet",
        "Account": receiverWallet.address,
        "LimitAmount": {
          "currency": 'TST',
          "issuer": issuerAddress,
          "value": '15'
        }
    }

    const ts_prepared = await client.autofill(trustSet_tx);

    const ts_signed = receiverWallet.sign(ts_prepared);

    const ts_result = await client.submitAndWait(ts_signed.tx_blob);

    if (ts_result.result.meta.TransactionResult == "tesSUCCESS") {
		console.log(`Trustline established between account ${issuerAddress} and ${receiverWallet.address}`);
	  } 
	else {
		console.log(`Error sending transaction: ${ts_result.result.meta.TransactionResult}`);
	}

    client.disconnect();
}


async function sendCurrency() {
    await client.connect();

    const senderWallet = Wallet.fromSeed('sEdSdM2JL6Fsw2GSF8XyfUmonyWCNfi');
    const issuerAddress = 'rP9jPyP5kyvFRb6ZiRghAGw5u8SGAmU4bd';
    const receiverAddress = 'rMcjaY2WJuXL6TmQdnA7auWoi1sFUnkdHh';


    const send_token_tx = {
      "TransactionType": "Payment",
      "Account": senderWallet.address,
      "Amount": {
        "currency": 'TST',
        "value": '1',
        "issuer": issuerAddress
      },
      "Destination": receiverAddress
    }

    const pay_prepared = await client.autofill(send_token_tx)
    const pay_signed = senderWallet.sign(pay_prepared)
    const pay_result = await client.submitAndWait(pay_signed.tx_blob)

    if (pay_result.result.meta.TransactionResult == "tesSUCCESS") {
		console.log('Transaction succeeded: https://testnet.xrpl.org/transactions/${pay_signed.hash}')
	} 
	else {
		console.log(`Error sending transaction: ${pay_result.result.meta.TransactionResult}`)
	}

    client.disconnect();
}



sendCurrency();









/*
  TO SEND XRPL TOKENS WE SHOULD
  1) setup trustline from recepient to issuer of token (we rely on recepient)
  2) configure sender settings (we setup settings only once for hot wallet)


  TO GET XRPL TOKENS WE SHOULD
  1) setup trustline from our hot wallet to token issuer
*/