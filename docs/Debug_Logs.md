# Debug Logs

M8 integration hardening — 2026-10-17 (Asia/Saigon).

## M9 signing resumption — 2026-10-17

The user created `C:/Users/ADMIN/.techstore/techstore-release.jks` and configured all four user Gradle signing properties. The key file and all four fields were confirmed present without printing passwords. The assistant did not create or replace the keystore.

### Debug Log 10 — Windows keystore path is escaped by Java properties

- **Reproduction:** Run the local release wrapper with the newly configured signing properties. The first resumed attempt failed `:app:validateTechstoreSigning` after 38 seconds because the Java-resolved path was not a file.
- **Root cause:** Single Windows backslashes in `TECHSTORE_RELEASE_STORE_FILE` are escape characters in Java properties. Reading the file with Java resolved the value as `C:UsersADMIN.techstore...`, although the intended key existed at the user's supplied absolute path. Checking only the raw text/path with Python did not reproduce Java's parsing semantics.
- **Fix:** Normalize only the non-secret store-file property to `C:/Users/ADMIN/.techstore/techstore-release.jks`. Password/alias lines were preserved byte-for-byte; a before/after integrity check confirmed the keystore itself was unchanged.
- **Retest so far:** The next real Gradle attempt passed `validateTechstoreSigning` and began native CMake compilation. This closes the path issue, not final signing or APK acceptance.

### Credential verification boundary

A separate Java check attempted to load the configured keystore and key using the same user properties, without printing their values. It reported `Keystore was tampered with, or password was incorrect`. No password guesses, substitutions or key regeneration were attempted. The user was asked to verify the store password at an interactive `keytool -list` prompt and correct local Gradle properties themselves, without sending credentials to chat. Final signing and APK acceptance remain unverified until that mismatch is resolved and the complete build succeeds. The native build attempt continues independently to expose compilation issues; its eventual result must be recorded before claiming an artifact.

**Subsequent user correction:** The user confirmed verifying/correcting the passwords locally. Repeating the Java check successfully loaded the store and recovered the configured private key. The public certificate SHA-256 is `3ea9ad0333fcff9a20cb6be93904a074a2681f719a3eee8a4080d8ec15fb4c96`; it must match the signed APK before installation. No password/private key was printed or exported. The already-running Gradle process had loaded its configuration before that correction; a fresh invocation may be needed for final signing. Credential setup is no longer treated as unconfirmed.

## M9 continuation — direct Windows Gradle release (2026-10-17)

Historical initial local attempt: the missing-properties state below was superseded by the user's signing setup and the signing-resumption section above. EAS login is still not needed for direct Gradle.

**Current route:** Expo prebuild → local Gradle signing → `assembleRelease` → APK verification/install. This is the lecturer's sequence as described by the user; Slot 10 itself was not supplied as a file. It does not require EAS login and supersedes the earlier EAS-only blocker as the selected build path. **Status: Partial; first observed build blocker is missing user-controlled release signing. No installable release APK exists yet.** Later native compilation/linking/runtime outcomes cannot be inferred from successful configuration.

### Toolchain and prebuild evidence

- Java/keytool: Eclipse Adoptium **JDK 21.0.6** on Windows 11.
- Android SDK found at the user's local Android SDK directory. Platforms 35/36/36.1 and build-tools including **36.0.0** are installed. `ANDROID_HOME` was initially absent; commands/wrapper provide the detected SDK path to child processes without editing `.env` or system settings.
- No `android/` existed before this continuation. Expo prebuild generated the ignored project; npm installation was disabled. Original development scripts were restored/preserved; package dependency versions and lockfile remain unchanged. The build uses generated files; modifications are defined by Expo config plugins, not manual edits to generated Gradle files.
- SDK 57 prebuild **recreates native folders by default**, even without an explicit clean flag. One repeat recreated only the newly generated native directory from this session, which held no user release key/data. Future runs use `--no-clean`; `node scripts/build-android-release.cjs --prebuild-only` subsequently succeeded with “reusing /android”. The wrapper preserves original Expo Go scripts and checks the lockfile. Keep release keys outside generated folders.
- Generated wrapper downloaded/ran **Gradle 9.3.1** successfully with Java 21; no global Gradle installation or EAS login was required. Native configuration printed build-tools/compile/target SDK **36**, min SDK **24**, Kotlin **2.1.20** and NDK **27.1.12297006**.
- NDK was initially missing. Gradle installed **27.1.12297006**, using the already accepted Android SDK license. It compiled the React Native/Expo Gradle plugins, configured/autolinked Expo native modules including notifications, and generated codegen/autolinking tasks.
- Prebuild warning about optional `expo-system-ui`, SDK XML schema warning and future Gradle-10 deprecations were observed; they did not cause this attempt to stop. No dependency/SDK upgrade or warning suppression was applied. The earlier Expo Doctor patch mismatch remains recorded, not magically resolved.

### Debug Log 09 — Generated template would sign release with the debug key

