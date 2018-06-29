Notification
============

This module is responsible for sending notifications.

A notification is sent immediately when created.


fcmOnCreate
-----------

Sends a message to the app of an installed user via Firebase Cloud Messaging.

Expects

    user_id     // Opaque user_id.
    title:      // A title to display atop the message.
    message:    // The message body.
