# Tab Tidy

Tab Tidy is a Firefox extension for windows with many tabs.

- The toolbar button sorts the tabs of the current window by site. Tabs from the same site, including its subdomains, stay together. Pinned tabs do not move.
- A tab that starts to play sound moves to the top of the tab list, below the pinned tabs.
- Ctrl+Comma switches to the previously focused tab. If you press it again, you go back to the first tab.

Alt+Shift+S also sorts the tabs.

## Installation

Tab Tidy requires Firefox 142 or later. You can install it in three ways.

### Temporary install

Use this method to try the extension. Firefox removes the extension when it restarts.

1. Open `about:debugging#/runtime/this-firefox` in Firefox.
2. Click "Load Temporary Add-on".
3. Select `manifest.json` in this folder.

### Permanent install with a signed file

Firefox release builds install only signed extensions. Mozilla signs the extension for your own use as an unlisted add-on. An unlisted add-on does not appear in the public catalog. You need Node.js for this method.

1. Sign in to https://addons.mozilla.org with a Firefox account.
2. Open https://addons.mozilla.org/developers/addon/api/key/ and generate an API key and secret.
3. In this folder, run the sign command with your key and secret:

   ```
   npx web-ext sign --channel=unlisted --api-key=YOUR_KEY --api-secret=YOUR_SECRET
   ```

4. Wait for the command to finish. It writes a `.xpi` file to `web-ext-artifacts/`.
5. Drag the `.xpi` file onto a Firefox window.
6. Click "Add" when Firefox asks for permission.

If you change the code, increase `version` in `manifest.json` before you sign again. Mozilla does not sign the same version twice.

### Permanent install without signing

Firefox Developer Edition and Firefox Nightly can install unsigned extensions. Firefox release builds cannot.

1. Open `about:config` in Firefox Developer Edition or Nightly.
2. Set `xpinstall.signatures.required` to `false`.
3. In this folder, package the extension:

   ```
   npx web-ext build
   ```

4. Open `about:addons`, click the gear icon, and select "Install Add-on From File".
5. Select the `.zip` file in `web-ext-artifacts/`.

## Change the shortcuts

1. Open `about:addons`.
2. Click the gear icon and select "Manage Extension Shortcuts".
3. Find Tab Tidy and type the new key combination.

The Preferences tab of Tab Tidy in `about:addons` shows the current shortcuts. Its "Change shortcuts" button opens the same shortcut settings.
