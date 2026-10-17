# TechStore — MMA301 Assignment 2

Expo React Native / JavaScript shopping app with DummyJSON, Context state, AsyncStorage, Firebase wishlist, local notifications, and an Express/Gemini recommendation backend. Checkout is a **mock** workflow: `Paid` is a local demo status, not evidence of a real payment.

## Features and architecture

`client/` contains the Expo application, `server/` the Express API, and `docs/` the assignment traceability, test matrix and debugging evidence. Screens use Context providers and small service modules; React Navigation provides the existing stack/tabs.

- Catalog: DummyJSON service, FlatList `limit`/`skip` pagination, category filtering, pull-to-refresh, retry and end guards. Text search filters **loaded products**, not the entire remote catalog.
- Product detail: image viewer, description/shipping/review tabs, quantity and cart/wishlist actions.
- Cart: Context actions with stock caps, derived item count/gross/discounted totals, AsyncStorage restoration and persistence. Decreasing quantity from 1 to 0 removes the item.
- Firebase: anonymous Authentication and user-scoped Firestore wishlist (`users/{uid}/wishlist`). Product details are refreshed from DummyJSON. No live Firebase rules/security claim is made without isolated tests.
- Orders: mock checkout stores order snapshots in **local AsyncStorage**, then clears cart and requests a local notification. History is device-local, not Firestore-backed. Notification failure does not undo a saved order.
- AI: input → Express backend → real catalog context → Gemini JSON → IDs/stock/reasons checked against catalog → product cards. Default model is `gemini-3.5-flash-lite`; environment can override it. API credentials stay on the server.
- Navigation: existing React Navigation stack plus tabs. Theme preference persists locally. The catalog FAB opens AI; checkout opens Orders through MainTabs.

## Setup and development

This project uses Expo **57.0.27**, React Native **0.86.3**, React **19.2.3** and Firebase **13.x**. M9 checks used Node **24.12.0** and EAS CLI **25.1.1**. Expo's compatibility check currently recommends the newer Expo patch `~57.0.30`; dependencies were deliberately not upgraded during release preparation. Install from each committed lockfile:

```sh
cd client
npm ci
npx expo start
```

In another terminal:

```sh
cd server
npm ci
npm run dev
```

Provision local environment files yourself; **do not commit or share values**. Backend variable names are documented in `server/.env.example`: `GEMINI_API_KEY`, optional `GEMINI_MODEL`, `GEMINI_TIMEOUT_MS`, and `PORT`. Frontend uses `EXPO_PUBLIC_AI_API_URL`; this is a public base URL, never a secret API key. Existing Firebase configuration was left untouched during M8; a separate test project/emulator is needed for safe write tests.

For Expo Go on an Android emulator, the development host URL must be reachable from the emulator. Where local port forwarding is used:

```sh
adb reverse tcp:3001 tcp:3001
```

A frontend configured for `http://127.0.0.1:3001` requires that mapping; repeat it after emulator/ADB restart. A physical device requires its own reachable host configuration. Restart Metro after changing local public environment configuration.

## Verification

```sh
# client
npm test
npm run lint
node node_modules/typescript/bin/tsc --noEmit --allowJs --checkJs false --jsx react-native --skipLibCheck --target esnext --moduleResolution bundler --module esnext App.js

# server
npm test
# Opt-in: one Gemini request and read-only DummyJSON/Express checks
node scripts/verify-integrations.mjs --live
```

The JavaScript compile check is not strict type checking. The client test harness simulates hooks and mocks native/storage/Firebase APIs; it is not a device renderer. The opt-in live script reads existing configuration without printing secrets and records `docs/evidence/M8/live.json`; do not run it as an offline test.

## M8 evidence and current limitations

M8 evidence includes user-reported LDPlayer manual passes for offline refresh/Retry (TC02), simulated empty-state UI (TC03), repeated cart additions (TC06), Wishlist persistence after fully closing/reopening the app (TC08), and granted-permission checkout notifications (TC12). TC03 is not a real empty API response; TC08 does not establish Cart/Orders persistence or a verified Firestore server round trip. The later quantity-zero removal change has automated evidence and still needs device acceptance (TC07).

