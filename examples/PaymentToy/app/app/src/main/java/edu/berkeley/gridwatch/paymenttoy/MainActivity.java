package edu.berkeley.gridwatch.paymenttoy;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.support.design.widget.Snackbar;
import android.support.v4.app.ActivityCompat;
import android.support.v7.app.AlertDialog;
import android.support.v7.app.AppCompatActivity;
import android.telephony.TelephonyManager;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.PermissionRequest;
import android.widget.TextView;
import android.widget.Toast;

import com.google.android.gms.appinvite.AppInviteInvitation;
import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.api.GoogleApiClient;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.analytics.FirebaseAnalytics;
import com.google.firebase.appinvite.FirebaseAppInvite;
import com.google.firebase.dynamiclinks.FirebaseDynamicLinks;
import com.google.firebase.dynamiclinks.PendingDynamicLinkData;
import com.google.firebase.firestore.DocumentReference;
import com.google.firebase.firestore.DocumentSnapshot;
import com.google.firebase.firestore.FieldValue;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.QuerySnapshot;
import com.google.firebase.firestore.SetOptions;
import com.google.firebase.iid.FirebaseInstanceId;


import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import pub.devrel.easypermissions.AfterPermissionGranted;
import pub.devrel.easypermissions.AppSettingsDialog;
import pub.devrel.easypermissions.EasyPermissions;

