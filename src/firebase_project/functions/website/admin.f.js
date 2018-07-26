'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
try {admin.initializeApp();} catch(e) {}

//Creating a firebase object to navigate it:
var db = admin.firestore();

const express = require('express');
const cookieParser = require('cookie-parser')();
const cors = require('cors')({origin: true});

const app = express();
const api = express.Router();


///////////////////////////////////////////////////////////////////////////////////////
// AUTHENTICATION
//
// This middleware adds a `.user_id` field to a request, which will hold the ID of the
// user making the request. If the user is not authenticated, then no `.user_id` field
// will be added.

// https://github.com/firebase/functions-samples/tree/master/authorized-https-endpoint
// Express middleware that validates Firebase ID Tokens passed in the Authorization HTTP header.
// The Firebase ID token needs to be passed as a Bearer token in the Authorization HTTP header like this:
// `Authorization: Bearer <Firebase ID Token>`.
// when decoded successfully, the ID Token content will be added as `req.user`.
const validateFirebaseIdToken = (req, res, next) => {
  if ((!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) &&
      !(req.cookies && req.cookies.__session)) {
    console.error('No Firebase ID token was passed as a Bearer token in the Authorization header.',
        'Make sure you authorize your request by providing the following HTTP header:',
        'Authorization: Bearer <Firebase ID Token>',
        'or by passing a "__session" cookie.');
    res.status(403).send('Unauthorized');
    return;
  }

  let idToken;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    console.log('Found "Authorization" header');
    // Read the ID Token from the Authorization header.
    idToken = req.headers.authorization.split('Bearer ')[1];
  } else if(req.cookies) {
    console.log('Found "__session" cookie');
    // Read the ID Token from cookie.
    idToken = req.cookies.__session;
  } else {
    // No cookie
    //res.status(403).send('Unauthorized');
    // Pass through with no `req.user` field set (for routes not needing auth)
    return next();
  }

  admin.auth().verifyIdToken(idToken).then((decodedIdToken) => {
    console.log('ID Token correctly decoded', decodedIdToken);
    req.user = decodedIdToken;

    return next();
  }).catch((error) => {
    console.error('Error while verifying Firebase ID token:', error);
    res.status(403).send('Unauthorized');
  });
};

// TODO: The example just disables cross-origin protections, but I think we should be
// doing something smarter.
//
// https://stackoverflow.com/questions/42755131/enabling-cors-in-cloud-functions-for-firebase
app.use(cors);

// Parse `Cookie` header and populate `req.cookies` with an object keyed by the cookie names.
app.use(cookieParser);

// Custom middleware that uses firebase auth to populate `req.user` for authenticated users.
app.use(validateFirebaseIdToken);


///////////////////////////////////////////////////////////////////////////////////////
// PERMISSIONS
//
// TODO: We need to have a discussion about the types of operations we will export and
// how to secure them. In the short term, this implements simple binary role-based
// authentication (aka "is admin?"), however I think the modern thinking is to use a
// structure that assigns fine-grained permissions to routes and then grants certain
// permissions to roles.

// Current approach is based on
// https://gist.github.com/joshnuss/37ebaf958fe65a18d4ff

// XXX This should be somewhere better eventually
const authorizedUsers = [
  'pat.pannuto@gmail.com',
  'ppannuto@berkeley.edu',
  'nklugman@berkeley.edu',
  'podolsky@berkeley.edu',
  'scorreacardo@umass.edu',
  'berkouwer@berkeley.edu',
];

function user_to_role(user) {
  if (authorizedUsers.indexOf(user.email) > -1) {
    return 'admin';
  }
  return '';
}

function permit(...allowed) {
  // `...allowed` means this function takes an arbitrary number of arguments and puts
  // them into an array called `allowed`

  // helper function that looks up if the supplied `role` is in the `allowed` array
  const isAllowed = role => allowed.indexOf(role) > -1;

  return (req, res, next) => {
    const role = user_to_role(req.user);
    if (isAllowed(role)) {
      next();
    } else {
      res.status(403).send('Unauthorized');
    }
  }
}

// Add permission middleware.
app.use('/api/v1/admin', permit('admin'));

///////////////////////////////////////////////////////////////////////////////////////
// ROUTES

// API Version 1
//
// We only have one version right now (and hopefully ever), but scope everything under
// the v1 route to support future flexibility.

// Admin Routes
//
//
api.get('/v1/oink/payment/get-all-status/:status', (req, res) => {
  var response = [];
  db.collection('OINK_payment_tx').where('status', '==', req.params.status).get().then(snapshot => {
    snapshot.forEach(doc => {
      response.push(doc.data());
    })
    console.log('Preparing response:');
    console.log(response);
    res.send(response);
  })
  .catch((error) => {
    console.error('Promise error');
    console.error(error);
    return res.status(500).send('Internal Error.');
  })
});

// Mount API router.
app.use('/api', api);

///////////////////////////////////////////////////////////////////////////////////////
// EXPORTS

// This HTTPS endpoint can only be accessed by your Firebase Users.
// Requests need to be authorized by providing an `Authorization` HTTP header
// with value `Bearer <Firebase ID Token>`.
//exports.app = functions.https.onRequest(app);
exports = module.exports = functions.https.onRequest(app);
