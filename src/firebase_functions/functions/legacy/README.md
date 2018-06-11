Legacy Compatability
====================

Older versions of Android may have Google Play Services that are too old to
support some of the Firebase features the app expects to use. For some
functionality, we provide a fallback via a simple POST.

The app POSTs to these endpoints which will write firebase records on their
behalf.
