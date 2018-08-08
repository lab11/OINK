import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

admin.initializeApp(functions.config().firebase)

const firestore = admin.firestore();
firestore.settings({timestampsInSnapshots: true});
export default firestore;

const firebase = admin.database();
export { firebase }