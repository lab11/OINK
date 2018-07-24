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
    //this.helloUserUrl = window.location.href + 'hello';
    this.helloUserUrl = 'http://localhost:5001/paymenttoy/us-central1/websiteAdmin/hello';

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
    this.startFunctionsRequest();
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

// Does an authenticated request to a Firebase Functions endpoint using an Authorization header.
Auth.prototype.startFunctionsRequest = function() {
  firebase.auth().currentUser.getIdToken().then(function(token) {
    console.log('Sending request to', this.helloUserUrl, 'with ID token in Authorization header.');
    var req = new XMLHttpRequest();
    req.onload = function() {
      this.responseContainer.innerText = req.responseText;
    }.bind(this);
    req.onerror = function() {
      this.responseContainer.innerText = 'There was an error';
    }.bind(this);
    req.open('GET', this.helloUserUrl, true);
    req.setRequestHeader('Authorization', 'Bearer ' + token);
    req.send();
  }.bind(this));
};

// Load the demo.
window.auth = new Auth();
