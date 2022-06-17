const xrpl = require('xrpl')
const BigNumber = require('bignumber.js')
const client = new xrpl.Client("wss://s1.ripple.com:443")
const Wallet = xrpl.Wallet;
var crypto = require("crypto");
var eccrypto = require("eccrypto");
// import { ec } from 'elliptic';
var ec = require('elliptic').ec;
const secp256k1 = new ec('secp256k1');
const classicAddressToXAddress = xrpl.classicAddressToXAddress;


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

    const issuerAddress = 'rnRXAnVZTyattZXEpKpgTyvdm17DpjrzSZ';
    const receiverWallet = Wallet.fromSeed('snyGcUjYbPwjnAHfMxou4a2tcCZRs');

    const trustSet_tx = {
        "TransactionType": "TrustSet",
        "Account": receiverWallet.address,
        "LimitAmount": {
          "currency": '53686962614E4654000000000000000000000000',
          "issuer": issuerAddress,
          "value": '90000000000001'
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

    const privateKey = '00ECD0C11E281F8A3F55AA32D94159A62D02FAB99D443E16D4386500EC1B0D24F3';
    const publicKeyBuff = Buffer.from(secp256k1.keyFromPrivate(privateKey.slice(2)).getPublic().encodeCompressed('array'))
    const publicKey = publicKeyBuff.toString(`hex`).toUpperCase()

    const senderWallet = new Wallet(publicKey, privateKey);
    
  
    let xAddress = classicAddressToXAddress('rnZwDSjUvyYnKm2iQcdP4WtcGYsx2QD3A6', parseInt('462981301', 10), false)

    const send_token_tx = {
      "TransactionType": "Payment",
      "Account": senderWallet.address,
      "Amount": {
        "currency": '53686962614E4654000000000000000000000000',
        "value": '100',
        "issuer": 'rnRXAnVZTyattZXEpKpgTyvdm17DpjrzSZ'
      },
      "Destination": xAddress
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

// Wallet {
//   publicKey: '03C5AA2E0C852C76E5CF83D95A73A0BE3450E7EDE63FC34361CA7EFAE910168915',
//   privateKey: '00ECD0C11E281F8A3F55AA32D94159A62D02FAB99D443E16D4386500EC1B0D24F3',
//   classicAddress: 'r9vbzEihnp2gzsodkaf7UpVchU1d3L3od4',
//   seed: 'snyGcUjYbPwjnAHfMxou4a2tcCZRs'
// }
