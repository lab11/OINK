Google App Engine Cron Tool
===========================

This is basically a clone of the appengine portion of
https://github.com/firebase/functions-cron

Branch/project management: The master branch will never commit a `cron.yaml` file.
Individual projects should `cp cron.example.yaml cron.yaml`, edit as needed, and
keep this up-to-date on their project branch.


Updating
--------

0. Ensure you are **not** on the `master` branch.

1. Edit `cron.yaml` as appropriate.

2. Configure the `gcloud` command-line tool to use the project your Firebase project.
```
$ gcloud config set project <your-project-id>
```

3. Deploy the application to App Engine.
```
$ gcloud app deploy app.yaml \cron.yaml
```


Initial Setup
-------------

1. Configure the `gcloud` command-line tool to use the project your Firebase project.
```
$ gcloud config set project <your-project-id>
```

2. Install the Python dependencies
```
$ pip install -t lib -r requirements.txt
```

3. Create an App Engine App
```
$ gcloud app create
```

4. Deploy the application to App Engine.
```
$ gcloud app deploy app.yaml \cron.yaml
```

5. Open [Google Cloud Logging](https://console.cloud.google.com/logs/viewer)
and in the right dropdown select "GAE Application". If you don't see this
option, it may mean that App Engine is still in the process of deploying.

6. Look for a log entry calling `/_ah/start`. If this entry isn't an error,
then you're done deploying the App Engine app.
