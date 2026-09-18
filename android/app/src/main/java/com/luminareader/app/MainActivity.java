package com.luminareader.app;

import android.view.ActionMode;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public ActionMode onWindowStartingActionMode(ActionMode.Callback callback) {
        // Suppress Android system ActionMode popup so app-level selection menu shows cleanly
        return null;
    }

    @Override
    public ActionMode onWindowStartingActionMode(ActionMode.Callback callback, int type) {
        // Suppress Android system floating ActionMode popup on newer Android versions
        return null;
    }

    @Override
    public void onActionModeStarted(ActionMode mode) {
        if (mode != null) {
            try {
                mode.finish();
            } catch (Exception ignored) {
            }
        }
    }
}
