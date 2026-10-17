# Design Decision Record

## M8 implementation reconciliation — 2026-10-17

The decisions below retain the original plan for traceability. This section supersedes planned implementation claims where they differ from the current code:

- Context API and the existing React Navigation stack/tabs remain in use; no navigation framework migration was performed during hardening.
- Firebase anonymous Authentication and Firestore wishlist are implemented. **Orders are local AsyncStorage records**, not Firestore records. Their `Paid` label represents mock checkout only. The assignment requires at least one Firebase business use case; wishlist is that use case. Cloud order sync remains unimplemented and is not claimed as tested.
- Cart and theme preferences restore from AsyncStorage. M8 sanitizes malformed cart records before deriving totals. Orders serialize local saves to prevent overlapping writes from losing records.
- Gemini runs on the Express backend, receives DummyJSON catalog context, and returns mapped product arrays. Configuration is checked before network access; a deadline bounds catalog plus Gemini. Invalid/unknown/sold-out/duplicate IDs are excluded, and malformed responses yield controlled errors.
- Local notification scheduling follows successful local mock-order persistence. The request is one-shot after one second; actual timing is OS-controlled. Expo Go uses its default channel to preserve the working compatibility fix. Notification denial/failure does not undo a saved order and is explained to the user.
- `localNotifications.js` imports build subpaths as an Expo Go compatibility workaround. This is a version-coupling trade-off requiring retest on SDK/package upgrades; it is not a remote push integration.
- Current verification: automated headless/mocked and read-only live HTTP checks are Passed as individually listed in Test Matrix. An emulator became available late; read-only UI smoke checks were executed and recorded in evidence/M8/device.json. Isolated Firebase, mutating checkout/native notification and true restart acceptance remain Blocked. M9 is Not Tested.

Evidence: `Debug_Logs.md`, `Test_Matrix.xlsx`, and `evidence/M8/`. See the updated Integration Map and README for the current data flow. The historical plan below must not be presented as implementation evidence.

Status: These are the selected design decisions for the planned TechStore application. They document intended design, not implementation or test evidence. Update locations and implementation status as work proceeds.

## Decision 1 — State management
### Context
Product, cart, wishlist, and notification-related state support the catalog-to-cart/business-state workflow, and ownership should be clear across screens.
### Options Considered
- Context API (selected).
- Redux (assignment-listed alternative).
### Decision
Use React Context API for shared application state. Keep product/catalog and cart concerns separate rather than combining unrelated state in one large context. Product state covers remote data, loading/error, and pagination; cart state covers items and cart actions/derived values. Wishlist state is Firebase-backed and has loading/error state.
### Reason
Context API is explicitly an assignment option and fits the requested simple, beginner-friendly shared state approach.
### Trade-offs
Context is simple for this app's shared state, but broad contexts can cause unrelated state coupling and unnecessary updates; keep ownership separated.
### Impact
If state requirements grow substantially or change, revisit which state is shared and whether the selected contexts remain appropriate; update consumers and related tests.

## Decision 2 — API / service structure
### Context
Remote product access and external integration logic should not be embedded wholesale in screens.
### Options Considered
- Separate services called by hooks/state and UI (selected).
- Put integration logic directly in screens (not selected; conflicts with separation of concerns).
### Decision
Use a service layer, including a DummyJSON product service, with screens using hooks/context/state and services handling external operations. Other Firebase, Gemini, order, storage, and notification service boundaries will be kept small and introduced for their planned integrations.
### Reason
The assignment's conceptual architecture is Screens/UI → hooks/state → services → external systems and gives product/Firebase/AI service examples. A small service layer supports that while keeping the structure understandable.
### Trade-offs
Services add files and boundaries to learn, but keep network/integration code out of screens. Avoid adding unnecessary abstraction or a custom backend.
### Impact
If the data source or integration changes, update the corresponding service and its callers; document affected state and test cases.

## Decision 3 — Pagination strategy
### Context
Catalog browsing requires FlatList pagination/infinite scrolling, refresh, end detection, and protection against duplicate/repeated requests.
### Options Considered
- Use the chosen remote API's pagination.
- Download all products and paginate locally (not selected).
### Decision
Use DummyJSON's remote `limit` + `skip` pagination. Determine the end from the API response: `skip + products.length >= total`. Refresh resets pagination and requests the first page.
### Reason
This uses the real pagination mechanism of the selected catalog source instead of downloading the full catalog or faking pagination.
### Trade-offs
Each page depends on network/API availability and requires request/end guards; a failure must expose retry and not crash the app.
### Impact
If the API pagination contract changes, update the product service, pagination state/guard, and end-of-list tests together.

