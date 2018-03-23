The main classes to care about are:

CloudMessagingIDService
and 
MainActivity

CloudMessagingIDService is called whenever a FCM token is updated. It then adds this token to the correct spot in the userlist.

MainActivity does a couple things:

1) onCreate:
	registers a user with firebase
	gets the imei
	sets up ui
	sets up a deep link (don't worry about this now)

2) onInviteClicked:
	calles firebase invite

3) onActivityResult
	when back from an invite generate the stimui to the OINK system

4) sendInviteTransaction
	populate the stimus-tx table in the OINK system for invite

5) id (terrible name... sorry)
	get the unique ID from the phone... copied from the CloudMessagingIDService
		(the rational behind this twice is that we can't control when the cmid service is called. ID needs to be gathered here due to permissions reasons. This should be a helper service but its not.)

6) checkIfNewUser
	checks if current user is new. Adds to db if so. Marks active if not.

7) createUser
	adds new user to db

8) *permissions* 
	handles runtime permissions


