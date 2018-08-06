// Based off of
// https://github.com/firebase/functions-samples/tree/master/authorized-https-endpoint

'use strict';

function Auth() {
  document.addEventListener('DOMContentLoaded', function() {
    // Shortcuts to DOM Elements.
    this.signInButton = document.getElementById('auth-sign-in-button');
    this.signOutButton = document.getElementById('auth-sign-out-button');
    this.loggedOutDiv = document.getElementById('auth-logged-out');
    this.loggedInDiv = document.getElementById('auth-logged-in');
    this.responseContainer = document.getElementById('demo-response');

    // Configuration
    // TODO: CURRENT STATUS, THIS IS IN /static SO CANT SUB VARIBLE
    //this.firebaseHost = "{{ .Site.Params.oink.host }}";
    this.firebaseHost = "http://localhost:5001/paymenttoy/us-central1/websiteAdmin/";

    // Bind events.
    this.signInButton.addEventListener('click', this.signIn.bind(this));
    this.signOutButton.addEventListener('click', this.signOut.bind(this));
    firebase.auth().onAuthStateChanged(this.onAuthStateChanged.bind(this));
  }.bind(this));
}

// Triggered on Firebase auth state change.
Auth.prototype.onAuthStateChanged = function(user) {
  if (user) {
    this.loggedOutDiv.style.display = 'none';
    this.loggedInDiv.style.display = 'block';

    // Once firebase is logged in, load all the panels that require authentication
    $('.auth-required').each((index, elem) => {
      this.request($(elem).attr('data-endpoint')).then((text) => {
        console.log("Setting", elem, "to", text);
        $(elem).text(text);
      })
    });
  } else {
    this.loggedOutDiv.style.display = 'block';
    this.loggedInDiv.style.display = 'none';
  }
};

// Initiates the sign-in flow using GoogleAuthProvider sign in in a popup.
Auth.prototype.signIn = function() {
  firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider());
};

// Signs-out of Firebase.
Auth.prototype.signOut = function() {
  firebase.auth().signOut();
};

// Return a Promise that will give the result of the request
Auth.prototype.request = function(endpoint) {
  return firebase.auth().currentUser.getIdToken().then(function(token) {
    const url = this.firebaseHost + endpoint;
    return new Promise((resolve, reject) => {
      console.log('Sending request to', url, 'with ID token in Authorization header.');
      var req = new XMLHttpRequest();
      req.onload = () => { resolve(req.responseText) };
      req.onerror = () => { reject('request error') };
      req.open('GET', url);
      req.setRequestHeader('Authorization', 'Bearer ' + token);
      req.send();
    });
  }.bind(this));
};

// Load the demo.
window.auth = new Auth();
