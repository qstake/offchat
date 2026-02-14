package app.offchat.messenger.plugins;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothManager;
import android.bluetooth.le.AdvertiseCallback;
import android.bluetooth.le.AdvertiseData;
import android.bluetooth.le.AdvertiseSettings;
import android.bluetooth.le.BluetoothLeAdvertiser;
import android.bluetooth.BluetoothGattServer;
import android.bluetooth.BluetoothGattServerCallback;
import android.bluetooth.BluetoothGattService;
import android.bluetooth.BluetoothGattCharacteristic;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothGatt;
import android.bluetooth.BluetoothProfile;
import android.content.Context;
import android.os.ParcelUuid;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

@CapacitorPlugin(name = "BleAdvertiser")
public class BleAdvertiserPlugin extends Plugin {
    private static final String TAG = "BleAdvertiser";
    
    private static final UUID SERVICE_UUID = UUID.fromString("19b10000-e8f2-537e-4f6c-d104768a1214");
    private static final UUID MESSAGE_CHAR_UUID = UUID.fromString("19b10001-e8f2-537e-4f6c-d104768a1214");
    private static final UUID DISCOVERY_CHAR_UUID = UUID.fromString("19b10002-e8f2-537e-4f6c-d104768a1214");

    private BluetoothManager bluetoothManager;
    private BluetoothAdapter bluetoothAdapter;
    private BluetoothLeAdvertiser advertiser;
    private BluetoothGattServer gattServer;
    private boolean isAdvertising = false;
    private String currentUserId = "";
    private String currentUsername = "";
    
    private AdvertiseCallback advertiseCallback;

    @Override
    public void load() {
        bluetoothManager = (BluetoothManager) getContext().getSystemService(Context.BLUETOOTH_SERVICE);
        if (bluetoothManager != null) {
            bluetoothAdapter = bluetoothManager.getAdapter();
        }
    }

    @PluginMethod
    public void startAdvertising(PluginCall call) {
        if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled()) {
            call.reject("Bluetooth is not enabled");
            return;
        }

        if (!bluetoothAdapter.isMultipleAdvertisementSupported()) {
            call.reject("BLE advertising not supported on this device");
            return;
        }

        currentUserId = call.getString("userId", "");
        currentUsername = call.getString("username", "");
        String localName = call.getString("localName", "Offchat");

        try {
            bluetoothAdapter.setName(localName);
        } catch (SecurityException e) {
            Log.w(TAG, "Could not set Bluetooth name: " + e.getMessage());
        }

        try {
            startGattServer();
        } catch (Exception e) {
            Log.e(TAG, "Failed to start GATT server: " + e.getMessage());
            call.reject("Failed to start GATT server: " + e.getMessage());
            return;
        }

        advertiser = bluetoothAdapter.getBluetoothLeAdvertiser();
        if (advertiser == null) {
            call.reject("BLE advertiser not available");
            return;
        }

        AdvertiseSettings settings = new AdvertiseSettings.Builder()
            .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
            .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
            .setConnectable(true)
            .setTimeout(0)
            .build();

        AdvertiseData data = new AdvertiseData.Builder()
            .setIncludeDeviceName(true)
            .addServiceUuid(new ParcelUuid(SERVICE_UUID))
            .build();

        AdvertiseData scanResponse = new AdvertiseData.Builder()
            .setIncludeDeviceName(false)
            .addServiceUuid(new ParcelUuid(SERVICE_UUID))
            .build();

        advertiseCallback = new AdvertiseCallback() {
            @Override
            public void onStartSuccess(AdvertiseSettings settingsInEffect) {
                isAdvertising = true;
                Log.i(TAG, "BLE advertising started successfully");
            }

            @Override
            public void onStartFailure(int errorCode) {
                isAdvertising = false;
                Log.e(TAG, "BLE advertising failed with error: " + errorCode);
            }
        };