- **Observed cause:** Generated `android/app/build.gradle` assigned `signingConfigs.debug` to the release build type. The template includes a known `debug.keystore`; producing that APK would not satisfy the requested personal release-key workflow.
- **Correction:** `withLocalReleaseSigning` appends a reproducible Gradle release signing configuration only when `TECHSTORE_LOCAL_RELEASE=1`. It reads `TECHSTORE_RELEASE_STORE_FILE`, `TECHSTORE_RELEASE_STORE_PASSWORD`, `TECHSTORE_RELEASE_KEY_ALIAS`, `TECHSTORE_RELEASE_KEY_PASSWORD` from user Gradle properties/environment, sets release signing to the dedicated config (or null when absent), and validates before release pre-build. It rejects the known template filename/alias and never silently falls back to the debug signer. EAS mode without the local flag keeps its own signing workflow.
- **Actual attempt:** `gradlew.bat :app:assembleRelease --console=plain --no-daemon --max-workers=2` exited **1**, **BUILD FAILED in 5m**, **39 actionable tasks executed**. The failing task was `:app:validateTechstoreSigning`, message: `TechStore release signing is missing. Configure the four TECHSTORE_RELEASE_* user Gradle properties; never put passwords in the repository.` This verifies the missing-key guard on real Gradle, not successful APK compilation.
- **User handoff:** The user chose “create a new key following README; I will configure it”. That choice is not confirmation setup is finished. No key/password was generated by the assistant. User creates/reuses the key outside the repository and configures the four fields in their user-only Gradle properties file; only readiness needs to be reported, never passwords/key contents. Do not rerun as if credentials exist until confirmed or detected.

### Current checks and acceptance boundary

- Client **30/30** headless/configuration tests Passed (exit 0), including local release endpoint validation without EAS and separation of local/cloud signing plugins.
- Lint and JavaScript compilation Passed (exit 0); compilation is not strict typing or native build verification.
- Safe native prebuild wrapper `--prebuild-only` Passed (exit 0); generation reused the existing directory and original development scripts were preserved.
- Generated main Android manifest contains the configured LAN cleartext flag; the notifications library declares `POST_NOTIFICATIONS`. This is static configuration evidence, not permission/delivery acceptance.
- A read-only `wget` probe **from LDPlayer** to `http://192.168.2.10:3001/api/health` exited **0** and returned the expected API-running health marker. This proves that guest command can reach the LAN backend; it does **not** test APK network policy, the app's AI request, Gemini output or Firebase.
- No signed APK was produced/verified/installed/launched. All 12 release acceptance flows, including Gemini, Firebase, notifications, full persistence and offline Retry, remain Blocked at APK level. Earlier Expo Go/user manual and mock results remain separate.

**TC15 remains Blocked; matrix totals remain 32 Passed, 0 Failed, 7 Blocked, 0 Not Tested.** The native command's failed signing prerequisite is recorded explicitly; it is not a fabricated runtime failure or Passed release test. No Firebase/order data or device network settings were changed during this continuation.

### Direct Gradle versus EAS

Direct Gradle is now the selected path: no Expo account, local JDK/SDK/NDK and user-managed signing required; this computer reached the signing guard successfully. EAS cloud remains an alternative requiring login/project/signing setup but supplies hosted native build infrastructure. The unsupported Windows limitation applies to **`eas build --local`**, not to generated `gradlew.bat`. No switch back to EAS, credential creation, commit or push was performed. Once signing is ready, rerun `node scripts/build-android-release.cjs`; only after successful signing and `apksigner`/package inspection should the APK be installed and TC15 acceptance run. The expected APK path is documented in README; it is not claimed as an existing artifact.

## M9 release candidate preflight — 2026-10-17 (Asia/Saigon)

This earlier EAS-only preflight is retained for history. The newer direct-Gradle continuation above supersedes its selected build route and initial missing-NDK state; it does not supersede the unresolved release acceptance tests.

**Status: Partial; signed APK build and all APK acceptance tests Blocked.** The starting Git tree was clean at `b2f4f89` (`milestone 8 complete integration testing and bug fixes`). Earlier M8 manual/mock evidence is preserved below; a commit title does not supersede the documented M8 acceptance limits. No reset, stash, commit or push was performed.

### Release blockers found and configuration changes

1. **Physical-device AI endpoint:** Existing `client/.env` points to public base URL `http://127.0.0.1:3001`; on a phone this addresses the phone itself. Do not modify that environment file. The new `preview` EAS profile supplies `http://192.168.2.10:3001` (the observed computer LAN IPv4) and disables local dotenv loading. The release config rejects missing URLs, loopback/emulator aliases, credentials/query/path-bearing base URLs and public HTTP. A config plugin sets native Android cleartext permission for private-LAN HTTP, or disables it for HTTPS. This is a trusted-LAN demonstration configuration, not an online deployment. The existing AI connection error now describes device/backend reachability rather than emulator-only forwarding.
2. **Missing release identity/profile:** `app.json` had name `client`, no Android application ID/versionCode, and there was no `eas.json`. Set the visible name to `TechStore`, package to `com.techstore.mma301`, versionCode to `1`; retain version `1.0.0`, slug, all existing assets and architecture. The `preview` profile requests an installable APK, internal distribution and `developmentClient: false`. The existing launcher image is Expo template artwork; no new icon was invented. PNG headers/dimensions and icon artwork were inspected. No generated native directories are maintained manually.
3. **EAS authentication/signing blocker:** EAS CLI **25.1.1** `whoami` exited 1 with **Not logged in**. Per the user's instruction, stop before submitting a cloud build or creating signing credentials. No remote Expo project was created/linked and no keystore was generated, uploaded, replaced or removed. Remote signing state cannot be inspected without login. There is no APK file, build ID or artifact URL to report. This is a preflight blocker, not a failed native compilation. Java 21 and Android SDK platforms 35/36/36.1 are installed, but EAS local builds on Windows are not officially supported; switching to an unsigned/debug APK would not satisfy the requested signed release candidate or the user's signing constraint.
4. **SDK compatibility diagnostic:** `expo install --check` and Expo Doctor identify only the Expo patch mismatch: installed **57.0.27**, expected **~57.0.30**. Doctor reports **20/21 checks Passed, 1 Failed**, exit 1. Do not suppress the check or claim a full dependency pass. No SDK/dependency/lockfile upgrade was performed; whether the patch mismatch causes a native build failure is unverified. Review the minimal patch update before the actual build.

