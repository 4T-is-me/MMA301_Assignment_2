# Integration Map — TechStore
Planned architecture only; no integration in this map is claimed as implemented or verified. Actual file paths, configuration, and evidence are TBD until implementation.

```text
Screens / UI
    ↓
Hooks / Context / State
    ↓
Services
    ↓
DummyJSON / Firebase Firestore / Gemini / Notification system / AsyncStorage
```

## Remote API — DummyJSON
- **Purpose:** Read the product catalog; DummyJSON is the catalog source of truth.
- **Input:** Product list/search/category query and pagination `limit` + `skip` parameters.
- **Process:** Product service requests catalog data; do not use DummyJSON add/update/delete endpoints as persistent business storage.
- **Output:** Products and pagination total/response data for application state.
- **Error / Failure Path:** API/network failure → error feedback and retry; shopping/cart UI should not crash.
- **Current Status:** Planned / Not Started.
- **Implementation Location:** Planned `services/productService.js`; exact path TBD until created.

## Product data flow
- **Purpose:** Display searchable, filterable catalog with pagination, refresh and loading/empty/error states.
- **Input:** Initial request, search/category selection, refresh, or near-bottom scroll event.
- **Process:** `ProductListScreen` → product state/hook/context → `productService` → DummyJSON. Use server pagination (`limit` + `skip`); stop when `skip + products.length >= total`; refresh resets to the first page.
- **Output:** Product data rendered in `FlatList`, including empty and end-of-list states.
- **Error / Failure Path:** Loading/error/retry states; prevent duplicate/infinite requests. Exact user messages TBD.
- **Current Status:** Planned / Not Started.
- **Implementation Location:** Planned `ProductListScreen`, product state/hook/context, and `services/productService.js`; exact paths TBD.

## Cart state
- **Purpose:** Add/update/remove products, show quantity, item count, and derived subtotal/total; support checkout.
- **Input:** Product and cart action (add, quantity update, remove, clear).
- **Process:** Product detail/cart UI → Cart Context actions; derive totals from cart items rather than treating DummyJSON as cart storage.
- **Output:** Updated cart, derived count/totals, and order-summary input.
- **Error / Failure Path:** Cart remains usable in memory if persistence fails; storage feedback/logging TBD.
- **Current Status:** Planned / Not Started.
- **Implementation Location:** Planned Cart Context and cart screens; exact paths TBD.

## Persistence — AsyncStorage
- **Purpose:** Persist and restore the local cart.
- **Input:** Cart state changes; stored cart value at startup.
- **Process:** Small storage/helper service owns key and JSON parsing; startup restores cart; cart changes update stored state.
- **Output:** Restored cart or current in-memory cart.
- **Error / Failure Path:** Missing data → normal empty initial cart; invalid JSON/storage error → handle without crashing, keep current in-memory cart usable. Exact feedback TBD.
- **Current Status:** Planned / Not Started.
- **Implementation Location:** Planned storage helper and Cart Context; exact paths/key TBD.

## Firebase — Firestore wishlist and orders
- **Purpose:** Persist two business states: users' wishlists and mock order history.
- **Input:** Wishlist save/remove/read actions; for orders, the user's cart-derived items and total plus the user identity and confirmation action.
- **Process:** Wishlist UI → wishlist state/service → Firestore. Minimum wishlist record fields: `userId`, `productId`, `savedAt`; product details are looked up from DummyJSON, not duplicated in the record. Checkout/mock payment → create order in Firestore with `userId`, `items`, `total`, `createdAt`, and `status`; minimum status is `CONFIRMED`. OrdersScreen reads the user's orders from Firestore.
- **Output:** Wishlist product IDs/state for catalog lookup, and the user's stored orders for OrdersScreen.
- **Error / Failure Path:** Show loading/error feedback and keep other app functionality usable where possible. Firebase identity/auth approach and rules are TBD. Do not trigger order-confirmation notification unless order creation succeeds.
- **Current Status:** Planned / Not Started.
- **Implementation Location:** Planned wishlist/order state and Firebase service; exact paths/collections TBD.