        try {
            advertiser.startAdvertising(settings, data, scanResponse, advertiseCallback);
            call.resolve();
        } catch (SecurityException e) {
            call.reject("Bluetooth permission denied: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopAdvertising(PluginCall call) {
        try {
            if (advertiser != null && advertiseCallback != null) {
                advertiser.stopAdvertising(advertiseCallback);
            }
            if (gattServer != null) {
                gattServer.close();
                gattServer = null;
            }
            isAdvertising = false;
            call.resolve();
        } catch (SecurityException e) {
            call.reject("Failed to stop advertising: " + e.getMessage());
        }
    }

    @PluginMethod
    public void isAdvertising(PluginCall call) {
        JSObject result = new JSObject();
        result.put("advertising", isAdvertising);
        call.resolve(result);
    }

    private void startGattServer() {
        BluetoothGattServerCallback gattCallback = new BluetoothGattServerCallback() {
            @Override
            public void onConnectionStateChange(BluetoothDevice device, int status, int newState) {
                if (newState == BluetoothProfile.STATE_CONNECTED) {
                    Log.i(TAG, "Device connected: " + device.getAddress());
                    notifyDeviceConnected(device);
                } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
                    Log.i(TAG, "Device disconnected: " + device.getAddress());
                    notifyDeviceDisconnected(device);
                }
            }

            @Override
            public void onCharacteristicReadRequest(BluetoothDevice device, int requestId, int offset,
                    BluetoothGattCharacteristic characteristic) {
                try {
                    if (characteristic.getUuid().equals(DISCOVERY_CHAR_UUID)) {
                        String discoveryJson = "{\"type\":\"discovery\",\"userId\":\"" + currentUserId + 
                            "\",\"username\":\"" + currentUsername + "\",\"timestamp\":" + System.currentTimeMillis() + "}";
                        gattServer.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, offset,
                            discoveryJson.getBytes(StandardCharsets.UTF_8));
                    } else {
                        gattServer.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, offset,
                            new byte[0]);
                    }
                } catch (SecurityException e) {
                    Log.e(TAG, "Security exception on read: " + e.getMessage());
                }
            }

            @Override
            public void onCharacteristicWriteRequest(BluetoothDevice device, int requestId,
                    BluetoothGattCharacteristic characteristic, boolean preparedWrite,
                    boolean responseNeeded, int offset, byte[] value) {
                try {
                    String data = new String(value, StandardCharsets.UTF_8);
                    
                    if (characteristic.getUuid().equals(MESSAGE_CHAR_UUID)) {
                        notifyMessageReceived(device, data);
                    } else if (characteristic.getUuid().equals(DISCOVERY_CHAR_UUID)) {
                        notifyDiscoveryReceived(device, data);
                    }

                    if (responseNeeded) {
                        gattServer.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, offset, value);
                    }
                } catch (SecurityException e) {
                    Log.e(TAG, "Security exception on write: " + e.getMessage());
                }
            }
        };

        try {
            gattServer = bluetoothManager.openGattServer(getContext(), gattCallback);

            BluetoothGattService service = new BluetoothGattService(SERVICE_UUID,
                BluetoothGattService.SERVICE_TYPE_PRIMARY);

            BluetoothGattCharacteristic messageChar = new BluetoothGattCharacteristic(
                MESSAGE_CHAR_UUID,
                BluetoothGattCharacteristic.PROPERTY_READ | 
                BluetoothGattCharacteristic.PROPERTY_WRITE | 
                BluetoothGattCharacteristic.PROPERTY_NOTIFY,
                BluetoothGattCharacteristic.PERMISSION_READ | 
                BluetoothGattCharacteristic.PERMISSION_WRITE
            );

            BluetoothGattCharacteristic discoveryChar = new BluetoothGattCharacteristic(
                DISCOVERY_CHAR_UUID,
                BluetoothGattCharacteristic.PROPERTY_READ | 
                BluetoothGattCharacteristic.PROPERTY_WRITE | 
                BluetoothGattCharacteristic.PROPERTY_NOTIFY,
                BluetoothGattCharacteristic.PERMISSION_READ | 
                BluetoothGattCharacteristic.PERMISSION_WRITE
            );

            service.addCharacteristic(messageChar);
            service.addCharacteristic(discoveryChar);
            gattServer.addService(service);

            Log.i(TAG, "GATT server started with Offchat service");
        } catch (SecurityException e) {
            Log.e(TAG, "Failed to start GATT server: " + e.getMessage());
            throw e;
        }
    }

    private void notifyDeviceConnected(BluetoothDevice device) {
        JSObject data = new JSObject();
        data.put("deviceId", device.getAddress());
        try {
            data.put("name", device.getName());
        } catch (SecurityException e) {
            data.put("name", "Unknown");
        }
        notifyListeners("deviceConnected", data);
    }

    private void notifyDeviceDisconnected(BluetoothDevice device) {
        JSObject data = new JSObject();
        data.put("deviceId", device.getAddress());
        notifyListeners("deviceDisconnected", data);
    }

    private void notifyMessageReceived(BluetoothDevice device, String message) {
        JSObject data = new JSObject();
        data.put("deviceId", device.getAddress());
        data.put("data", message);
        notifyListeners("messageReceived", data);
    }

    private void notifyDiscoveryReceived(BluetoothDevice device, String discovery) {
        JSObject data = new JSObject();
        data.put("deviceId", device.getAddress());
        data.put("data", discovery);
        notifyListeners("discoveryReceived", data);
    }
}
