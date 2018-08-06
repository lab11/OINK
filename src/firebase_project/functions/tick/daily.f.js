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
    todo.push(db.collection('OINK_user_list').get()
        .then(docs => {
            var writes = [];

            docs.forEach(doc => {
                const data = doc.data();
                var to_update = {};

                /*

                Ideally eventually something of this ilk here that's monitoring actual
                compliance.

                if (data.incentivized && data.active) {
                    if (data.incentivized_days == undefined) {
                        data.incentivized_days = 0;
                    }
                    to_update.incentivized_days = data.incentivized_days + 1;
                }

                if (data.incentivized && data.powerwatch) {
                    if (data.powerwatch_days == undefined) {
                        data.powerwatch_days = 0;
                    }
                    to_update.powerwatch_days = data.powerwatch_days + 1;
                }
                */

                const now = admin.firestore.Timestamp.now().toMillis();
                let install_time = data.dwapp_install_time;
                if (install_time instanceof admin.firestore.Timestamp) {
                    install_time = install_time.toMillis();
                }
                const diff = now - install_time;
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                console.log(now, install_time, diff, days);

                if (days > 365) {
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
                }


                // For now, just do math and update days:
                if (data.incentivized && data.active) {
                    to_update.incentivized_days = days;
                }
                if (data.incentivized && data.powerwatch) {
                    to_update.powerwatch_days = days;
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