## Gemini — AI Product Recommendation
- **Purpose:** Help a user discover products based on a real shopping need; not a generic chatbot.
- **Input:** User-entered need plus relevant real DummyJSON catalog context.
- **Process:** AI recommendation UI → AI service → Gemini; validate returned IDs by matching them against real catalog products before displaying recommendations.
- **Output:** Only valid matched catalog products; Gemini's reasoning may inform recommendations but catalog data remains authoritative.
- **Error / Failure Path:** Ignore invalid/nonexistent IDs or show safe fallback; AI error/timeout displays feedback without crashing or blocking normal shopping.
- **Current Status:** Planned / Not Started.
- **Implementation Location:** Planned AI UI/service and validation helper; exact paths, request/response shape TBD.

## Notification — order confirmation
- **Purpose:** Notify on the business event of successful mock order confirmation stored in Firestore.
- **Input:** Successfully created Firestore order with status `CONFIRMED` and notification permission state.
- **Process:** Checkout → create order successfully in Firestore → status `CONFIRMED` → notification service; Settings area shows/request permission state.
- **Output:** Order-confirmed notification when permitted; otherwise clear permission/status UI.
- **Error / Failure Path:** Denied/not-requested permission does not crash or block order flow; exact platform-specific behavior TBD.
- **Current Status:** Planned / Not Started.
- **Implementation Location:** Planned checkout/order flow, notification service, Settings/notification area; exact paths TBD.

## Orders and mock checkout
- **Purpose:** Show order summary, confirm mock payment, create a Firestore order record, and display order status/date/total; no real payment gateway.
- **Input:** Cart items and total, user identity, and confirmation action.
- **Process:** Cart → Checkout/Mock Payment → create order in Firestore with `userId`, `items`, `total`, `createdAt`, and `status` → status `CONFIRMED` → trigger order-confirmation notification. OrdersScreen reads the user's orders from Firestore.
- **Output:** Stored mock order and confirmation UI; OrdersScreen displays the user's Firestore orders.
- **Error / Failure Path:** Order validation/Firestore creation failure should provide feedback; do not send the success notification unless Firestore order creation succeeds. Exact handling TBD.
- **Current Status:** Planned / Not Started.
- **Implementation Location:** Planned Checkout/PaymentScreen, OrdersScreen, Firebase/order service, and notification service; exact paths TBD.

## Release configuration
- **Purpose:** Create and run release-like Android build outside a development-only workflow.
- **Input:** Actual app configuration/build settings (TBD).
- **Process:** Build/install/run according to class requirement.
- **Output:** APK/AAB or lecturer-approved release evidence.
- **Error / Failure Path:** Build/install issues to be recorded if encountered; no evidence yet.
- **Current Status:** Planned / Not Started.
- **Implementation Location:** TBD.

## Error handling
- **Purpose:** Keep the app from crashing on API, Firebase, Gemini, notification permission, or AsyncStorage failures.
- **Input:** External service/storage failure or denied permission.
- **Process:** Service/state layer reports operation status to UI; normal local cart should remain usable as much as possible if remote integrations fail.
- **Output:** Clear feedback, retry/fallback where appropriate, and usable unaffected flows.
- **Error / Failure Path:** Individual UI/messages and simultaneous-failure behavior are TBD until implemented and tested.
- **Current Status:** Planned / Not Started.
- **Implementation Location:** Relevant services, contexts/hooks, and screens; exact paths TBD.

## Secrets / configuration
- **Purpose:** Keep Firebase/Gemini secrets out of source control and submitted files.
- **Input:** Firebase configuration and Gemini credential required by selected integration.
- **Process:** Use an Expo-appropriate configuration approach to be selected/implemented; never commit real secrets.
- **Output:** Runtime configuration without exposing real credential values in documentation.
- **Error / Failure Path:** Missing/invalid configuration handling TBD.
- **Current Status:** Planned / Not Started.
- **Implementation Location:** Planned config area; actual mechanism and path TBD.