Repository/upload exclusions were expanded for environment variants, credentials/keystores, build artifacts and caches. `.easignore` retains the client Git exclusions and excludes backend/docs/test data from build inputs; `.env` files are not build inputs. Git ignore rules were checked with representative paths; no tracked `.env`, signing or credentials files were found. No EAS archive was uploaded; its final contents still need inspection before cloud submission. Existing M1–M8 documents/evidence were not deleted.

### Checks actually executed in M9

| Check | Actual result | Scope / limitation |
|---|---|---|
| Client `npm test` | **29/29 Passed**, exit 0 | Previous 27 headless/mock tests plus 2 release-URL configuration tests; no native renderer or production Firebase/order mutation. |
| Server `npm test` | **12/12 reported Passed**, exit 0 | 11 child checks plus parent, mocked external HTTP. No new Gemini request. |
| Client ESLint `--no-cache` | **Passed**, exit 0 | Includes app config, plugin and tests. |
| README JavaScript compile check | **Passed**, exit 0 | `--allowJs --checkJs false`; not strict typing or native compilation. |
| Expo preview config/manifest introspection | **Passed**, exit 0 | Name/package/version/versionCode resolve as configured; `android:usesCleartextTraffic=true` for this LAN profile. Native library manifest merging/runtime delivery not proven. |
| Android production Hermes export | **Passed**, exit 0 | 1,037 modules; ignored `client/.expo/m9-export`; a JS/asset intermediate, **not an APK**. |
| Export checks | **Passed** | Configured LAN base URL present; server Gemini key absent from the inspected HBC bundle (boolean-only check; secret never printed). This does not constitute a completed APK/archive audit. |
| Backend GET health | **HTTP 200** via `127.0.0.1:3001` and `192.168.2.10:3001` | Tested from this computer only, not from a physical phone; no Gemini or data mutation. |
| SDK compatibility / Expo Doctor | **Failed diagnostic**: 20/21 checks Passed | Only identified mismatch is Expo patch 57.0.27 vs ~57.0.30; dependencies unchanged. |
| ADB availability | LDPlayer `emulator-5554 device` | Device is available, but no signed TechStore APK exists to install. No APK/device result is inferred from Expo Go. |
| Signed build, install, cold start | **Blocked** | EAS login/project/signing require the user; cloud build not submitted. |

The Firebase module still initializes anonymous Auth with React Native AsyncStorage persistence and user-scoped Firestore wishlist. Its existing web client configuration is unchanged; no service-account/private-key markers were found. Public Firebase client configuration is bundled by design, not proof of release Auth/rules correctness. **Actual release Anonymous Auth, Firestore write/read/security behavior and notification custom-channel behavior remain Blocked.** Earlier Expo Go/manual notification and Wishlist persistence results are not APK evidence.

### APK acceptance disposition

All 12 requested release flows are **Blocked because no signed artifact is available**: (1) startup/no crash, (2) DummyJSON catalog, (3) search/category/pagination/refresh, (4) detail/images/price/reviews, (5) cart/add/update/remove, (6) Firebase Auth/Wishlist, (7) local mock checkout/history, (8) persistence after full close/reopen, (9) native notification after checkout, (10) live backend/Gemini UI, (11) light/dark theme, (12) offline/API failures/Retry. None was run on an APK. TC15 changes from **Not Tested** (M9 previously excluded) to **Blocked** (M9 now started but missing authentication/signing/artifact). All other matrix statuses retain their existing M8 evidence.

**Current 39-case matrix: 32 Passed, 0 Failed, 7 Blocked, 0 Not Tested.** The separate Expo Doctor diagnostic failure is not a fabricated failure of an existing application test case; it is recorded above and must be resolved/reviewed before release. No native test was promoted. M8 blockers TC04/07/09/10/11/14 remain; TC15 is the additional M9 blocker.

### Required user actions / handoff

Follow README's `client/` commands: EAS login → link/create the intended project → configure/reuse Android signing explicitly → review Expo patch compatibility → verify the LAN health URL on the phone → build `preview` with `--freeze-credentials`. If a dynamic-config project-ID change is requested, add only the supplied ID under `app.json` `expo.extra.eas.projectId`; do not replace app configuration. Preserve existing signing keys; do not accept an automatic commit or a paid-plan change. No paid backend deployment was attempted or approved.

