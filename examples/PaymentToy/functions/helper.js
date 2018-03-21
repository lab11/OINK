const Firestore = require('@google-cloud/firestore');

const firestore = new Firestore({
  projectId: 'paymenttoy',
  keyFilename: './keyfile.json',
});

const document = firestore.doc('payments');

// Enter new data into the document.
document.set({
  title: 'Welcome to Firestore',
  body: 'Hello World',
}).then(() => {
  // Document created successfully.
});

// Update an existing document.
document.update({
  body: 'My first Firestore app',
}).then(() => {
  // Document updated successfully.
});

// Read the document.
document.get().then(doc => {
  // Document read successfully.
  console.log(doc);
});

