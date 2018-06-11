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

    var customer_number = reqBody.customer_number;
    console.log('Customer number before anything: ' + customer_number);
    customer_number = customer_number.replace(/ /g,'');
    console.log('Space stripped: ' + customer_number);
    if (customer_number.slice(0,4) == '+233') {
        customer_number = customer_number.slice(4);
    }
    if ((customer_number.length > 9) && (customer_number.slice(0,3) == '233')) {
        customer_number = customer_number.slice(3);
    }
    if (customer_number.length < 9) {
        console.log('Phone number too short: ' + customer_number);
        return db.collection('OINK_alarms_db').add({
            timestamp: new Date().getTime(),
            user_id: customer_number,
            reason: "Impossibly short phone number",
        });
    }
    if (customer_number.length == 9) {
        customer_number = '0' + customer_number;
    }
    console.log('Customer number passed to Korba: ' + customer_number);

    const jsonInfo = {
        "customer_number": reqBody.customer_number,
        "amount": reqBody.amount,    
        "transaction_id": reqBody.transaction_id,
        "network_code": reqBody.network_code,
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

