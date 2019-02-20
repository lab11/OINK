const functions = require('firebase-functions');
const admin = require('firebase-admin');
const util = require('util');
try {admin.initializeApp();} catch(e) {}
 // You do that because the admin SDK can only be initialized once.

// Creating a firebase object to navigate it:
var db = admin.firestore();
var FieldValue = admin.firestore.FieldValue;

// Promises to run once a day. No guarentees on when.
exports = module.exports = functions.pubsub.topic('tick-daily').onPublish((message, event) => {
    var todo = [];

    // DW-specific: Job that monitors adherence incentives
    // Also sends compliance incentives if that adherence has been met
    todo.push(db.collection('OINK_user_list').get()
        .then(docs => {
            var writes = [];

            docs.forEach(doc => {
                const data = doc.data();
                var to_update = {};

                //Ideally eventually something of this ilk here that's monitoring actual
                //compliance.

                if (data.incentivized && data.active) {
                    if (data.app_incentivized_days == undefined) {
                        data.app_incentivized_days = 0;
                    }
                    to_update.dwapp_incentivized_days = data.dwapp_incentivized_days + 1;
                }

                //We could add some checks to see if powerwatch is active/plugged in here if we want
                if (data.incentivized && data.powerwatch) {
                    if (data.powerwatch_incentivized_days == undefined) {
                        data.powerwatch_incentivized_days = 0;
                    }
                    to_update.powerwatch_incentivized_days = data.powerwatch_incentivized_days + 1;
                }

                /*if (days > 365) {
                    console.error("Unreasonable number of days -- bad timestamp?");
                    writes.push(db.collection('OINK_alarms_manual').doc().set({
                        reason: 'Unreasonable number of days -- bad timestamp?',
                        timestamp: FieldValue.serverTimestamp(),
                        now: now,
                        install_time: install_time,
                        diff: diff,
                        days: days,
                        data: data,
                    }));
                    return;
                }*/

                if (Object.keys(to_update).length > 0) {
                    writes.push(doc.ref.update(to_update));
                }
            });

            return Promise.all(writes);
        })
    );

    return Promise.all(todo);
});