See [Debug Logs](docs/Debug_Logs.md), [Test Matrix](docs/Test_Matrix.xlsx), [RTM](docs/RTM.xlsx), [Design Decisions](docs/Design_Decision_Record.md), and [Integration Map](docs/Integration_Map.md).

The current matrix retains **39 cases: 32 Passed, 0 Failed, 7 Blocked, 0 Not Tested** after TC15 moves from Not Tested to Blocked in M9. Other statuses remain M8 evidence, not APK acceptance results. Remaining M8 blockers are TC04 (full pagination), TC07 (current removal/totals), TC09/10 (real Firestore round trip/error), TC11 (permission denial/no crash/status), and TC14 (live negative AI UI). Original JSON/TXT/XML evidence reports were lost; historical results are explicitly scoped to surviving Debug Logs/screenshots. M8 remains **Partial**.

Local notifications use a narrow adapter to avoid loading push-topic APIs unavailable in the tested Expo Go setup. Expo Go skips custom channel creation. Actual display, sound and timing depend on OS permissions/settings. The adapter uses package build subpaths and needs regression checking when upgrading Expo. Orders are local demo data, no real gateway is connected, AI prices/IDs come from DummyJSON, and model availability/quota can change.

## Android APK release candidate (M9)

### Local Gradle path on Windows (current requested route)

The project can generate a native Android project with Expo and run Gradle directly, without an Expo/EAS account. This is different from `eas build --local`. Follow the lecturer's described sequence: create/reuse a release keystore → Gradle signing configuration → `assembleRelease` → install/test the APK. The Slot 10 document itself is not in this repository; these steps follow the sequence supplied by the user and the official [Expo local release guide](https://docs.expo.dev/guides/local-app-production/).

Native files are generated under ignored `client/android/`; configuration remains in Expo config/plugins. Prebuild was executed with `--no-install` and dependency versions/lockfile preserved. **SDK 57 prebuild recreates native folders by default; use `--no-clean` when repeating it.** No pre-existing native project was overwritten. Keep signing material outside generated folders so regeneration cannot remove it. `withLocalReleaseSigning` is enabled only with `TECHSTORE_LOCAL_RELEASE=1`; it overrides the Expo template's release/debug-key fallback and requires four local Gradle properties. EAS signing is unaffected when that flag is absent.

**User-controlled signing setup:** if you already own the app's release key, reuse its path and alias; do not generate a replacement. Otherwise run the following yourself in an interactive PowerShell terminal. Passwords are entered at keytool prompts, not command arguments or chat:

```powershell
$signingDirectory = Join-Path $env:USERPROFILE '.techstore'
$signingKey = Join-Path $signingDirectory 'techstore-release.jks'
if (Test-Path -LiteralPath $signingKey) { throw 'Key exists; reuse it instead of overwriting.' }
New-Item -ItemType Directory -Path $signingDirectory -Force | Out-Null
keytool -genkeypair -v -storetype JKS -keystore $signingKey -alias techstore-release -keyalg RSA -keysize 2048 -validity 10000
```

Securely back up the key and passwords. In your **user-only** `%USERPROFILE%\.gradle\gradle.properties` file, add the following using your own values. This file is outside the repository; do not paste it into chat or commit it. Preserve any existing contents. Java property paths should use forward slashes:

```properties
TECHSTORE_RELEASE_STORE_FILE=C:/Users/YOUR_USER/.techstore/techstore-release.jks
TECHSTORE_RELEASE_STORE_PASSWORD=YOUR_LOCAL_STORE_PASSWORD
TECHSTORE_RELEASE_KEY_ALIAS=techstore-release
TECHSTORE_RELEASE_KEY_PASSWORD=YOUR_LOCAL_KEY_PASSWORD
```

No passwords or keys are written into `android/app/build.gradle`. The generated Gradle configuration reads the properties and validates release signing before release build tasks; it never falls back to the template key. `ORG_GRADLE_PROJECT_` environment variables with these property names are an alternative if you prefer not to store passwords on disk; do not put password literals on a command line.

