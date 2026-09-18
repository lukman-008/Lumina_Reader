import React, { useState } from 'react';
import { X, Check, Copy, Download, Monitor, Apple, Terminal } from 'lucide-react';
import { usePlatform } from '../hooks/usePlatform';
import { useEscapeKey } from '../hooks/useEscapeKey';

interface DesktopExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DesktopExportModal: React.FC<DesktopExportModalProps> = ({ isOpen, onClose }) => {
  useEscapeKey(isOpen, onClose);
  const { platform } = usePlatform();
  const [selectedTab, setSelectedTab] = useState<'pwa' | 'tauri' | 'electron' | 'android'>('pwa');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const tauriCommands = `# 1. Install Tauri CLI
npm install -D @tauri-apps/cli

# 2. Build for production
npm run build

# 3. Package native desktop bundle:
# Windows produces: .msi & .exe
# macOS produces: .dmg & .app
# Linux produces: .deb & .AppImage
npx tauri build`;

  const electronCommands = `# 1. Install all dependencies (including electron & electron-builder)
npm install

# 2. Package native desktop installer
# On Windows, this creates an installer (.exe) in dist-electron/
npm run package:desktop

# (Optional) Target specific OS platform:
# Windows:
npx electron-builder --win
# macOS:
npx electron-builder --mac
# Linux:
npx electron-builder --linux`;

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-in fade-in duration-150 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 text-slate-100 flex flex-col max-h-[90dvh] cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap gap-2 items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Cross-Platform Desktop Deployment</h2>
              <p className="text-xs text-slate-400">Windows (.exe), macOS (.dmg), and Linux (.AppImage / .deb)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* OS Support Badges */}
        <div className="flex items-center gap-2 py-3">
          <span className="text-xs font-medium text-slate-400">Supported Environments:</span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-medium">
            <Monitor className="w-3.5 h-3.5" /> Windows 10/11
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-500/10 border border-slate-400/30 text-slate-200 text-xs font-medium">
            <Apple className="w-3.5 h-3.5" /> macOS (Apple Silicon & Intel)
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
            <Terminal className="w-3.5 h-3.5" /> Linux (Ubuntu, Fedora, Arch)
          </span>
        </div>

        {/* Tab selection */}
        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 my-2">
          <button
            onClick={() => setSelectedTab('pwa')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition ${
              selectedTab === 'pwa'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            1. Desktop PWA (Zero Setup)
          </button>
          <button
            onClick={() => setSelectedTab('tauri')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition ${
              selectedTab === 'tauri'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            2. Tauri Native (~15MB Executable)
          </button>
          <button
            onClick={() => setSelectedTab('android')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition ${
              selectedTab === 'android'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            3. Android APK
          </button>
          <button
            onClick={() => setSelectedTab('electron')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition ${
              selectedTab === 'electron'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            4. Electron Binary
          </button>
        </div>

        <div className="overflow-y-auto py-3 space-y-3 flex-1 text-sm text-slate-300">
          {selectedTab === 'pwa' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <h4 className="font-semibold text-slate-200 text-sm mb-1">Instant Native Desktop PWA Installation</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Lumina Reader is configured with standard W3C Web App Manifest and Service Worker caching.
                  It installs directly onto your desktop with a native window frame, pinned taskbar / dock icon,
                  and 100% offline data caching via IndexedDB:
                </p>
                <ul className="mt-2 space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                  <li><strong>Windows:</strong> Click the <span className="text-amber-400">"Install Desktop App"</span> button in the titlebar or the install icon in Chrome / Edge URL bar.</li>
                  <li><strong>macOS:</strong> In Safari, click <em>File → Add to Dock</em>, or in Chrome/Brave click <em>Install Lumina Reader</em>.</li>
                  <li><strong>Linux:</strong> In Chromium/Brave, click <em>Install Lumina</em> to create a standard desktop launcher in <code>~/.local/share/applications</code>.</li>
                </ul>
              </div>
            </div>
          )}

          {selectedTab === 'android' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="flex flex-wrap gap-2 items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-200 text-sm">Packaging Android APK via Capacitor</h4>
                  <button
                    onClick={() => copyCode('npm run android:sync')}
                    className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy Commands'}
                  </button>
                </div>
                <p className="text-xs text-slate-400 mb-2">
                  We have added Capacitor to the project. To generate an APK or AAB, run this command to sync the web build with the Android project:
                </p>
                <pre className="p-3 rounded-lg bg-slate-950 font-mono text-xs text-amber-300 overflow-x-auto border border-slate-800">
                  npm run android:sync
                </pre>
                <p className="text-xs text-slate-400 mt-3">
                  After syncing, open the <code>android/</code> folder in <strong>Android Studio</strong>. From there, you can click <strong>Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</strong>.
                </p>
              </div>
            </div>
          )}
          {selectedTab === 'tauri' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="flex flex-wrap gap-2 items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-200 text-sm">Packaging via Tauri (Recommended)</h4>
                  <button
                    onClick={() => copyCode(tauriCommands)}
                    className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy Commands'}
                  </button>
                </div>
                <p className="text-xs text-slate-400 mb-2">
                  Tauri uses the native OS webview (Edge WebView2 on Windows, WebKit on macOS/Linux) for extreme memory efficiency (&lt;50MB RAM):
                </p>
                <pre className="p-3 rounded-lg bg-slate-950 font-mono text-xs text-amber-300 overflow-x-auto border border-slate-800">
                  {tauriCommands}
                </pre>
              </div>
            </div>
          )}

          {selectedTab === 'electron' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="flex flex-wrap gap-2 items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-200 text-sm">Packaging via Electron Builder</h4>
                  <button
                    onClick={() => copyCode(electronCommands)}
                    className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy Commands'}
                  </button>
                </div>
                <pre className="p-3 rounded-lg bg-slate-950 font-mono text-xs text-amber-300 overflow-x-auto border border-slate-800">
                  {electronCommands}
                </pre>
              </div>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
