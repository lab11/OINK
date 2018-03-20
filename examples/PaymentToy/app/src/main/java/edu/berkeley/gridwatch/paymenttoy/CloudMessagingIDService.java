package edu.berkeley.gridwatch.paymenttoy;

import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.IBinder;
import android.provider.DocumentsContract;
import android.support.annotation.NonNull;
import android.support.v4.app.ActivityCompat;
import android.telephony.TelephonyManager;
import android.util.Log;

import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.FirebaseApiNotAvailableException;
import com.google.firebase.FirebaseApp;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.firestore.DocumentReference;
import com.google.firebase.firestore.DocumentSnapshot;
import com.google.firebase.firestore.FieldValue;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.QuerySnapshot;
import com.google.firebase.firestore.SetOptions;
import com.google.firebase.iid.FirebaseInstanceId;
import com.google.firebase.iid.FirebaseInstanceIdService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import pub.devrel.easypermissions.AfterPermissionGranted;
import pub.devrel.easypermissions.AppSettingsDialog;
import pub.devrel.easypermissions.EasyPermissions;

public class CloudMessagingIDService extends FirebaseInstanceIdService {

    private static final int REQUEST_INVITE = 0;
    private static String uniqueID = null;
    private static final String PREF_UNIQUE_ID = "PREF_UNIQUE_ID";
    private static final String TAG = CloudMessagingIDService.class.getSimpleName();
    private static final int RC_READ_PHONE_PERM = 123;

    public CloudMessagingIDService() {
    }

    @Override
    public void onTokenRefresh() {
        // Get updated InstanceID token.
        String refreshedToken = FirebaseInstanceId.getInstance().getToken();
        Log.d("CloudMessaging", "Refreshed token in service: " + refreshedToken);
        sendRegistrationToServer(refreshedToken);
    }

    public void sendRegistrationToServer(String token) {
        final FirebaseFirestore db = FirebaseFirestore.getInstance();
        String id = id(getApplicationContext());
        db.collection("fcm_token").whereEqualTo("imei", id).get().addOnSuccessListener(new OnSuccessListener<QuerySnapshot>() {
            @Override
            public void onSuccess(QuerySnapshot documentSnapshots) {
                List<DocumentSnapshot> a = documentSnapshots.getDocuments();
                for (int i = 0; i < a.size(); i++) {
                    Log.e("snapshot", a.toString());
                }
            }
        });
        Map<String, Object> reg_token = new HashMap<>();
        reg_token.put("imei", id);
        reg_token.put("token", token);
        reg_token.put("time", FieldValue.serverTimestamp());
        reg_token.put("instance_id", FirebaseInstanceId.getInstance().getId());
        db.collection("fcm_token").add(reg_token);
        //Clean up if there was already a token
        db.collection("user_list").document(id).update("token", token);
        db.collection("user_list").document(id).update("instance_id", FirebaseInstanceId.getInstance().getId());
    }

    @AfterPermissionGranted(RC_READ_PHONE_PERM)
    public synchronized String id(Context context) {
        if (uniqueID == null) {
            SharedPreferences sharedPrefs = context.getSharedPreferences(
                    PREF_UNIQUE_ID, Context.MODE_PRIVATE);
            uniqueID = sharedPrefs.getString(PREF_UNIQUE_ID, null);
            if (uniqueID == null) {
                TelephonyManager phoneMgr = (TelephonyManager) getSystemService(Context.TELEPHONY_SERVICE);
                if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.READ_PHONE_STATE) != PackageManager.PERMISSION_GRANTED) {
                    return "unknown";
                }
                return phoneMgr.getImei();

            }
        }
        return uniqueID;
    }


}