From `client/`, use the local wrapper. It supplies the public LAN backend profile without editing `.env`, uses `--no-clean --no-install`, preserves the original development scripts and checks the lockfile:

```powershell
node scripts/build-android-release.cjs
```

The wrapper runs the lecturer's Gradle step `gradlew.bat :app:assembleRelease --console=plain --no-daemon --max-workers=2` inside `android/` after prebuild. Use `--prebuild-only` to prepare generated files without attempting an APK. Do not replace versions just to match a previously cached Gradle: use the generated wrapper. Gradle may download Maven dependencies and missing SDK/NDK components; network and accepted SDK licenses are required. Expected successful output path is `client/android/app/build/outputs/apk/release/app-release.apk`; a path alone is not proof an artifact exists. Verify it with Android build-tools `apksigner verify --verbose --print-certs`, inspect application ID/version, then install on a safe LDPlayer/device profile and execute the release checklist below. Until those steps succeed, TC15 remains Blocked. The earlier EAS-only attempt below is historical; it does not imply direct Gradle requires login.

**Status: Partial — the direct Gradle route is now being prepared/checked; release signing is user-controlled. The earlier EAS route remains blocked by authentication. No APK/build URL exists yet; no APK has been installed or run.** ADB detects LDPlayer, but Expo Go/M8 results do not establish standalone release behavior.

| Setting | Release candidate |
|---|---|
| App name / application ID | `TechStore` / `com.techstore.mma301` |
| Version / Android versionCode | `1.0.0` / `1` |
| Build profile | `client/eas.json` → `preview` |
| Artifact / runtime | APK, internal distribution, `developmentClient: false` |
| Signing | No keystore created, replaced or uploaded by the assistant |
| Assets | Existing icon/adaptive/notification PNGs retained; launcher icon is still the existing Expo template artwork |

### Backend access from a physical phone

The backend runs separately; starting the APK does **not** start Express or Gemini. Only the server uses `GEMINI_API_KEY`. Firebase's existing client web configuration remains unchanged; no service-account/private key is included in release configuration. Anonymous Auth persistence and user-scoped Firestore must still be tested on the standalone APK using safe test data.

The preview profile currently sets the public base URL to **`http://192.168.2.10:3001`**, the computer's observed LAN address on 17 October 2026. GET `/api/health` returned HTTP 200 from this computer via both LAN and localhost. This does not prove phone reachability.

1. Keep the computer and phone on the same reachable Wi-Fi/LAN; avoid guest-network isolation. Keep the computer awake and Express running with `npm run dev` in `server/`.
2. Open `http://192.168.2.10:3001/api/health` in the phone browser. If unreachable, check the computer's current IPv4 address, router isolation and inbound TCP 3001 firewall access. Firewall rules were not changed automatically.
3. If the LAN address changes, update **only** `build.preview.env.EXPO_PUBLIC_AI_API_URL` in `client/eas.json` and rebuild. Public Expo variables are embedded during bundling; an existing APK does not pick up later edits. No `.env` edit is needed for this profile.
4. Localhost, `127.0.0.1`, `10.0.2.2` and `10.0.3.2` are not valid physical-phone endpoints. Preview config rejects those addresses, missing URLs, credential/query-bearing URLs and public HTTP endpoints.

The profile disables local dotenv loading and explicitly supplies its public URL. A small Expo config plugin enables Android cleartext traffic for this private-LAN HTTP demonstration; an HTTPS endpoint disables that flag. HTTP LAN builds are for a trusted local demonstration. For off-LAN submission/demos, use a reachable HTTPS backend; hosting requires a separate choice and has **not** been deployed or purchased. Verify the proposed hosting plan and cost before deployment.

### Complete EAS setup and build

Run from `client/`. The assistant stopped after `whoami` returned **Not logged in**, as requested. Perform login and signing locally; do not paste passwords, tokens or keystores into chat.

```powershell
npx eas-cli@latest login
npx eas-cli@latest whoami
npx eas-cli@latest init
npx eas-cli@latest credentials --platform android
```