After build success, record the actual APK/build URL, build ID, version, source snapshot, signing certificate fingerprint and SHA-256; install TechStore separately from Expo Go and verify cold start without Metro. Use safe test Firebase/profile data for writes. Capture only necessary PNGs and actual results. No artifact URL/filename/hash is invented. `.env` integrity is checked against the preflight baseline without publishing its values. Until the APK and acceptance evidence exist, **M9 is not complete and the project is not ready for final submission or a completed-M9 commit**.

## Cart quantity behavior update (2026-10-17)

At the user's request, decreasing a cart item's quantity from 1 to 0 now removes that item. CartItem's minus action remains enabled at quantity 1, and CartContext removes the matching item for nonpositive integer updates. Other items and stock caps are retained; derived counts/totals and the normal AsyncStorage save follow the updated cart.

Verification: client **27/27 automated/headless tests Passed**. Updated the previous minimum-one assertion and added a CartItem minus-button regression using the real context with mocked storage: last item removed, counts/gross/discounted totals all zero, stored cart `[]`. Lint and JavaScript compilation Passed. No native device test or live-data mutation was performed for this change. TC07 remains **Blocked** pending manual removal/count/totals acceptance on the updated behavior; the user's earlier minimum-one observation describes the previous version. Matrix totals remain 32 Passed, 0 Failed, 6 Blocked, 1 Not Tested.

## Latest update — user-reported LDPlayer manual tests (2026-10-17)

**Evidence source:** the user's manual test report in this conversation, dated 17/10/2026, including explicit follow-up confirmation that the application was fully closed and reopened for TC08. These are **manual results reported by the tester**, not new automated/mock tests or device actions executed by the assistant. No new screenshots, Firestore console records or permission-state captures were supplied. No source code, environment files or live data were changed and no tests were run for this documentation update.

| Case | Status | Manual actual result and limits |
|---|---|---|
| TC02 | **Passed** | Wi-Fi off → Refresh → error and visible Retry → Wi-Fi on → Retry → products reload successfully. This closes the previously blocked refresh/reconnect/Retry sequence. It does not separately verify initial offline launch or retention of old cards. |
| TC03 | **Passed — simulated empty-state UI only** | Tester temporarily used `setProducts([])` and observed “No products found” on LDPlayer. This verifies the rendered UI with simulated empty data; it is **not** evidence of a real API returning an empty array. The assistant did not apply or revert that temporary source change. |
| TC06 | **Passed — repeated-add quantity scope** | Adding the same product to Cart twice correctly accumulated its quantity. Derived monetary totals were not separately confirmed by this manual report; prior mock totals coverage remains distinct. |
| TC07 | **Blocked (partial manual verification)** | Minimum quantity of 1 confirmed on LDPlayer. Remove and item count/monetary total updates after deletion remain unverified; do not mark the full case Passed. |
| TC08 | **Passed — Wishlist persistence only** | Tester explicitly confirmed fully closing the app, reopening it and seeing the added Wishlist product retained. This is **not** Cart/Orders persistence evidence and does not prove a Firestore server write/read rather than cached data. |
| TC09 | **Blocked** | Actual Firestore write and subsequent read have not been verified. Wishlist visibility or persistence alone does not establish the server round trip. |
| TC10 | **Blocked** | No manual Firebase failure case tested. Previous mock failure tests remain separate. |
| TC11 | **Blocked** | No complete permission-denial result confirming permission state, no crash and clear app feedback was supplied. Absence of a notification alone would not establish a pass. |
| TC12 | **Passed** | Tester granted notification permission, completed checkout successfully and observed the notification on LDPlayer. Exact delay, background delivery, sound and notification-tap navigation were not verified by this report. |

**Current matrix totals: 32 Passed, 0 Failed, 6 Blocked, 1 Not Tested (39).** Five cases were promoted from Blocked on this new manual evidence: TC02, TC03, TC06, TC08 and TC12, with the scope restrictions above. The other Passed rows retain their existing automated/static or explicitly historical provenance. No automated tests were rerun during this update.

**Remaining manual acceptance:** TC04 (all pages/end/no duplicates), TC07 (Remove and derived item count/totals), TC09 (actual Firestore write/read on a safe test environment), TC10 (Firebase network/permission error), TC11 (denied permission, app does not crash, permission state/feedback), TC14 (live AI invalid/error/timeout UI). TC15 remains **Not Tested**, outside M8/M9 release scope. Also still unverified outside the narrow new passes: real empty API response, initial offline catalog launch/old-card retention, Cart/Orders persistence across full restart, manually observed cart monetary totals, and exact/background notification behavior.

**M8 remains Partial.** The earlier assistant ADB failure below is historical and does not negate these later user-confirmed device steps. It must not be cited as a current reason that TC02, TC03, TC06, TC08 or TC12 were never tested on-device. No commit or push was performed.

## M8 follow-up review — Retry and failure recovery (2026-10-17)

This section records the earlier assistant review of all **39** matrix cases. The later user manual results above supersede its device blockers for the confirmed steps. The original JSON/TXT/XML reports referenced later in this document were deleted before workbook recovery. Those references describe historical evidence, not files recreated or tests newly executed. Surviving PNGs and this document support the explicitly labelled historical results.

