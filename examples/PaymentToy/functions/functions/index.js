const functions = require('firebase-functions');

const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });


exports.markUserRemoved = functions.analytics.event('app_removed').onLog(event => {
	console.log(event.data);
});


//exports.function_1 = functions.firestore
//	.document('invite_transaction/{trans}')
//	.onWrite((event) => { //2A
//		admin.firestore().collection('tx_transactions').
//	});

/*
		console.log(event.data);
		admin.firestore().collection('user_list').doc(event.data['id'])
			.get()
			.then(docs => {
				console.log(docs.data())
			})
			.catch(e => console.log(e))

*/


/*
exports.sendCouponOnPurchase = functions.analytics.event('in_app_purchase').onLog(event => {
	const user = event.data.user;
	const uid = user.userId; // The user ID set via the setUserId API.
	const purchaseValue = event.data.valueInUSD; // Amount of the purchase in USD.
	if (purchaseValue > 500) {
	       return sendHighValueCouponViaFCM(uid, userLanguage);
        }
	return sendCouponViaFCM(uid, userLanguage);
});

exports.smsRX = functions.https.onRequest((req, res) => {
	const original = req.query.text;
	admin.firestore().collection('messages').add({original: original}).then(writeResult => {
   		 res.json({result: `Message with ID: ${writeResult.id} added.`});
	});
});

exports.updateAllForNewUser = functions.firestore
	.document('user_list/{trans}')
	.onWrite((event) => {
		console.log(event.data);
		admin.firestore().collection('fcm_token')
});

exports.payInvite = functions.firestore
	.document('invite_transactions/{trans}')
	.onWrite((event) => {
		console.log(event.data);
		admin.firestore().collection('user_list').doc(event.data['id'])
			.get()
			.then(docs => {
				console.log(docs.data())
			})
			.catch(e => console.log(e))
	});
	/
