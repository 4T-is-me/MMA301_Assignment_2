# TechStore — MMA301 Assignment 2

Expo React Native / JavaScript shopping app with DummyJSON, Context state, AsyncStorage, Firebase wishlist, local notifications, and an Express/Gemini recommendation backend. Checkout is a **mock** workflow: `Paid` is a local demo status, not evidence of a real payment.

## Current implementation (M1–M7)

- Catalog: DummyJSON service, FlatList `limit`/`skip` pagination, category filtering, pull-to-refresh, retry and end guards. Text search filters **loaded products**, not the entire remote catalog.
- Product detail: image viewer, description/shipping/review tabs, quantity and cart/wishlist actions.
- Cart: Context actions with stock clamps, derived item count/gross/discounted totals, AsyncStorage restoration and persistence.
- Firebase: anonymous Authentication and user-scoped Firestore wishlist (`users/{uid}/wishlist`). Product details are refreshed from DummyJSON. No live Firebase rules/security claim is made without isolated tests.
- Orders: mock checkout stores order snapshots in **local AsyncStorage**, then clears cart and requests a local notification. History is device-local, not Firestore-backed. Notification failure does not undo a saved order.
- AI: input → Express backend → real catalog context → Gemini JSON → IDs/stock/reasons checked against catalog → product cards. Default model is `gemini-3.5-flash-lite`; environment can override it. API credentials stay on the server.
- Navigation: existing React Navigation stack plus tabs. Theme preference persists locally. The catalog FAB opens AI; checkout opens Orders through MainTabs.

## Setup and development

Use the SDK-matching Node/Expo versions; this repository currently uses Expo 57 and React Native 0.86. Install from each committed lockfile:

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

For Android Emulator, the host URL must be reachable from the emulator. Where local port forwarding is used:

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

Latest follow-up: 26/26 client headless tests and 12/12 server-reported tests Passed; lint and JavaScript compilation Passed. Catalog errors now expose Retry above the list while retaining loaded products; detail and wishlist failures have matching recovery actions. All 39 matrix rows were reviewed; totals remain 27 Passed (18 currently rerun, 9 historical), 11 Blocked and 1 Not Tested. TC02 remains Blocked because LDPlayer ADB became offline during the network-toggle attempt. Check/restore emulator Wi-Fi manually before resuming native tests. Original JSON/TXT/XML evidence reports below were deleted; surviving screenshots and Debug Logs support only the explicitly historical results. See the latest section of Debug Logs for exact scope and blockers.

See [Debug Logs](docs/Debug_Logs.md), [Test Matrix](docs/Test_Matrix.xlsx), [RTM](docs/RTM.xlsx), [Design Decisions](docs/Design_Decision_Record.md), and [Integration Map](docs/Integration_Map.md).

M8 on 2026-10-17: 15 client tests and 12 server-reported tests passed; lint and JavaScript compilation passed; read-only catalog and live Gemini checks passed. Evidence distinguishes mocks, live HTTP and device execution. No device was attached initially; an emulator appeared later and read-only catalog/search/category/detail/reviews/shipping/FAB/AI-result and light/dark UI smoke checks passed (see `docs/evidence/M8/device.json`). Production Firebase mutations were prohibited. Native notification delivery, mutating cart/checkout acceptance, real restart persistence and isolated Firebase security/write tests remain Blocked pending a resettable test profile; manual steps are in Debug Logs. Thus M8 is **Partial**, not a blanket integration pass.

Local notifications use a narrow adapter to avoid loading push-topic APIs unavailable in the tested Expo Go setup. Expo Go skips custom channel creation. Actual display, sound and timing depend on OS permissions/settings. The adapter uses package build subpaths and needs regression checking when upgrading Expo. Orders are local demo data, no real gateway is connected, AI prices/IDs come from DummyJSON, and model availability/quota can change.

M9/release build/install evidence is **Not Tested** and intentionally not produced during M8. No publication, real purchase, email, Firebase production write, credential edit or `.env` modification was performed.