### Debug Log 05 — Refresh/pagination Retry is outside the visible viewport

- **Symptom/reproduction:** User reports that disabling LDPlayer Wi-Fi and refreshing shows “Check your connection and tap Retry” without a visible Retry. Load products, reject the refresh (or next-page request), then inspect the normal screen above the scrolling list.
- **Root cause:** With existing products, the only error/Retry control lived in `FlatList.ListFooterComponent`, below the product rows. It could require scrolling to the bottom; the toast did not explain this. Initial-load failure already had a Retry and is not recorded as a newly discovered missing-button bug.
- **Fix:** Display the error and the existing Retry action immediately below catalog controls, outside FlatList. Keep existing products and pagination metadata after failed refresh/load-more. Retry refresh requests page zero; pagination Retry resumes the failed offset. Request-controller guards prevent duplicate taps and automatic pagination while an error is pending. The old footer error control is removed to avoid duplicate actions.
- **Before evidence:** Corrected regression suite before the source patch: **1 Passed, 3 Failed** across its first four tests. Refresh and pagination checks failed because Retry was absent from rendered children outside the footer; initial-load/empty recovery already passed. The third failure was the payload-validation defect in Log 08. No raw log file was generated.
- **Retest:** `client/test/hardening.test.cjs` tests `catalog offline refresh`, `catalog first load offline`, and `catalog pagination failure` Passed. Assertions cover retained rows, visible control location in the headless tree, busy state, page-zero recovery, failed-offset recovery, duplicate taps, error removal, empty success and pagination end guards.
- **Device retest update:** TC02 is now **Passed** from the user's 17/10/2026 manual Wi-Fi off → Refresh → visible Retry → Wi-Fi on → Retry → successful reload report. Earlier mock tests alone did not establish native recovery; see the latest manual section for exact scope.

### Debug Log 06 — Detail and wishlist instructions advertise a nonexistent Retry

- **Symptom/root cause:** ProductDetail's failed initial fetch showed a Retry instruction in a toast but rendered only “Product not found” and “Go to Home”. Wishlist action failures in both ProductCard and ProductDetail also said “tap Retry”, although their real action is the heart. Confirmed by inspecting the pre-change render/catch paths; no pre-fix device reproduction is claimed.
- **Fix:** Detail fetch failures now retain an inline connection error and a real Retry which reruns the cancellable detail request. Clear stale detail/error when starting another request. Wishlist action errors instruct users to tap the existing heart again. Add an accessible label to the detail heart.
- **Retest:** `detail offline: Retry loads the product; failed wishlist action points to the heart` Passed with mocked service rejection/recovery and an assertion on the actual toast instruction. Existing deferred detail-race test also Passed. ProductCard's corresponding message was source-reviewed; no live wishlist write was performed.

### Debug Log 07 — Wishlist read failure has no in-screen recovery

- **Symptom/root cause:** Failed Firestore reads or the subsequent DummyJSON product reads left WishlistScreen displaying only “Failed to load wishlist”. Effects depended on unchanged identity/list values, so reconnecting did not itself rerun the read. The loading/error view also referenced a missing `centerContainer` style.
- **Fix:** Add a read-only reload trigger to WishlistContext and a Retry control on the error view. Context errors retry the wishlist read; product-fetch errors retry product reads. Define the existing centered status style. Architecture and write operations are unchanged.
- **Retest:** `wishlist context: failed read can be retried without a Firestore mutation` and `wishlist screen: product-fetch Retry recovers; context errors retry the context` Passed. These use mocked reads and never call production Firebase. Actual rules/network/write acceptance remains TC09/TC10 **Blocked**.

### Debug Log 08 — Catalog accepts records that its renderer cannot handle

- **Symptom/reproduction:** Supply `{ products: [null], total: 1, skip: 0, limit: 20 }` or a record with a null title/category. The service previously accepted the array; grouping/search dereferences `product.category`/`product.title`, allowing a render failure. This is a confirmed malformed-response boundary defect using mocks, not evidence that live DummyJSON returned corrupt data.
- **Root cause:** Validation covered array/pagination metadata but not required product fields.
- **Fix:** Reject null/malformed records and invalid IDs/prices/stocks before returning a page. Catalog catches the rejection using its ordinary error/Retry flow; an existing page remains intact.
- **Retest:** `product service rejects malformed catalog records before grouping/rendering` failed before the patch (missing expected rejection), then Passed for null/title/category/negative-price inputs. Existing successful service/catalog fixtures remain Passed.

### Current executed checks and evidence scope