## Decision 4 — Persistence
### Context
The assignment requires startup restoration and persistence of designed state; this plan persists the cart locally.
### Options Considered
- AsyncStorage for local cart persistence (selected).
- SQLite (assignment example; not selected for this plan).
### Decision
Use AsyncStorage for cart persistence through a small storage/helper service. Restore cart at startup; update persistence when cart state changes. Keep storage keys and JSON parsing out of screens.
### Reason
AsyncStorage is the selected simple local persistence approach for cart state. The cart must remain usable in memory if storage fails.
### Trade-offs
Local cart persistence is device-local and asynchronous; storage errors can prevent restore/save, so errors must not break current in-memory cart use.
### Impact
If persistence requirements change (for example additional state or remote synchronization), revise storage ownership, startup restoration, and restart/failure tests.

## Decision 5 — Firebase business use case
### Context
At least one Firebase service/use case must persist a real business state. The selected state should answer a user need and avoid decorative integration.
### Options Considered
- Wishlist / saved products (selected).
- Order history, cart synchronization, preference, or another approved use case (not selected for this plan).
### Decision
Use Firebase Firestore for both selected business uses:
- **Wishlist:** create/save, remove, and read. A minimum wishlist record contains `userId`, `productId`, and `savedAt`; product details remain sourced from DummyJSON rather than being duplicated in Firestore.
- **Orders:** create and read mock orders. Store `userId`, order `items`, `total`, `createdAt`, and `status`; the minimum status is `CONFIRMED`. OrdersScreen reads the user's orders from Firestore.

### Reason
The wishlist lets users save products of interest for later, and storing mock order history provides a real business record for completed checkouts. Both are explicitly suggested assignment use cases.
### Trade-offs
Wishlist and order operations depend on Firebase availability and a workable user identity/auth approach, which must be resolved in implementation. Loading/error feedback is required; catalog details remain dependent on DummyJSON. Orders are mock records only and do not represent real payment processing.
### Impact
If identity, record structure, or business use cases change, update Firestore access, wishlist/order state and screens, rules/configuration as applicable, and read/write/error tests.

## Decision 6 — Gemini context and output validation
### Context
The required GenAI feature must connect to a real business workflow, use catalog/user context, and validate/match output before display or action.
### Options Considered
- Catalog-context product recommendation (selected).
- Generic chatbot or unrelated AI output (not selected; does not meet the assignment's business-context requirement).
### Decision
Implement AI Product Recommendation: send the user's shopping need and relevant real catalog context to Gemini. Treat Gemini as recommendation reasoning only. Validate/match returned product IDs against real DummyJSON catalog products and display only valid matched products. Ignore invalid IDs or use a safe fallback; handle AI errors without crashing.
### Reason
This supports product discovery while keeping DummyJSON as the source of truth for product identity and data.
### Trade-offs
Recommendations require an AI request and validation/matching logic; invalid, missing, or failed output must be handled. Gemini output is not authoritative for IDs, price, stock, or product existence.
### Impact
If prompt/context or response shape changes, update request construction, validation/matching, fallback UI, configuration, and valid/invalid/error tests.

## Decision 7 — Notification flow
### Context
The assignment requires a business event, notification flow, and permission handling including denied permission.
### Options Considered
- Notification triggered by successful mock order confirmation (selected).
- Another business event (not selected for this plan).
### Decision
After mock order confirmation succeeds and the order reaches `CONFIRMED`, trigger the order-confirmation notification. Handle granted, denied, and not-requested/unknown permission states. If denied, show clear status and keep the order flow working without a crash.
### Reason
The order-confirmed event is a clear business event linked to the checkout workflow and does not require real payment processing.
### Trade-offs
Notification delivery depends on permission and platform/configuration behavior; denied permission means the order still succeeds but the notification may not be delivered.
### Impact
If the business event or notification behavior changes, update checkout/order sequencing, permission/status UI, notification service, and allowed/denied/order tests.

## Related scope decisions
- **Product catalog:** DummyJSON is the read-only catalog source. Its add/update/delete endpoints are not used as persistent business storage.
- **Cart:** React Context state with AsyncStorage persistence; totals are derived from cart items.
- **Firebase:** Firestore stores wishlist records and mock order records; product catalog details remain sourced from DummyJSON.
- **Orders and checkout:** Cart → checkout/mock payment → create mock order in Firestore → status `CONFIRMED` → trigger order-confirmation notification. OrdersScreen reads the user's orders from Firestore. No real payment gateway is used.
- **Technology:** React Native + Expo + JavaScript; TypeScript is not required.
