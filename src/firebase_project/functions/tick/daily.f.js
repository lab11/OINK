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

                if (data.incentivized && data.app_installed) {
                    //update the number of incentivized days
                    console.log(Date.now())
                    console.log(data.app_install_time.toDate())
                    console.log(Date.now() - data.app_install_time.toDate())
                    to_update.app_incentivized_days = Math.round((Date.now() - data.app_install_time.toDate())/1000/(24*3600));
                }

                //We could add some checks to see if powerwatch is active/plugged in here if we want
                if (data.incentivized && data.powerwatch_installed) {
                    console.log(Date.now())
                    console.log(data.powerwatch_install_time.toDate())
                    console.log(Date.now() - data.powerwatch_install_time.toDate())
                    to_update.powerwatch_incentivized_days = Math.round((Date.now() - data.powerwatch_install_time.toDate())/1000/(24*3600));
                }

                if (Object.keys(to_update).length > 0) {
                    writes.push(doc.ref.update(to_update));
                }
            });

            return Promise.all(writes);
        })
    );

    return Promise.all(todo);
});

