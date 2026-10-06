# TechStore — Integrated E-Commerce Mobile App
## 1. Overview
TechStore is the planned MMA301 Assignment 2 integrated e-commerce mobile app. It focuses on a technology-products catalog and the assignment's end-to-end workflow. The project uses React Native + Expo + JavaScript. This README describes intended design; feature status remains **Planned** until implementation and evidence exist.

## 2. Assignment Requirements
The assignment workflow is: restore designed state and load a remote catalog; browse/search with FlatList pagination/infinite scrolling and refresh, including loading/empty/error/retry states; view product detail; add/update/remove cart items with correct total and item count; persist state according to design; use Firebase for at least one real business state; connect Gemini/GenAI to catalog/user context and validate/match output; demonstrate a business notification event with permission handling; handle network/Firebase/AI/permission failures without crashing and provide appropriate feedback; and create/run a release-like Android build or lecturer-approved evidence.

The RTM retains assignment IDs R01–R12. See `RTM.xlsx` for requirement mapping and planned minimum tests. No implementation evidence is claimed here.

## 3. Core Workflow
Catalog → Detail → Cart → Persisted / Business State
Planned integrations: Remote Data, State Management, Firebase, Notification, Gemini / GenAI, Debugging, and Release. Checkout/payment is mock only; no real payment gateway is planned.

## 4. Features
- [ ] **Planned:** Product catalog from DummyJSON (read-only source of truth)
- [ ] **Planned:** FlatList pagination/infinite scrolling using `limit` + `skip`, pull-to-refresh, search/category filter
- [ ] **Planned:** Loading, empty, error, retry, and end-of-list handling
- [ ] **Planned:** Product details and add-to-cart actions
- [ ] **Planned:** Cart add/update/remove, derived totals/count, AsyncStorage persistence
- [ ] **Planned:** Firebase Firestore wishlist (save, remove, read)
- [ ] **Planned:** Firestore-backed mock orders (create/read items, total, createdAt, status `CONFIRMED`)
- [ ] **Planned:** Mock order list and mock checkout; no real payment system
- [ ] **Planned:** Gemini product recommendations using real catalog context and validated product IDs
- [ ] **Planned:** Order-confirmation notification with permission handling
- [ ] **Not Started:** Two real debugging records and retest evidence
- [ ] **Not Started:** Release-like Android build/install/run evidence
## 5. Screens
Planned screens/modules:
1. `ProductListScreen` — catalog, search/filter, FlatList pagination, refresh and load states.
2. `ProductDetailScreen` — product details and cart action; optional AI entry point.
3. `CartScreen` — items, quantity, remove, derived totals, persistence, checkout.
4. `WishlistScreen` — Firebase-backed saved products with loading/error handling.
5. `OrdersScreen` — mock order status, date, and total.
6. AI Recommendation UI — shopping need input and validated recommendations.
7. Checkout / PaymentScreen — mock order summary/confirmation only; no real payment gateway.
8. Settings / Notification area — permission status/request and appropriate status UI.

These are planned screens, not implemented screens.

## 6. Architecture
Planned simple separation of concerns:

```text
Screens / UI
    ↓
Hooks / Context / State
    ↓
Services
    ↓
DummyJSON / Firebase / Gemini / Notification system / AsyncStorage
```

Use React Context API for shared state, separated by concern (not one large unrelated context). Planned folders: `components/`, `screens/`, `navigation/`, `contexts/`, `hooks/`, `services/`, `utils/`, `constants/`, `config/`, and `storage/`. Actual file paths may be refined to fit the existing project.

## 7. Data Flow
- **Catalog:** `ProductListScreen` → product state/service → DummyJSON → product list. Use API `limit` + `skip`; end when `skip + products.length >= total`.
- **Cart:** Detail/list → Cart Context → AsyncStorage helper; cart totals/count are derived from items.
- **Wishlist:** Product UI → wishlist state/service → Firestore; retrieve product details from DummyJSON using saved product IDs.
- **Orders:** Cart → Checkout / Mock Payment → create order in Firestore (`userId`, `items`, `total`, `createdAt`, `status`) → status `CONFIRMED` → trigger order-confirmation notification → OrdersScreen reads the user's orders from Firestore.
- **AI recommendation:** shopping need + relevant real catalog context → Gemini → validate/match IDs against DummyJSON → show only valid products.

All flows above are planned, not verified.

## 8. DummyJSON
DummyJSON Products API is the planned source of truth for the product catalog. Read catalog/search/category/pagination data using the API's capabilities. Pagination uses `limit` + `skip`. Do not rely on DummyJSON add/update/delete endpoints as persistent business storage. Actual endpoint/config details and implementation are TBD.

## 9. Firebase
Planned Firestore responsibilities:
- **Wishlist:** save, remove, and read. Minimum record fields: `userId`, `productId`, `savedAt`; product details remain in DummyJSON.
- **Orders:** create mock orders and read the user's orders in OrdersScreen. Planned record fields: `userId`, `items`, `total`, `createdAt`, and `status`; minimum status is `CONFIRMED`.

Show loading/error feedback. Authentication/identity, Firestore rules, configuration, and implementation remain TBD. No Firebase behavior is claimed as implemented.

## 10. Gemini AI
Planned AI feature: product recommendation based on a user-entered shopping need and relevant real catalog context. Validate/match returned product IDs against actual DummyJSON products; only valid matched products may be displayed. Gemini is not authoritative for product existence, ID, price, or stock. Invalid output/error fallback, model/config, and implementation remain TBD.

## 11. Notification
Planned business event: successful Firestore order creation with status `CONFIRMED`. Flow: Cart → Checkout / Mock Payment → create order in Firestore → `CONFIRMED` → trigger order-confirmation notification. OrdersScreen reads the user's orders from Firestore. Handle permission granted, denied, and not requested/unknown. Denial should not crash or block the order flow and should have clear UI status. Platform-specific setup and implementation are TBD.

## 12. Cart Persistence
Planned AsyncStorage persistence via a small storage helper. Restore cart at startup and persist cart changes. Missing data, invalid JSON, and storage errors must not crash the app; in-memory cart should remain usable as much as possible. Implementation is not started.

## 13. Testing
Planned test cases: `docs/Test_Matrix.xlsx`. Cases are not test results; update actual result/status/evidence only after executing each test.

## 14. Debugging
Evidence templates: `docs/Debug_Logs.md`. At least two real debug records with root cause and retest are required; current entries remain TBD.

## 15. Release
A release-like Android build must be created and run outside a development-only workflow (or provide lecturer-approved release evidence). Build steps/artifact/evidence remain TBD.

## 16. AI Usage
Log actual assistance only in `docs/AI_Usage_Log.xlsx`. Do not record planned or fabricated AI usage. Verify/adapt/explain any AI output used.

## 17. Installation and Running
TBD until the existing app setup and actual run instructions are confirmed. Configuration instructions will be added without exposing real Firebase/Gemini secrets.