public class MainActivity extends AppCompatActivity implements
        GoogleApiClient.OnConnectionFailedListener,
        EasyPermissions.PermissionCallbacks,
        View.OnClickListener {

    private static final String PREF_PHONE_NUM = "PREF_PHONE_NUM";
    private FirebaseAnalytics mFirebaseAnalytics;
    private static final String TAG = MainActivity.class.getSimpleName();
    private static final int REQUEST_INVITE = 0;
    private static String uniqueID = null;
    private static final String PREF_UNIQUE_ID = "PREF_UNIQUE_ID";
    private static final String PREF_NUM_INVITES = "PREF_NUM_INVITES";
    private static final int RC_READ_PHONE_PERM = 123;

    private TextView num_remaining_invites;
    FirebaseFirestore db;


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // [START_EXCLUDE]
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        mFirebaseAnalytics = FirebaseAnalytics.getInstance(this);
        db = FirebaseFirestore.getInstance();

        // Invite button click listener
        findViewById(R.id.invite_button).setOnClickListener(this);
        findViewById(R.id.refreshTokenBtn).setOnClickListener(this);

        SharedPreferences sharedPrefs = this.getSharedPreferences(
                PREF_UNIQUE_ID, Context.MODE_PRIVATE);
        String imei = sharedPrefs.getString(PREF_UNIQUE_ID, "-1"); //should be replaced if new user
        mFirebaseAnalytics.setUserId(imei);
        checkIfNewUser(getApplicationContext());


        // [END_EXCLUDE]
        num_remaining_invites = findViewById(R.id.numRemainingInviteVal);


        // Check for App Invite invitations and launch deep-link activity if possible.
        // Requires that an Activity is registered in AndroidManifest.xml to handle
        // deep-link URLs.
        FirebaseDynamicLinks.getInstance().getDynamicLink(getIntent())
                .addOnSuccessListener(this, new OnSuccessListener<PendingDynamicLinkData>() {
                    @Override
                    public void onSuccess(PendingDynamicLinkData data) {
                        if (data == null) {
                            Log.d(TAG, "getInvitation: no data");
                            return;
                        }

                        // Get the deep link
                        Uri deepLink = data.getLink();

                        // Extract invite
                        FirebaseAppInvite invite = FirebaseAppInvite.getInvitation(data);
                        if (invite != null) {
                            String invitationId = invite.getInvitationId();
                        }

                        // Handle the deep link
                        // [START_EXCLUDE]
                        Log.d(TAG, "deepLink:" + deepLink);
                        if (deepLink != null) {
                            Intent intent = new Intent(Intent.ACTION_VIEW);
                            intent.setPackage(getPackageName());
                            intent.setData(deepLink);

                            //TODO figure out who sent the invite


                            startActivity(intent);
                        }
                        // [END_EXCLUDE]
                    }
                })
                .addOnFailureListener(this, new OnFailureListener() {
                    @Override
                    public void onFailure(@NonNull Exception e) {
                        Log.w(TAG, "getDynamicLink:onFailure", e);
                    }
                });
    }
    // [END on_create]

    @Override
    public void onConnectionFailed(@NonNull ConnectionResult connectionResult) {
        Log.d(TAG, "onConnectionFailed:" + connectionResult);
        showMessage(getString(R.string.google_play_services_error));
    }

    /**
     * User has clicked the 'Invite' button, launch the invitation UI with the proper
     * title, message, and deep link
     */
    // [START on_invite_clicked]
    private void onInviteClicked() {
        //TODO check if online

        Intent intent = new AppInviteInvitation.IntentBuilder(getString(R.string.invitation_title))
                .setMessage(getString(R.string.invitation_message))
                .setDeepLink(Uri.parse(getString(R.string.invitation_deep_link)))
                .setCustomImage(Uri.parse(getString(R.string.invitation_custom_image)))
                .setCallToActionText(getString(R.string.invitation_cta))
                .build();
        startActivityForResult(intent, REQUEST_INVITE);
    }
    // [END on_invite_clicked]

    // [START on_activity_result]
    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        Log.d(TAG, "onActivityResult: requestCode=" + requestCode + ", resultCode=" + resultCode);

        if (requestCode == AppSettingsDialog.DEFAULT_SETTINGS_REQ_CODE) {

            // Do something after user returned from app settings screen, like showing a Toast.
            Toast.makeText(
                    this,
                    "welcome back",
                    Toast.LENGTH_LONG)
                    .show();
        }

        if (requestCode == REQUEST_INVITE) {
            Log.d(TAG, "hit");
            if (resultCode == RESULT_OK) {
                Log.d(TAG, "ok");
                // Get the invitation IDs of all sent messages
                String[] ids = AppInviteInvitation.getInvitationIds(resultCode, data);
                String ids_str = "";
                for (String id : ids) {
                    ids_str = id + ",";
                    Log.d(TAG, "onActivityResult: sent invitation " + id);
                }
                ids_str = ids_str.substring(0, ids_str.length() - 1);
                sendInviteTransaction(ids.length, ids_str);
            } else {
                // Sending failed or it was canceled, show failure message to the user
                // [START_EXCLUDE]
                showMessage(getString(R.string.send_failed));
                // [END_EXCLUDE]
            }
        }
    }
    // [END on_activity_result]


    public void sendInviteTransaction(int num, String ids) {
        String id = id(getApplicationContext());
        Map<String, Object> invite_transaction = new HashMap<>();
        invite_transaction.put("imei", id); //TODO
        invite_transaction.put("invite_ids", ids);
        invite_transaction.put("num_invites_sent", String.valueOf(num));
        invite_transaction.put("state", "pending");
        invite_transaction.put("time", FieldValue.serverTimestamp());
        db.collection("invite_transactions")
                .add(invite_transaction)
                .addOnSuccessListener(new OnSuccessListener<DocumentReference>() {
                    @Override
                    public void onSuccess(DocumentReference documentReference) {
                        Log.d(TAG, "DocumentSnapshot added with ID: " + documentReference.getId());
                    }
                })
                .addOnFailureListener(new OnFailureListener() {
                    @Override
                    public void onFailure(@NonNull Exception e) {
                        Log.w(TAG, "Error adding document", e);
                    }
                });
    }

    private void showMessage(String msg) {
        ViewGroup container = findViewById(R.id.snackbar_layout);
        Snackbar.make(container, msg, Snackbar.LENGTH_SHORT).show();
    }

    @Override
    public void onClick(View view) {
        int i = view.getId();
        if (i == R.id.invite_button) {
            onInviteClicked();
        }
        if (i == R.id.refreshTokenBtn) {
            Intent intent = new Intent(Intent.ACTION_DELETE);
            intent.setData(Uri.parse("edu.berkeley.gridwatch.paymenttoy"));
            startActivity(intent);

            //checkIfNewUser(this);
        }
    }


    public synchronized String id(Context context) {
        if (uniqueID == null) {
            SharedPreferences sharedPrefs = context.getSharedPreferences(
                    PREF_UNIQUE_ID, Context.MODE_PRIVATE);
            uniqueID = sharedPrefs.getString(PREF_UNIQUE_ID, null);
            if (uniqueID == null) {
                TelephonyManager phoneMgr = (TelephonyManager) getSystemService(Context.TELEPHONY_SERVICE);
                if (hasReadPhonePermissions()) {
                    String phone_num = phoneMgr.getLine1Number();
                    String imei = phoneMgr.getImei();
                    SharedPreferences.Editor editor = sharedPrefs.edit();
                    editor.putString(PREF_UNIQUE_ID, imei);
                    editor.putString(PREF_PHONE_NUM, phone_num);
                    editor.commit();
                    checkIfNewUser(this);
                } else {
                    EasyPermissions.requestPermissions(
                            this,
                            "Phone number",
                            RC_READ_PHONE_PERM,
                            android.Manifest.permission.READ_PHONE_STATE);
                }
            }
        }
        return uniqueID;
    }

    private void checkIfNewUser(Context context) {
        Log.e("CHECKING USER", "hit");
        final FirebaseFirestore db = FirebaseFirestore.getInstance();
        String id = id(context);
        if (id == null) return;
        DocumentReference docRef = db.collection("user_list").document(id);
        docRef.get().addOnCompleteListener(new OnCompleteListener<DocumentSnapshot>() {
            @Override
            public void onComplete(@NonNull Task<DocumentSnapshot> task) {
                if (task.isSuccessful()) {
                    DocumentSnapshot document = task.getResult();
                    if (document.exists()) {
                        Log.e(TAG, "USER DATA FOUND: " + task.getResult().getData());
                        if ((boolean) document.get("active")) {
                            Log.e("user", "user already active");
                        } else {
                            db.collection("user_list").document(document.getId()).update("active", true).addOnSuccessListener(new OnSuccessListener<Void>() {
                                @Override
                                public void onSuccess(Void aVoid) {
                                    Log.e("user", "set active");
                                }
                            }).addOnFailureListener(new OnFailureListener() {
                                @Override
                                public void onFailure(@NonNull Exception e) {
                                    Log.e("user", "error setting active");
                                }
                            });
                        }
                    } else {
                        Log.e(TAG, "USER NOT FOUND");
                        createUser();
                    }
                } else {
                    Log.e(TAG, "USER CHECK FAILED ", task.getException());
                }
            }
        });

    }

    private boolean hasReadPhonePermissions() {
        return EasyPermissions.hasPermissions(this, android.Manifest.permission.READ_PHONE_STATE);
    }

    @AfterPermissionGranted(RC_READ_PHONE_PERM)
    private void createUser() {
        Log.e("CREATING USER", "hit");
        final FirebaseFirestore db = FirebaseFirestore.getInstance();
        String id = id(this);
        String token = FirebaseInstanceId.getInstance().getToken();
        TelephonyManager phoneMgr = (TelephonyManager) getSystemService(Context.TELEPHONY_SERVICE);
        if (hasReadPhonePermissions()) {
            String phone_num  = phoneMgr.getLine1Number();
            final String imei = phoneMgr.getImei();
            mFirebaseAnalytics.setUserId(imei); //is this enough?
            Map<String, Object> user = new HashMap<>();
            user.put("time", FieldValue.serverTimestamp());
            user.put("token", token);
            user.put("active", true);
            user.put("imei", imei);
            user.put("instance_id", FirebaseInstanceId.getInstance().getId());
            SharedPreferences sharedPrefs = this.getSharedPreferences(
                    PREF_UNIQUE_ID, Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = sharedPrefs.edit();
            editor.putString(PREF_UNIQUE_ID, imei);
            editor.putString(PREF_PHONE_NUM, phone_num);
            editor.commit();
            if (phone_num != null) {
                Log.e("USER PHONE NUMBER", phone_num);
            } else {
                //TODO pop up alert dialog asking for phone number... same on lack of permission
                phone_num = "unknown"; //TODO if not provided periodically recheck
                Log.e("USER", "error in getting phone number");
            }
            user.put("phone_num", phone_num);
            db.collection("user_list").document(id).set(user, SetOptions.merge());
            db.collection("fcm_token").whereEqualTo("token",token).get().addOnSuccessListener(new OnSuccessListener<QuerySnapshot>() {
                @Override
                public void onSuccess(QuerySnapshot documentSnapshots) {
                    if (documentSnapshots.getDocuments().size() > 0) {
                        Log.e("new user success", documentSnapshots.getDocuments().get(0).getId());
                        db.collection("fcm_token").document(documentSnapshots.getDocuments().get(0).getId()).update("imei", imei).addOnSuccessListener(new OnSuccessListener<Void>() {
                            @Override
                            public void onSuccess(Void aVoid) {
                                Log.e("new user success", "updated token");
                            }
                        }).addOnFailureListener(new OnFailureListener() {
                            @Override
                            public void onFailure(@NonNull Exception e) {
                                Log.e("new user failure", "didn't update token");
                            }
                        });
                    }
                }
            }).addOnFailureListener(new OnFailureListener() {
                @Override
                public void onFailure(@NonNull Exception e) {
                    Log.e("new user error", e.getLocalizedMessage());
                }
            });
        } else {
            EasyPermissions.requestPermissions(
                    this,
                    "Phone number",
                    RC_READ_PHONE_PERM,
                    android.Manifest.permission.READ_PHONE_STATE);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode,
                                           @NonNull String[] permissions,
                                           @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        // EasyPermissions handles the request result.
        EasyPermissions.onRequestPermissionsResult(requestCode, permissions, grantResults, this);
    }

    @Override
    public void onPermissionsGranted(int requestCode, @NonNull List<String> perms) {
        Log.d(TAG, "onPermissionsGranted:" + requestCode + ":" + perms.size());
        if (requestCode == RC_READ_PHONE_PERM) {
            checkIfNewUser(this); //redo user creation
        }
    }

    @Override
    public void onPermissionsDenied(int requestCode, @NonNull List<String> perms) {
        Log.d(TAG, "onPermissionsDenied:" + requestCode + ":" + perms.size());

        // (Optional) Check whether the user denied any permissions and checked "NEVER ASK AGAIN."
        // This will display a dialog directing them to enable the permission in app settings.
        if (EasyPermissions.somePermissionPermanentlyDenied(this, perms)) {
            new AppSettingsDialog.Builder(this).build().show();
        }
    }


}