| Check | Actual result | Scope |
|---|---|---|
| `npm test` in client | **26/26 Passed**, exit 0 | Real JS modules; custom hook simulator with native/storage/Firebase/HTTP mocks. Eleven new regression tests in `hardening.test.cjs`. |
| `npm test` in server | **12/12 reported Passed**, exit 0 | 11 child checks plus parent; controller/catalog/Google SDK with mocked HTTP. Includes 404, 429, malformed output, 504 and deadline. |
| `node node_modules/eslint/bin/eslint.js . --no-cache` in client | **Passed**, exit 0; zero errors/warnings | Includes new tests. Initial whole-directory lint exposed Node's `__dirname` missing from lint globals in the existing harness; declare that CommonJS global locally. No application rule disabled. |
| README JavaScript compile command (`tsc --noEmit --allowJs --checkJs false ... App.js`) | **Passed**, exit 0 | Compilation only; not strict type checking. |
| `git diff --check` | **Passed**, exit 0 | Existing LF/CRLF notices are Git conversion notices. |
| New live HTTP/Gemini checks | **Not executed in this follow-up** | M8-17/18/19 and TC13 retain explicitly historical evidence; no new availability/latency claim. |
| Earlier assistant LDPlayer attempt | **Blocked at that time** | ADB interrupted that attempt. Later user manual results are recorded separately above; TC02/03/06/08/12 now have manual passes with explicit scope. |

Additional new assertions cover AI blank/duplicate submit, loading lock, error/re-submit and empty recommendations; cart read/write failure retaining usable in-memory state; invalid restored orders and invalid checkout inputs without storage writes; theme storage failures; notification channel/scheduling failure rejection and subsequent retry. Existing cart, quantity, totals, persistence/remount, authentication, wishlist writes, concurrent-order saves, checkout failure/denial and notification-delay checks all Passed at their **mock/headless** layer. Cart/theme storage failure currently logs to console and preserves in-memory use; it does not promise saved state after restart.

### Device attempt and environment restoration limit

ADB was located at the installed Android SDK path and initially reported `emulator-5554 device`, model `ASUS_AI2401_A`, Android 9, 900×1600. Expo Go was displaying the existing smartphone catalog; `evidence/M8/review-current.png` is the **pre-change/pre-offline baseline**, not an after-fix screenshot. Existing category/theme/cart/wishlist/order values were not deliberately changed.

An earlier assistant attempt to disable Wi-Fi with `adb shell svc wifi disable` stalled; subsequent shell/screenshot requests timed out and the transport became `offline`. Reconnect, localhost connection and restarting only the ADB server did not restore shell access. `ldconsole action --index 0 --key call.network --value connect` returned exit 0, but ADB remained offline; `svc wifi enable` could not execute. Guest Wi-Fi restoration could not be verified **during that assistant attempt**. The later user TC02 report confirms Wi-Fi was enabled and Retry reloaded products successfully. No emulator reset, app-data clear, reinstall, real order or Firebase write was performed by the assistant to work around the limitation. No screenshot of a successful after-fix device Retry was supplied; the latest evidence is the user's written manual report.

TC02's Wi-Fi off → Refresh → error and visible Retry → Wi-Fi on → Retry → successful reload sequence is now user-confirmed. Initial offline launch with no loaded products and explicit old-card retention remain additional unverified manual checks; do not infer those observations from the reported TC02 pass.

### Review disposition for all 39 matrix cases

| Cases | Current disposition |
|---|---|
| TC01, TC05, TC13 | Passed **historically**; surviving documentation/screenshots. Not rerun to acceptance in this follow-up. |
| TC02 | Passed — user manual Wi-Fi off/Refresh/error/visible Retry/Wi-Fi on/Retry/reload succeeded. |
| TC03 | Passed — user manual simulated empty-state UI via `setProducts([])`; real empty API response not verified. |
| TC04 | Blocked — mocked pagination/end/failed-offset Retry Passed; full native scrolling/end/no-duplicates acceptance not exercised. |
| TC06 | Passed — user manual repeated add correctly accumulates quantity; manual monetary totals not separately confirmed. |
| TC07 | Blocked (partial) — manual minimum quantity 1 confirmed; Remove and totals/count after deletion unverified. |
| TC08 | Passed — user confirmed full close/reopen and retained Wishlist; no Cart/Orders persistence or server round-trip claim. |
| TC09, TC10 | Blocked — mock Auth/Firestore read/write/errors/retry Passed; isolated Firebase project/emulator and security rules tests unavailable. |
| TC11 | Blocked — manual denied permission state/no-crash/feedback not fully verified. |
| TC12 | Passed — user granted permission, completed checkout and observed notification on LDPlayer; exact/background timing unverified. |
| TC14 | Blocked — AI headless/mock negative/timeout/re-submit Passed; full live error/timeout UI acceptance not exercised. |
| TC15 | Not Tested — M9 release/install outside scope. |
| M8-01…M8-16 | Passed — automated scope rerun; new assertions associated with the relevant existing IDs, no extra matrix IDs. |
| M8-17…M8-19 | Passed **historically** — original live raw reports lost; documented results retained, not newly verified. |
| M8-20, M8-21 | Passed — lint and JS compilation rerun as above. |
| M8-22…M8-24 | Passed **historically** — limited read-only device smoke/screenshots; not a current acceptance retest. |

**Updated matrix totals: 32 Passed, 0 Failed, 6 Blocked, 1 Not Tested (39).** The earlier assistant-only subtotal was 27 Passed (18 automated/static and 9 historical), 11 Blocked and 1 Not Tested. Five later user manual passes are documented above. Automated test counts are distinct from matrix case counts; unverified scopes remain pending acceptance.

