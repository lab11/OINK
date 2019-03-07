Korba Proxy
=================================

## Add secrets

Modify the secrets files to add the database usernames and passwords.

Note that the values in manually created secret files are base64 encoded

```
$ kubectl create secret generic korba-secret --from-file=korba.js
```

## Deploy the cluster

Switch to the cluster you are deploying on then:

```
$./deploy.py
```
