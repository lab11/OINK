const functions = require('firebase-functions');
const curl = require('curlrequest');
const admin = require('firebase-admin');
const util = require('util');
const request = require('request-promise');
const crypto = require('crypto');
const sortObj = require('sort-object');
try {admin.initializeApp();} catch(e) {}
 // You do that because the admin SDK can only be initialized once.

//Creating a firebase object to navigate it:
var db = admin.firestore();
var FieldValue = admin.firestore.FieldValue;

// Grab callback location from environment as it must point to this firebase instance
const CALLBACK = functions.config().payment.korba.callback;

//korba funtion:
// - Module for for korba-specific users. It's triggered by core1 function using an HTTPS request.
// - Structures the data to be sent to the Korba API proxy.
exports = module.exports = functions.https.onRequest((req, res) => {
    const reqBody = req.body

    // Korba API requires a leading 0
    var phone_number = reqBody.phone_number;
    if (phone_number.length == 9) {
        phone_number = '0' + phone_number;
    }

    // Korba API has specific "codes" it expects
    var network_code = reqBody.phone_carrier;
    if (network_code.toLowerCase() == 'airtel') {
        network_code = 'AIR';
    } else if (network_code.toLowerCase() == 'mtn') {
        network_code = 'MTN';
    } else if (network_code.toLowerCase() == 'tigo') {
        network_code = 'TIG';
    } else if (network_code.toLowerCase() == 'glo') {
        network_code = 'GLO';
    } else if (network_code.toLowerCase() == 'vodafone') {
        network_code = 'VOD';
    } else {
        console.error(`'Unknown network_code "${network_code}" will almost certainly fail at Korba'`);
    }

    const jsonInfo = {
        "customer_number": phone_number,
        "amount": reqBody.amount,
        "transaction_id": reqBody.transaction_id,
        "network_code": network_code,
        "callback_url": CALLBACK,
        "description": reqBody.description,
        "client_id": 14
        }
    console.log(`The Disbursement API request is: ${util.inspect(jsonInfo)}`);
    console.log(util.inspect(reqBody));
    return request({
            uri: 'https://korba.grid.watch/api',
            method: 'POST',
            headers:{
            'Content-Type':'application/json',
            },
            json: true,
            body: jsonInfo,
            resolveWithFullResponse: true,
         }).then((response) => {
                console.log(`Response status: ${response.statusCode}`)
                if (response.statusCode >= 400) {
                throw new Error(`HTTP Error: ${response.statusCode}`);
                res.status(response.statusCode).send(response.body)
                }

                console.log('Posted with response from API: ', response.body);
                console.log('Status from korba: ', response.statusCode);
                res.status(response.statusCode).send(response.body)

        }).catch((error) => { 
            console.log(`This is the error: ${error}`)
            res.send(error)
        });

});