**M8 remains Partial; not ready to declare M8 complete or commit it as fully verified.** The fixes can be reviewed with their automated evidence; finish the Blocked acceptance checks on a resettable device/test Firebase environment first. No commit/push/M9, environment-file edit or credential disclosure was performed. Evidence added for this follow-up is restricted to the necessary PNG and the existing primary documents; no new XML/TXT/JSON report batch was generated.

Evidence boundaries: client tests execute the real JavaScript modules using a small hook lifecycle simulator and mocked native/storage/Firebase boundaries. They are **not** React Native renderer, emulator, real AsyncStorage, or production Firebase evidence. Backend tests execute controller → catalog fetch → Google SDK → output validation with mocked HTTP. Read-only external HTTP evidence is recorded separately in `evidence/M8/live.json`.

## Debug Log 01 — Wishlist failures mask the Firebase error

- **Symptom:** Reject a wishlist add/remove request; the caller receives `ReferenceError: err is not defined` rather than the original permission/network error.
- **Reproduction:** Run the `wishlist: failed add/remove preserves original error and exposes error state` test with the wishlist service rejecting `permission-denied: mock Firestore`.
- **Root cause:** Both `catch (error)` blocks referenced an undeclared `err` when setting error state and rethrowing.
- **Fix:** Use the caught `error` consistently. Clear old user-scoped wishlist/error state on identity changes. Do not change Firebase configuration or rules.
- **Before evidence:** `evidence/M8/client-before.txt` contains the failing assertion and `ReferenceError` stack.
- **Retest:** Passed in `evidence/M8/client-tests.txt`: the exact original error reaches the caller and the context records its message for both add and remove.
- **Regression:** Mocked Firestore save/read/remove remains user scoped; omitted optional fields no longer send `undefined` values. Live Firestore writes/rules remain Blocked.

## Debug Log 02 — Corrupt cart records crash startup

- **Symptom:** Startup fails with `Cannot read properties of null (reading 'quantity')` when the stored cart is an array containing a null record.
- **Reproduction:** Arrange mock `@techstore_cart` as `[null, validItemWithQuantity2, itemWithInvalidQuantity]`, hydrate CartProvider, then read totals.
- **Root cause:** Hydration checked only `Array.isArray`; reducers and CartItem assumed every entry was valid.
- **Fix:** Validate restored product IDs, title, price, discount, stock and quantity; drop invalid entries, normalize quantities, clamp to stock, and merge duplicate IDs. Apply the same product guard to new additions.
- **Before evidence:** `evidence/M8/client-before.txt` contains the startup TypeError.
- **Retest:** Passed: valid item remains, item count is 2 and discounted total is 180 for a $100 product with 10% discount.
- **Regression:** Different products remain independent; string input is numeric; stock caps, quantity minimum, remove/clear and mock save/remount pass. A real device restart is still Blocked.

## Debug Log 03 — Overlapping order saves lose an order

- **Symptom:** Two calls using the same rendered `placeOrder` callback save only one of two orders.
- **Reproduction:** Capture the callback; call it twice concurrently with two carts; inspect context and mock AsyncStorage.
- **Root cause:** Both callbacks captured the same old `orders` array and wrote `[newOrder, ...orders]`, overwriting the other result.
- **Fix:** Serialize saves with a ref-backed queue and build the next array from the latest committed ref. Update state only after persistence succeeds. Validate restored order records before rendering.
- **Before evidence:** `evidence/M8/order-before.txt` records `1 !== 2`.
- **Retest:** Passed: context and stored array both contain two orders. A rejected storage write leaves both existing orders intact and rejects the operation.
- **Regression:** Mock checkout clears the cart only after save, survives notification denial, and does not clear/send when saving fails. No real purchases or production writes were performed.

## Debug Log 04 — Order line prices disagree with the order total

- **Symptom:** A $100 item with a 10% discount shows a $100 unit price in history even though checkout and stored total use $90.
- **Reproduction:** Render OrderCard with that saved item and a total of 90; inspect the `CartCheckout.finalPrice` prop.
- **Root cause:** OrderCard passed `product.price` directly to a component expecting the discounted unit price.
- **Fix:** Apply the stored discount before passing the unit price.
- **Before evidence:** `evidence/M8/order-card-before.txt` records `100 !== 90`.
- **Retest:** Passed: OrderCard now passes 90, matching checkout and the saved total.

## Additional integration corrections

- **Notification delay regression:** The current checkout service used `trigger: null` in Expo Go despite the earlier one-second requirement. The first M8 notification test failed reading `trigger.seconds`. Restored a one-shot one-second trigger while still omitting a custom Android channel in Expo Go. Mock scheduling/denial/duplicate tests pass; actual OS timing and delivery are not claimed.
- **Checkout navigation:** Orders is a child of MainTabs, not a root stack route. The success alert now navigates to `MainTabs` with `screen: Orders`; the headless callback test asserts that route. Checkout-to-Orders rendered navigation remains Blocked; catalog FAB/detail navigation was smoke-tested later.
- **Detail request race:** Aborted requests no longer replace a newer product or change its loading/error state. A deferred-response test resolves the new request before the old request and confirms only the new product is rendered.
- **Auth failure state:** A signed-out callback clears an old user before anonymous sign-in. Failed sign-in exposes an error without retaining the previous user; subscription cleanup is tested with mocks.
- **AI validation:** Catalog shape is checked before prompting. Null AI recommendation entries are discarded; malformed JSON/shape becomes a controlled 502. The client rejects malformed recommendation records before ProductCard renders them.
- **Deadline/config:** Config is validated before catalog access; a shared deadline bounds catalog plus Gemini. Catalog timeout is a 504. A 1-second stalled-catalog test now aborts within its configured deadline.
- **Test suite drift:** Initial backend tests expected the old free-text response and mocked the first fetch as Gemini, although the implementation now fetches a catalog first. The initial run failed 6 of 7 reported tests. Updated tests to the current catalog-backed response contract; fixtures are host-routed and never contact the network.
- **Lint:** Baseline `expo lint` reported 5 errors and 12 warnings. Corrected undefined variables, unused imports and a header callback closure. One documented line-level `react-hooks/set-state-in-effect` exception remains for starting the existing external catalog fetch; no rule is disabled globally. Final lint exits 0 with no warnings.

