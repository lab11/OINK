# OINK

This example does a couple of different things. 

1) Manages active users. It makes a user "active" when the user users the app. It makes a user "inactive" when the user removes the app.
2) Simulates the invite stimulus.

![alt text](https://github.com/lab11/OINK/blob/master/examples/PaymentToy/assets/logic_diagram.png)

Item 1 depends on a firebase function that marks a user inactive based on the
firebase analytics event app_removed. This is in the function folder.

 
This is far from completely implemented, and is missing different keys and such to authenticate with Firebase. 



