# OINK: The Open-INcentive-Kit

The goal of Oink is to provide an easy-to-extend framework for simple, secure,
robust, and reliable incentive-based studies.

We are initially developing Oink as part of the [GridWatch](https://grid.watch)
project, specifically for the DumsorWatch deployment in greater Accra, however
the long-term aim is for Oink to live as a standalone entity to accelerate and
ease future studies.


## Getting Started

Right this second, everything is a pretty rough around the edges, and getting
started will require having your head reasonably well wrapped around the
[Firebase](https://firebase.google.com) and
[Firestore](https://firebase.google.com/docs/firestore/) ecosystems.

### Installations / Prerequisites

1. The first step is to install the [Firebase CLI tools](https://firebase.google.com/docs/cli/),
be sure to follow the steps to log in to firebase too.

2. Now head to `cd src/firebase_functions/functions` and run
`firebase functions:config:get > .runtimeconfig.json`. **Careful**, these are
private variables that are made available by the firebase environment, things
such as passwords. Don't commit this file! (It's .gitignore'd).

3. Some of the support scripts will need you to have the Python firestore
library installed: `pip install --upgrade google-cloud-firestore`

4. You will also need the [Google Cloud SDK](https://cloud.google.com/sdk/),
be sure to get through `gcloud auth login` from their setup directions.

5. The firebase cloud runs a pretty out of date version of node, so install
the [Node Version Manager (nvm)](https://github.com/creationix/nvm). Once you
have that set up, grab the current firebase node version, which as of this
writing is `nvm install 6.11.5` (once) and `nvm use 6.11.5` (every terminal
session).

### Digging in

Head into the [src](src/README.md) to start learning about how Oink works.
