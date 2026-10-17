# Integration Map — TechStore (M8 review, 2026-10-17)

This describes the current code. Passed evidence is scoped to the test layer; do not interpret mocked or live HTTP checks as device verification.

```text
ProductList / ProductDetail -> productService -> DummyJSON (read only)
Product UI -> CartContext -> AsyncStorage @techstore_cart
AuthContext -> Firebase anonymous Auth
WishlistContext -> wishlistService -> Firestore users/{uid}/wishlist
Cart -> Checkout -> OrderContext -> AsyncStorage @techstore_order
  -> clear cart after successful save -> NotificationService -> OS local notification
AIRecommendationScreen -> aiRecommendationService -> Express /api/recommendations
  -> DummyJSON catalog -> Gemini -> validate IDs/stock/reasons -> product cards
ThemeContext -> AsyncStorage @app_theme
```

| Integration | Implemented behavior | M8 evidence / limitation |
|---|---|---|
| Catalog | Remote limit/skip/category, detail, refresh/retry; search over loaded pages | Live data checks Passed; mocked screen pagination/search/navigation Passed; read-only catalog/search/category/detail UI Passed; full failure/end acceptance Blocked |
| Cart | Local Context, per-product quantity guards, derived totals, sanitized hydration | Headless operations and mock storage remount Passed; real restart Blocked |
| Firebase | Anonymous identity and user-scoped Firestore wishlist | Mock session/failure and service routing Passed; live Auth/rules/read/write Blocked pending isolated environment |
| Orders | Local AsyncStorage snapshots; serialized saves before UI/clear-cart | Concurrent-save and mock checkout regressions Passed; actual order history UI/restart Blocked |
| Notifications | Permission handling, Expo Go default channel, one-shot 1-second request; native builds create orders channel | Mock delay/denial/duplicate tests Passed; native delivery and background behavior Blocked |
| AI | Catalog-backed JSON; valid real IDs, nonempty reasons, in-stock filtering, deduplication, max 3 results | Mock negative paths Passed; live Express+Gemini+independent catalog match Passed (2,449 ms); read-only UI request/result Passed |
| Navigation/theme | Existing stack/tabs, nested Orders path, FAB to AI, theme persistence | Headless handlers/preference remount Passed; read-only FAB/detail and theme UI Passed; checkout navigation/restart acceptance Blocked |
| Configuration | Existing local environment/configuration retained; no secret values in evidence | No credential or `.env` edits; release configuration/build is M9, Not Tested |

Failure paths: network/catalog/AI errors become UI errors or controlled HTTP failures (504 deadline, 503 busy/quota, 502 malformed/upstream). Wishlist preserves original service errors. Storage failure does not silently clear the cart during checkout. Denied notifications do not undo orders and are explained in checkout success feedback.

The original plan proposed Firestore orders. Actual orders are local; Firestore wishlist is the implemented Firebase business use case. This is an explicit implementation reconciliation, not a claim that order cloud sync exists. See Debug Logs for manual acceptance steps and remaining risks.