## Historical Gemini 404 / 504 incidents — do not confuse with M8 verification

Earlier conversation logs reported unavailable-model responses and 30/60-second aborts. Those past model failures were not reproduced live during M8 and are not marked as newly verified historical fixes. Current evidence is:

- Mock unavailable-model 404 → controlled 502, no upstream details exposed: Passed.
- Mock Gemini abort and catalog deadline → 504: Passed.
- Mock 429 → 503 with one upstream attempt: Passed.
- Current read-only Express → Gemini request using the configured environment: HTTP 200 in 2,449 ms; product IDs 126 and 130 independently matched to DummyJSON. See `evidence/M8/live.json`. This is one successful observation, not a promise that the remote service never fails.

## Historical verification summary (before the latest user manual tests)

- Client: 15/15 headless tests Passed (`npm test` in `client`).
- Server: 12/12 reported tests Passed, including the parent suite (`npm test` in `server`).
- `npm run lint` in client: Passed, exit 0.
- JavaScript compile check: Passed; `--allowJs --checkJs false` is not strict type checking.
- Three opt-in live checks: Passed — catalog, invalid HTTP inputs, mapped Gemini recommendations.
- Device check: `adb devices` initially had no attached device. A running emulator appeared during final verification; the limited read-only UI smoke checks below were then executed.
- Live Firebase Auth/Firestore: Blocked pending an isolated test project/emulator; production mutations were explicitly excluded.
- Native notification permission/delivery, cart/order mutation acceptance and real storage restart: Blocked pending an isolated resettable test profile. Limited read-only UI/navigation/theme checks Passed; see below.
- M9 release/install/run: Not Tested, intentionally outside scope.

## Read-only emulator smoke checks (late M8 verification)

A running `emulator-5554` appeared after the initial no-device checks. Existing app state was retained. Confirmed catalog display, search hit/miss, smartphone category results, detail navigation, Reviews with formatted dates, Shipping content, FAB → AI, input → visible AI product cards, and light/dark settings rendering. The original dark theme and All category were restored. No cart/order/wishlist mutation, real payment or permission change was made. ADB forwarding was configured without touching `.env`.

See `evidence/M8/device.json` for the exact scope and screenshot/XML paths. Actual Android OS/model values in that file are the values reported by ADB. Early coordinate mis-taps and immediate pre-transition captures were inspected and retested, not counted as app bugs.

## Manual verification still required

The following original checklist is partially completed by the latest user manual results above; it does not imply those confirmed steps are still untested. The remaining cases and narrower unverified scopes are listed in the latest section. Use a development/test Firebase project or emulator, not production. Start the frontend/backend with local configuration already provisioned; do not submit credentials.

1. Attach a test emulator/device; record SDK, OS and app version. If using Android port forwarding, run `adb reverse tcp:3001 tcp:3001` for the matching local API URL. Do not change `.env` just to match an unverified address.
2. Browse, search a loaded product and a miss, change category, load all pages, refresh and navigate into detail/reviews/shipping. Repeat offline and retry after reconnection. Search currently covers loaded pages only.
3. Add two distinct items, repeat an add, change quantities, remove/clear; verify totals. Force-stop/reopen without clearing app data; check cart and theme restoration.
4. On the isolated Firebase setup, confirm anonymous session restoration; wishlist save/read/remove; deny Firestore rules and disable network. Confirm visible failure feedback and that another user cannot read the first user's wishlist.
5. Perform mock checkout only. Confirm one local Paid record, empty cart after save, order history and discounted line totals. Deny notifications: the order must still succeed with the explanation in the success message. Grant notifications and repeat with test data; inspect the actual notification tray after the requested delay, including background state.
6. Submit AI prompts from UI (valid, no match, empty, long); disconnect backend, then retry. Validate displayed IDs/stock against catalog. Tap the FAB and open a recommended product. Check both themes and keyboard placement.
7. Record screenshots and actual results in the existing matrix; only then change the corresponding Blocked rows to Passed/Failed. Notification taps are not wired to order deep links; there is no background remote-push or payment gateway claim.

**M8 status: Partial.** Confirmed code defects are fixed and automated/read-only integration evidence is complete. Mutating device-native, actual restart and isolated Firebase integration acceptance checks remain Blocked; read-only UI smoke checks are complete. M9 was not started.
