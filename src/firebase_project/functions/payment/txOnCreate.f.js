const functions = require('firebase-functions');
const admin = require('firebase-admin');
const util = require('util');
const request = require('request-promise');
try {admin.initializeApp();} catch(e) {}
 // You do that because the admin SDK can only be initialized once.

//Creating a firebase object to navigate it:
var db = admin.firestore();

const REGION = functions.config().general.region;
const PROJECT = functions.config().general.project;
const INSTANCE_URI = 'https://'+REGION+'-'+PROJECT+'.cloudfunctions.net';

exports = module.exports = functions.firestore
    .document('OINK_payment_tx/{docId}').onCreate((snapshot, context) =>{
        const data = snapshot.data();

        const s = util.inspect(data, {depth: 0});
        console.log(`Created record: ${s}`);

        var to_update = {};
        // The only valid status for an external caller to set is
        // 'starting', to immediately trigger a payment. In most cases,
        // this will likely be `undefined`.
        if (data.status != 'starting') {
            to_update.status = 'waiting';
        }
        if (data.retry != true) {
            to_update.num_attempts = 0;
            to_update.messages = [];
        }

        // On creation update internal record-keeping. An update call will
        // trigger right after this, which will trigger the actual payment
        // if we're starting immediately.
        return snapshot.ref.update(to_update);
    });