Link/create the intended Expo project. If the CLI cannot update the dynamic app config, put the project ID it supplies in `app.json` under `expo.extra.eas.projectId`; preserve the existing configuration. In Credentials, select `preview`, reuse the existing Android keystore if one exists, or explicitly choose creation yourself. Back it up securely outside the repository. Do not replace signing material for an existing app. Decline any automatic Git commit prompt; no commit/push is required here. Do not select a paid plan without deciding to do so yourself.

Once the project and signing credentials are configured:

```powershell
npx eas-cli@latest build --platform android --profile preview --non-interactive --freeze-credentials
```

`android.buildType: apk` requests a directly installable APK, not an AAB. Native folders are generated from Expo configuration/plugins. The user now prefers direct Gradle on Windows; EAS cloud remains an alternative with managed build infrastructure. `eas build --local` is not officially supported on Windows, which does **not** prohibit direct Gradle builds. See the official [APK guide](https://docs.expo.dev/build-reference/apk/), [signing/setup guide](https://docs.expo.dev/build/setup/) and [local build limitations](https://docs.expo.dev/build-reference/local-builds/).

### Download, install and verify the artifact

After a successful EAS build, record its build ID, APK URL, source commit/working-tree changes, version, signing certificate fingerprint and SHA-256 in Debug Logs. Download the actual artifact and optionally name the submission copy `TechStore-1.0.0-rc1.apk`. This is a **planned filename**, not an existing artifact.

```powershell
adb devices
adb -s DEVICE_SERIAL install path\to\TechStore-1.0.0-rc1.apk
Get-FileHash path\to\TechStore-1.0.0-rc1.apk -Algorithm SHA256
```

If Android reports an existing installation, verify package/signing compatibility and preserve its data before deciding to update it. Do not uninstall or clear app data to hide a signing or persistence problem. Open **TechStore** from the Android launcher with Metro stopped; this must run as a standalone app, not inside Expo Go.

All following **APK** checks are currently **Blocked: no signed artifact**:

| Release acceptance checks | Required observations |
|---|---|
| Launch / catalog | Cold launch without crash; DummyJSON cards load |
| Search / category / pagination / refresh | Hit/miss, category change, no duplicates/end loop, refresh succeeds |
| Detail | Images, price, reviews and navigation render correctly |
| Cart | Repeated additions, quantity changes, 1→0 removal, trash removal and totals |
| Firebase wishlist | Anonymous session plus confirmed Firestore write/read using a safe test project/profile |
| Checkout / Orders | Local mock order appears in history with matching prices; no real payment gateway |
| Persistence | Fully close/reopen; verify Cart, Orders, Wishlist and theme individually |
| Notifications | Granted and denied permission; no crash; actual tray delivery after mock checkout |
| AI | Phone reaches backend; Gemini products/reasons map to actual catalog data |
| Theme / failures | Light/dark; offline refresh preserves cards and exposes working Retry; API/AI errors recover |

Use an isolated test Firebase environment for writes; current production rules/config were not changed or verified. Existing Expo Go notification success does not prove the standalone custom-channel path. Keep only useful PNG evidence and record exact outcomes in TC15/RTM/Debug Logs. Do not promote Blocked cases based on successful JS export alone.

### Submission and verification record

M9 preflight ran the existing client/server mock suites, lint, JavaScript compilation, release URL regression checks, Expo config/manifest introspection and Android Hermes export. The export is an ignored build intermediate under `client/.expo/m9-export`; it is **not an APK**. SDK compatibility diagnostics and exact final outcomes are recorded in Debug Logs.

`.gitignore` and `.easignore` exclude environment variants, credentials/keystores, caches and build artifacts; `.env.example` templates remain usable in Git. No `.env` was edited, no credential was disclosed, no backend was deployed and no commit/push was performed. Keep the APK out of source history; submit the APK separately through the course upload portal, or provide a verified EAS artifact/shared-file link with a SHA-256 and matching source snapshot. Check that the assessor can download it and reach the configured backend. **The project is not yet ready for a completed-M9 commit or final submission.**
