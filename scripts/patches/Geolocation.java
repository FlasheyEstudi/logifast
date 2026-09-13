package com.capacitorjs.plugins.geolocation;

import android.content.Context;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import androidx.core.location.LocationManagerCompat;
import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GoogleApiAvailability;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.Priority;
import java.util.List;

public class Geolocation {

    private FusedLocationProviderClient fusedLocationClient;
    private LocationCallback locationCallback;
    private LocationListener nativeLocationListener;
    private Context context;

    public Geolocation(Context context) {
        this.context = context;
    }

    public Boolean isLocationServicesEnabled() {
        LocationManager lm = (LocationManager) context.getSystemService(Context.LOCATION_SERVICE);
        return LocationManagerCompat.isLocationEnabled(lm);
    }

    @SuppressWarnings("MissingPermission")
    public void sendLocation(boolean enableHighAccuracy, final LocationResultCallback resultCallback) {
        if (!this.isLocationServicesEnabled()) {
            resultCallback.error("location disabled");
            return;
        }

        int resultCode = GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(context);
        if (resultCode == ConnectionResult.SUCCESS) {
            LocationManager lm = (LocationManager) context.getSystemService(Context.LOCATION_SERVICE);
            boolean networkEnabled = false;

            try {
                networkEnabled = lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER);
            } catch (Exception ex) {}

            int lowPriority = networkEnabled ? Priority.PRIORITY_BALANCED_POWER_ACCURACY : Priority.PRIORITY_LOW_POWER;
            int priority = enableHighAccuracy ? Priority.PRIORITY_HIGH_ACCURACY : lowPriority;

            LocationServices
                .getFusedLocationProviderClient(context)
                .getCurrentLocation(priority, null)
                .addOnFailureListener(e -> {
                    // Fallback a LocationManager si FusedLocation falla
                    sendLocationViaLocationManager(enableHighAccuracy, resultCallback);
                })
                .addOnSuccessListener(
                    location -> {
                        if (location == null) {
                            sendLocationViaLocationManager(enableHighAccuracy, resultCallback);
                        } else {
                            resultCallback.success(location);
                        }
                    }
                );
        } else {
            // Google Play Services no disponible (Huawei HMS / AOSP) -> Fallback nativo
            sendLocationViaLocationManager(enableHighAccuracy, resultCallback);
        }
    }

    @SuppressWarnings("MissingPermission")
    private void sendLocationViaLocationManager(boolean enableHighAccuracy, final LocationResultCallback resultCallback) {
        final LocationManager lm = (LocationManager) context.getSystemService(Context.LOCATION_SERVICE);
        if (lm == null) {
            resultCallback.error("location unavailable");
            return;
        }

        // 1. Intentar caché reciente (<30s)
        Location lastKnown = getLastLocation(30000);
        if (lastKnown != null) {
            resultCallback.success(lastKnown);
            return;
        }

        String provider = null;
        if (enableHighAccuracy && lm.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
            provider = LocationManager.GPS_PROVIDER;
        } else if (lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
            provider = LocationManager.NETWORK_PROVIDER;
        } else if (lm.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
            provider = LocationManager.GPS_PROVIDER;
        } else if (lm.isProviderEnabled(LocationManager.PASSIVE_PROVIDER)) {
            provider = LocationManager.PASSIVE_PROVIDER;
        }

        if (provider == null) {
            Location anyCached = getLastLocation(600000);
            if (anyCached != null) {
                resultCallback.success(anyCached);
            } else {
                resultCallback.error("location unavailable");
            }
            return;
        }

        final Handler timeoutHandler = new Handler(Looper.getMainLooper());
        final LocationListener singleListener = new LocationListener() {
            private boolean answered = false;

            @Override
            public void onLocationChanged(Location location) {
                if (!answered) {
                    answered = true;
                    timeoutHandler.removeCallbacksAndMessages(null);
                    try {
                        lm.removeUpdates(this);
                    } catch (Exception ignored) {}
                    if (location != null) {
                        resultCallback.success(location);
                    } else {
                        Location fallback = getLastLocation(600000);
                        if (fallback != null) {
                            resultCallback.success(fallback);
                        } else {
                            resultCallback.error("location unavailable");
                        }
                    }
                }
            }

            @Override
            public void onStatusChanged(String p, int s, Bundle e) {}
            @Override
            public void onProviderEnabled(String p) {}
            @Override
            public void onProviderDisabled(String p) {}
        };

        // Timeout a los 10 segundos si no responde el GPS
        timeoutHandler.postDelayed(() -> {
            try {
                lm.removeUpdates(singleListener);
            } catch (Exception ignored) {}
            Location fallback = getLastLocation(600000);
            if (fallback != null) {
                resultCallback.success(fallback);
            } else {
                resultCallback.error("location unavailable");
            }
        }, 10000);

        try {
            lm.requestLocationUpdates(provider, 0L, 0f, singleListener, Looper.getMainLooper());
        } catch (Exception e) {
            timeoutHandler.removeCallbacksAndMessages(null);
            Location fallback = getLastLocation(600000);
            if (fallback != null) {
                resultCallback.success(fallback);
            } else {
                resultCallback.error(e.getMessage() != null ? e.getMessage() : "location unavailable");
            }
        }
    }

    @SuppressWarnings("MissingPermission")
    public void requestLocationUpdates(
        boolean enableHighAccuracy,
        int timeout,
        int minUpdateInterval,
        final LocationResultCallback resultCallback
    ) {
        if (!this.isLocationServicesEnabled()) {
            resultCallback.error("location disabled");
            return;
        }

        int resultCode = GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(context);
        if (resultCode == ConnectionResult.SUCCESS) {
            clearLocationUpdates();
            fusedLocationClient = LocationServices.getFusedLocationProviderClient(context);

            LocationManager lm = (LocationManager) context.getSystemService(Context.LOCATION_SERVICE);
            boolean networkEnabled = false;

            try {
                networkEnabled = lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER);
            } catch (Exception ex) {}

            int lowPriority = networkEnabled ? Priority.PRIORITY_BALANCED_POWER_ACCURACY : Priority.PRIORITY_LOW_POWER;
            int priority = enableHighAccuracy ? Priority.PRIORITY_HIGH_ACCURACY : lowPriority;

            LocationRequest locationRequest = new LocationRequest.Builder(10000)
                .setMaxUpdateDelayMillis(timeout)
                .setMinUpdateIntervalMillis(minUpdateInterval)
                .setPriority(priority)
                .build();

            locationCallback =
                new LocationCallback() {
                    @Override
                    public void onLocationResult(LocationResult locationResult) {
                        Location lastLocation = locationResult.getLastLocation();
                        if (lastLocation == null) {
                            resultCallback.error("location unavailable");
                        } else {
                            resultCallback.success(lastLocation);
                        }
                    }
                };

            fusedLocationClient.requestLocationUpdates(locationRequest, locationCallback, null);
        } else {
            // Fallback nativo para Huawei / dispositivos sin Google Play Services
            clearLocationUpdates();
            LocationManager lm = (LocationManager) context.getSystemService(Context.LOCATION_SERVICE);
            if (lm == null) {
                resultCallback.error("location unavailable");
                return;
            }

            String provider = (enableHighAccuracy && lm.isProviderEnabled(LocationManager.GPS_PROVIDER))
                ? LocationManager.GPS_PROVIDER
                : (lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER) ? LocationManager.NETWORK_PROVIDER : LocationManager.GPS_PROVIDER);

            nativeLocationListener = new LocationListener() {
                @Override
                public void onLocationChanged(Location location) {
                    if (location != null) {
                        resultCallback.success(location);
                    }
                }
                @Override
                public void onStatusChanged(String p, int s, Bundle e) {}
                @Override
                public void onProviderEnabled(String p) {}
                @Override
                public void onProviderDisabled(String p) {}
            };

            try {
                lm.requestLocationUpdates(provider, (long) minUpdateInterval, 0f, nativeLocationListener, Looper.getMainLooper());
                Location last = getLastLocation(600000);
                if (last != null) {
                    resultCallback.success(last);
                }
            } catch (Exception e) {
                resultCallback.error(e.getMessage() != null ? e.getMessage() : "location unavailable");
            }
        }
    }

    public void clearLocationUpdates() {
        if (locationCallback != null && fusedLocationClient != null) {
            fusedLocationClient.removeLocationUpdates(locationCallback);
            locationCallback = null;
        }
        if (nativeLocationListener != null) {
            try {
                LocationManager lm = (LocationManager) context.getSystemService(Context.LOCATION_SERVICE);
                if (lm != null) {
                    lm.removeUpdates(nativeLocationListener);
                }
            } catch (Exception ignored) {}
            nativeLocationListener = null;
        }
    }

    @SuppressWarnings("MissingPermission")
    public Location getLastLocation(int maximumAge) {
        Location lastLoc = null;
        LocationManager lm = (LocationManager) context.getSystemService(Context.LOCATION_SERVICE);
        if (lm == null) return null;
        List<String> providers = lm.getAllProviders();
        if (providers == null) return null;
        for (String provider : providers) {
            try {
                Location tmpLoc = lm.getLastKnownLocation(provider);
                if (tmpLoc != null) {
                    long locationAge = SystemClock.elapsedRealtimeNanos() - tmpLoc.getElapsedRealtimeNanos();
                    long maximumAgeNanoSec = maximumAge * 1000000L;
                    if (
                        locationAge <= maximumAgeNanoSec &&
                        (lastLoc == null || lastLoc.getElapsedRealtimeNanos() < tmpLoc.getElapsedRealtimeNanos())
                    ) {
                        lastLoc = tmpLoc;
                    }
                }
            } catch (Exception ignored) {}
        }
        return lastLoc;
    }
}
