//import * as functions from 'firebase-functions';
//import db from './db';

// Following the structure from
// https://github.com/malikasinger1/firebase-functions-with-typescript
// as suggested in
// https://stackoverflow.com/questions/44432378/unable-to-split-firebase-functions-in-multiple-files

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

import glob = require('glob');
import camelCase = require('camelcase');
const files = glob.sync('../**/*.f.js', { cwd: __dirname, ignore: '../node_modules/**'});
for (let f=0; f < files.length; f++) {
    const file = files[f];
    const functionName = camelCase(file.slice(0, -5).split('/').join('_')); // Strip off '.f.js'
    if (!process.env.FUNCTION_NAME || process.env.FUNCTION_NAME === functionName) {
        exports[functionName] = require(file);
    }
}