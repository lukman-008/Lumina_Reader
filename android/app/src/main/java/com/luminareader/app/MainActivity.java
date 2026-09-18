package com.luminareader.app;

import android.view.ActionMode;
import android.view.Menu;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onActionModeStarted(ActionMode mode) {
        if (mode != null) {
            try {
                Menu menu = mode.getMenu();
                if (menu != null) {
                    menu.clear();
                }
                mode.finish();
            } catch (Exception ignored) {
            }
        }
        super.onActionModeStarted(mode);
    }
}
