# ECOMMERCE ADMIN ARCHITECTURE AUDIT — ATHLETIX

> **Audit date:** 2026-10-17 · **Repo:** `ATHLETIX` (`main` @ `85a7c03`) · **Scope:** analysis only — no code, dependency, schema, or config changes made.
> **Method:** static inspection of all source files (`src/*.jsx|js|css`, `index.html`, `package.json`, `vite.config.js`, `.gitignore`, `README.md`, `.env` size check). No runtime testing, no Supabase project access.

<!--APPEND-->
## 1. Executive Summary

**ATHLETIX** is a small, self-contained customer-facing sports-equipment storefront built with **React 18 + React Router 6 + Vite 5**, plain CSS (no framework), and `lucide-react` icons. The entire app lives in **7 source files** under `src/` — no `src/pages/`, `src/components/`, `src/hooks/`, `src/services/`, `src/lib/`, tests, or backend code.

- **Confirmed:** All commerce is **frontend-only with mock data**. `src/data.js` hardcodes 8 categories and 16 products; images are runtime-generated inline SVG data-URIs via `art()`; cart/wishlist persist only in `localStorage` (`ax_cart`, `ax_wish`); checkout is an explicit demo (`CartDrawer`: "Checkout is a frontend demo", `CartPage`: "Place demo order" → `clear()` + local `done` flag, `Footer`: "Demo store; no real orders or payments").
- **Confirmed:** No Supabase, no API client, no auth, no server routes/functions, no migrations/SQL, no `.env` values (`.env` is 0 bytes), no state library beyond Context + `useState`.
- **Implication for admin:** there is **nothing to reuse on the backend** — every persistent entity (products, categories, images, inventory, orders, customers, coupons) must be designed from scratch. The reusable assets are the **design tokens/CSS classes, presentational primitives (`ProductCard`, `Rating`, `Breadcrumbs`, `Img`, buttons/inputs/drawers), and the frontend data shapes** in `data.js`, which make excellent seed data and type-design input for a Supabase schema.
- **Recommended next step:** Phase 1 — freeze frontend product/category TypeScript-equivalent shapes + seed script, then create Supabase schema + Storage + RLS before any admin UI (see §16).

## 2. Technology Stack

| Concern | Finding | Evidence |
|---|---|---|
| Frontend framework | **React 18.3.1** (JSX, no TypeScript) | `package.json: react, react-dom ^18.3.1` |
| Routing | **react-router-dom 6.23.0** (`BrowserRouter`, `Routes/Route`, `useParams`, `useSearchParams`, `useNavigate`, `NavLink`) | `src/main.jsx:6`, `src/App.jsx:1,13-23` |
| Build tool | **Vite 5.2.0** + `@vitejs/plugin-react 4.3.0`; default config only | `vite.config.js: defineConfig({plugins:[react()]})`, scripts `dev/build/preview` |
| Language | JavaScript (ES modules); files use `.jsx`/`.js` mixed | `src/` listing |
| Styling | Hand-written global CSS, CSS custom properties; Google Fonts via `<link>` | `src/styles.css:1`, `index.html:7-8` (Barlow Condensed + DM Sans) |
| Icons | **lucide-react 0.383.0** only third-party UI dep | `components.jsx:3`, `pages.jsx:3` |
| Package manager | npm (`package-lock.json` 58 KB present, `node_modules/` installed) | root listing |
| Entry points | `index.html → /src/main.jsx → App.jsx → StoreProvider + Routes` | `index.html:12`, `main.jsx`, `App.jsx:8-28` |
| Backend / DB | **None** | no `supabase`, `axios`, `firebase`, `api/`, `server/`, `functions/`; `grep`-equivalent full file listing confirms |
| Env vars | None referenced; `.env` empty (0 bytes), gitignored (`.env`, `.env.*`) | `ls -la`, `.gitignore` |
| Tests / lint / TS | None (no `*.test.*`, no eslint/tsconfig) | file listing |

**Confirmed:** no TypeScript, no UI kit (MUI/Tailwind/shadcn), no form/table/chart libs, no data-fetching lib.

## 3. Existing Project Directory Structure

```
/home/just-hakku/Project2/athletix/
├── index.html                  # root HTML, fonts, #root, /src/main.jsx
├── vite.config.js              # default Vite + React plugin
├── package.json / package-lock.json
├── .env                        # CONFIRMED empty (0 bytes) — no secrets to leak
├── .gitignore                  # node_modules, dist, .env (keeps !.env.example)
├── README.md                   # "demo store; no real orders"
├── ECOMMERCE_ADMIN_ARCHITECTURE_AUDIT.md  # THIS REPORT (new, audit-only)
└── src/
    ├── main.jsx (6 lines)      # BrowserRouter + App + styles.css bootstrap
    ├── App.jsx (28 lines)      # StoreProvider, ScrollTop, Navbar/CartDrawer/Toast, Routes, Footer
    ├── data.js (53 lines)      # CATEGORIES, PRODUCTS (RAW→map), BRANDS, MAXP, inr(), off(), art(), catBySlug/Name
    ├── store.jsx (31 lines)    # Context: cart/wishlist/open/toast, usePersist, addToCart/setQty/remove/clear/toggleWish, derived lines/count/subtotal/shipping/total
    ├── components.jsx (~144 lines) # Img, Rating, SectionHeading, Breadcrumbs, ProductCard, ProductGrid, Navbar, CartDrawer, CartItem, Footer, Newsletter, Toast, related()
    ├── pages.jsx (~152 lines)  # Home, Shop, ProductDetails, Wishlist, CartPage, About, Contact, NotFound
    └── styles.css (~71 lines)  # tokens, buttons, nav, hero, cards, shop, pd, cart, drawers, footer, responsive
```

**How parts work together (Inferred, strongly evidenced):** `main.jsx` mounts `App.jsx`; `App.jsx` wraps everything in `StoreProvider` (global cart/wishlist/UI state) and declares 8 routes sharing one marketing layout (`Navbar` + `<main>` + `Footer` plus global `CartDrawer`/`Toast`). `pages.jsx` screens compose primitives from `components.jsx` and read synchronously from `data.js` constants via `store.jsx`. There is no data layer, service layer, or async boundary — every page is a pure function of URL params + Context + static arrays.

## 4. Routes and Page Inventory

**Confirmed** from `src/App.jsx:13-23` (single marketing layout; `ScrollTop` resets scroll per pathname):

| Route | Page (`src/pages.jsx`) | Purpose & interactions | Data / API |
|---|---|---|---|
| `/` | `Home` (L8-29) | Hero CTAs, shop-by-sport (`CATEGORIES`), Featured (first 8), gym promo, New Arrivals (`isNew`), Best Sellers (`best`), benefits, `Newsletter` | `PRODUCTS`, `CATEGORIES`; no API |
| `/shop` | `Shop` (L31-86) | Catalog with sidebar + mobile drawer filters, search, sort, count, load-more (8/page) | URL query params as filter state; no API |
| `/category/:slug` | `Shop` (same) | Category view via `catBySlug(slug)`; radio navigates to `/category/...`; unknown slug falls back to all, **no 404 (minor bug)** | `CATEGORIES`, `PRODUCTS` |
| `/product/:id` | `ProductDetails` (L88-120) | Gallery (3 views + thumbs), rating, price/sale, desc, size-required flow, qty stepper 1-10, Add/Buy/Wishlist, PIN check, specs, `related()` | `PRODUCTS.find(id)`; bad id → `NotFound`; no API |
| `/wishlist` | `Wishlist` (L122-126) | Saved-products grid or empty state | `wish` ids x `PRODUCTS`; localStorage |
| `/cart` | `CartPage` (L127-139) | Line items (`CartItem`), summary, "Place demo order" clears cart + success screen | Derived store values; no order created |
| `/about` | `About` (L140) | Static marketing copy | None |
| `/contact` | `Contact` (L141-151) | Controlled form (name/email/subject/message) + inline validation + demo success; no send | Local state only |
| `*` | `NotFound` (L152) | 404 + home CTA | None |

Global chrome (`src/components.jsx`): `Navbar` (announcement bar, logo, 6 links, expanding search, account icon → `/contact` placeholder, wishlist/cart badges, mobile drawer), `CartDrawer` (mini-cart + totals + "frontend demo" disclaimer), `Footer` (shop/support links, UPI/VISA/MC/COD badges, demo disclaimer), `Toast` (2.2s messages).

## 5. Feature Implementation Status

| Feature | Status | Evidence |
|---|---|---|
| Home / merchandising | **Fully implemented (frontend-only)** | `Home` curates `PRODUCTS.slice`, `isNew`/`best` filters |
| Listing + category | **Fully implemented (frontend-only)** | `Shop` filters: category, brand select, max-price range (500–`MAXP`), rating, in-stock, on-sale; sorts: featured/price-asc/price-desc/rating/newest (`b.id-b.id`) |
| Product details | **Fully implemented (frontend-only)** | Gallery state, size gate (`needSize`), stock msg (`Only N left` if <10), PIN regex `^[1-9]\d{5}$` (client-only message) |
| Search | **Implemented (frontend-only)** | Navbar `go()` → `/shop?q=`, `Shop` substring match on name+category+brand; toolbar live filter |
| Sort/filter | **Implemented (frontend-only)** | `useMemo` + `useSearchParams` (`set()` helper); shareable URLs |
| Cart | **Implemented (frontend-only)** | `addToCart/setQty/remove`, cap 10/line, key `(id,size)`; shipping: free ≥₹1999 else ₹99; `localStorage ax_cart` |
| Checkout | **UI-only demo** | `clear()` + `done` flag; "No payment was taken" |
| Wishlist | **Implemented (frontend-only)** | `toggleWish`, `ax_wish`, badge counts, heart toggle in `ProductCard`/PDP |
| Auth / accounts | **Not implemented** | `User` icon links to `/contact`; no login/session/profile |
| Orders / history | **Not implemented** | No order object is ever created |
| Coupons / discounts | **Not implemented** | Only per-product `orig` sale + newsletter "10% off" promise (no code); `Newsletter` validates email regex then shows message |
| Payments / shipping backend | **Not implemented** | Footer badges are static text; PIN check is regex-only |
| Contact / newsletter | **UI-only** | Validation only, no network call |
| Reviews | **UI-only display** | `rating`/`reviews` numbers rendered, no review CRUD |

## 6. Component Hierarchy and Reusability

```
App (StoreProvider)
├── ScrollTop / Navbar (LINKS[6], sbar, drawers) / CartDrawer / Toast
├── Routes → Home | Shop | ProductDetails | Wishlist | CartPage | About | Contact | NotFound
│   ├── Home: SectionHeading, ProductGrid(ProductCard>Img,Rating,heart,Quick-add), Newsletter
│   ├── Shop: Breadcrumbs, Filters, toolbar(search,sort), ProductGrid, Load-more
│   ├── ProductDetails: Breadcrumbs, gal(Img+thumbs), Rating, sizes, qty, pin, specs, related→ProductGrid
│   └── CartPage/Wishlist: CartItem(Img,qty,remove) / ProductGrid
└── Footer
```

| Category | Components (`src/components.jsx`) | Reuse in admin? |
|---|---|---|
| Primitives | `Img` (fallback `art('🏅')` onError), `Rating`, `SectionHeading`, `Breadcrumbs`, `Toast` | **Yes — reuse as-is** (image fallback + toasts + crumbs fit admin) |
| Product | `ProductCard`, `ProductGrid`, `related()` | Reuse `ProductCard` for admin "storefront preview"; admin needs its own dense table, not cards |
| Cart | `CartItem`, `CartDrawer` | Keep storefront-only; admin order view needs new line-item table |
| Layout/nav | `Navbar`, `Footer`, `Newsletter` | **Do not reuse** — admin needs `AdminLayout` (sidebar + topbar); marketing chrome would pollute admin |
| State | `StoreProvider`, `useStore`, `usePersist` | Pattern reusable; admin needs separate `AdminProvider` (auth session, filters) — do not share cart context |
| Utils | `inr()`, `off()`, `art()`, `catBySlug/Name`, `BRANDS`, `MAXP` | Reuse `inr/off` formatting; `art()` only as image placeholder until Storage; replace static lookups with DB queries |

**Constraints (Confirmed):** all components live in one 144-line file with no props-type checking; `ProductCard` couples display + `useStore` actions (quick-add defaults to `sizes[0]` — wrong for admin editing); no table, dialog, form-field, pagination, or chart primitives exist — admin must build `DataTable`, `Modal`, `Field/Input/Select`, `Badge/StockPill`, `Pagination`, `Empty/Loading/Error` states anew (can copy CSS conventions). No duplicated logic beyond `inr` reuse (good); tight coupling is limited to store-imports in `ProductCard`/`Navbar`/`CartDrawer`.

## 7. Design System and UI Conventions

All tokens **Confirmed** in `src/styles.css:1` — do not invent others:

- **Palette:** `--lime:#C8F31D` (CTA/accents), `--navy:#0B1B2B` (text, dark buttons, footer), `--bg:#fff`, `--soft:#F3F5F7` (wells, search pills, summaries), `--muted:#6B7785`, `--line:#E3E7EB`; semantic `.ok:#1c7c3a`, `.err:#c0392b`.
- **Typography:** `--head:'Barlow Condensed'` uppercase condensed (logo italic), `--body:'DM Sans'`. Titles `clamp(36px,6vw,56px)`; card titles 17px mobile.
- **Shape/elevation:** `--r:16px`, `--sh:0 6px 20px rgba(11,27,43,.08)`; pills `999px` (buttons/badges/search/toast); inputs `10px`; thumbs `12px`.
- **Buttons:** `.btn` + `.btn-lime` (hover `#d8ff3a`, lift), `.btn-dark`, `.btn-ghost` (+`.on`), `.btn-ghost-l`, `.btn-sm`, `:disabled` 45%. Reuse all; admin must add `.btn-danger` (missing).
- **Inputs:** `select,.fld input,.fld textarea` — 10-12px pad, `1px var(--line)`, `10px` radius; `.fld` grid + bold label + `.err`; copy `Contact.field()` + `Newsletter.submit()` validation pattern (regex + `aria-invalid` + `role=status`).
- **Cards/tables:** `.card` + `.grid` (4→3→2 cols); `.sum` soft box with `.row/.tot`; `.specs` key-value table. **No dense data-table exists** — build with `--line` dividers + sticky header.
- **Overlays:** `.overlay` navy 50%; `.drawer` 400px slide; `.toast` navy/lime pill; `.empty` states; `.badge` flags.
- **Icons:** lucide only (Cart, Heart, Search, User, Menu, X, Star, Trash, Plus, Minus, Zap, Mail, Shield, Truck, BadgeCheck, Sliders). Stay in set; add Dashboard/Package/Tags/Boxes/Bag/Users/Ticket/Chart/Settings/Upload/Pencil for admin.
- **Responsive:** `1024px` (hide links, hamburger + filter drawer) and `767px` (1-col PDP/cart, 2-col grids); `prefers-reduced-motion` + `:focus-visible` lime ring — keep for admin.
- **Themes:** light-only, no dark mode. Flat global classes (`.nav-in`, `.card-body`).
- **Admin reuse:** tokens + buttons + inputs + drawers + toast + crumbs as-is; new `AdminLayout` (navy sidebar 240px + soft content), `StatCard` (soft bg + `--sh`), `DataTable`, `StockPill` (ok/err/muted). No new palette.

## 8. State Management and Data Flow

**Confirmed** (`src/store.jsx`): Context + local state only.

- `usePersist(key, init)` — lazy localStorage read + write-back effect; keys `ax_cart` (`[{id,size,qty}]`), `ax_wish` (`[id]`). Corrupt JSON falls back to init; no versioning (note: UUID migration will orphan carts).
- `StoreProvider` exposes `{lines,count,subtotal,shipping,total,addToCart,setQty,remove,clear,wish,toggleWish,open,setOpen,toast,say}`. Derived: `lines = cart x PRODUCTS.find` (dangling filtered), `count` = qty sum, `shipping = 0 if subtotal==0 or >=1999 else 99`. Caps qty 1-10; merge key `(id,size)`.
- Page-local `useState`: gallery/size/qty/pin (`ProductDetails`), `shown`+`drawer` (`Shop`), forms (`Contact`, `Newsletter`, nav search).
- URL-as-state (`Shop`): `useSearchParams` holds `q,brand,sort,max,rating,stock,sale`; `set()` mutates params + resets pagination; category in path. Shareable — admin lists should copy this.
- **Traces:** Listing: URL → `useMemo` filter/sort → `ProductGrid`. PDP: `:id` → `find` → `addToCart` → Context+localStorage → `Toast`/badges. Cart: `lines` → `CartDrawer`/`CartPage` → demo `clear()`. No fetch/loading/error/cache — **catalog = constants, persistence = localStorage**.
- **For admin:** add `@supabase/supabase-js` + async hooks (`useProducts`…) with loading/error/empty; keep storefront Context until catalog swaps to query hooks behind same `inr/off` helpers.

## 9. Supabase and Backend Integration Audit

| Question | Verdict |
|---|---|
| Supabase installed/configured? | **Confirmed NO** — no dep, no `createClient`, no `VITE_SUPABASE_*` refs |
| Env vars referenced? | **Confirmed NO** — zero `import.meta.env`; `.env` 0 bytes |
| Auth implemented? | **Confirmed NO** — `User` icon links to `/contact`; no session/guard |
| DB queries / API routes / edge functions? | **Confirmed NONE** — no `fetch/axios`, no `/api`, no `functions/`, no `.sql`/migrations |
| Product source? | **Confirmed: hardcoded `RAW` → `PRODUCTS`** (`data.js:19-49`) |
| Images? | **Confirmed: generated SVG data-URIs** via `art()` (3/product) + `Img` fallback; no remote URLs, Storage, or asset files |
| Orders/customers persisted? | **Confirmed NO** — cart in localStorage; "order" clears cart + message |
| Schema / RLS? | **Confirmed ABSENT** — Supabase project itself **Unknown/inaccessible** from repo |
| Secrets exposure? | **Confirmed NONE** — empty `.env`, gitignored |

**Limitation on record:** cannot verify any Supabase project, table, policy, or connection — none is referenced by code.

## 10. Existing Data Models

All **frontend-only** (`data.js`, `store.jsx`). Fields **Confirmed**; DB mapping **Unknown**.

- **Category:** `{slug, name, emoji, a, b}` × 8. *Backend gaps:* needs `id, description, image_url, sort_order, is_active, timestamps`; emoji/gradient are presentation-only.
- **Product:** `{id 1-16, name, category (name string), brand, price, orig, rating, reviews, stock, badge, sizes[]|null, isNew, best, images[3] (data-URI), desc (template), specs (4-tuple)}`. *Gaps:* no SKU/slug/status; denormalized category; single `stock` (no per-variant); fixed specs; no `cost, weight, is_active, created_at`; static ratings with no review source.
- **Variant (implicit):** `sizes` arrays only (UK/S-XL/M-L/Youth-Men) — no SKUs/prices/stock. Needs `product_variants` table.
- **CartItem:** `{id, size, qty}` + derived `p`; merge on `(id,size)`, cap 10. Backend must snapshot `unit_price`.
- **Wishlist:** `[productId]`. Needs per-user `wishlists(user_id, product_id)`.
- **User/Customer, Order/OrderItem, Payment/Shipment, Coupon:** **do not exist** in any form. Backend must create `profiles`, `orders` (status/totals/addresses/payment), `order_items` (snapshots), `coupons` + redemptions.

## 11. Admin Feature Mapping

| Admin feature | Why (storefront evidence) | Reuse | New (admin-only) | Entities / ops | Deps | Provided? |
|---|---|---|---|---|---|---|
| Dashboard overview | No sales visibility | `inr`, tokens, `SectionHeading`, `Breadcrumbs` | `StatCard`, charts (`recharts`), low-stock, recent orders | `orders`/`products` aggregates | Schema+orders | No |
| Product CRUD | 16 hardcoded products, edited nowhere | `inr/off`, `Img` fallback, `.fld`, `Toast` | `DataTable`, `ProductForm`+validation, status toggle, `ProductCard` preview | `products` (+variants) CRUD, search/sort/page | Categories, Storage, authZ | Shapes only |
| Category CRUD | 8 static categories | `CATEGORIES` seed, `art()` placeholder | `CategoryForm`, slug check, sort/active | `categories` CRUD | Schema | Seed only |
| Image uploads | All images generated SVG; README says replace | `Img` fallback, thumb CSS | `ImageUploader` (drop, reorder, cover), type/size validation | Storage bucket + `product_images` | Storage+RLS | No |
| Inventory | Single `stock`; "Only N left"; 1 product at 0 | Stock copy, `.ok/.err` | Adjust form, thresholds, per-variant stock, history | `products.stock`, `variants.stock`, `inventory_movements` | Products | Display only |
| Orders | Demo creates no orders | `CartItem` ref, `.sum`, `inr` | `OrderTable`, status flow (pending→paid→shipped→delivered/cancelled) | `orders`, `order_items` R/U | Auth, customers | No |
| Customers | No accounts; anon localStorage | — | `CustomerTable`, detail (LTV, orders), notes | `profiles` from Auth, read+notes | Auth | No |
| Coupons | Only `orig` sales; newsletter 10% unfulfilled | `off()` display | `CouponForm` (code/%/min/expiry/limits) | `coupons`, redemptions | Orders | No |
| Reports | Static ratings; no analytics | Tokens | Revenue/top-product charts, CSV export | Aggregate views | Orders | No |
| Settings | Shipping (₹99/free ≥1999) + announcement hardcoded | — | Form for shipping tiers, announcement | `store_settings` KV | AuthZ | Rule to port |
| Admin auth | Zero auth | Validation patterns | Login, `RequireAdmin`, `is_admin`, audit log | Auth + RLS | First | No |

**Recommendation:** core = auth + products + categories + images + inventory + orders + customers. Phase-2 = coupons (fulfills newsletter promise), reports, settings.

## 12. Proposed Admin Folder Structure

**PROPOSED — not existing.** Flat-file spirit, split by concern. All `admin/` items `(new)`.

```
src/
├── main.jsx / App.jsx / styles.css   # existing (App adds /admin/* routes)
├── data.js / store.jsx / components.jsx / pages.jsx  # existing, untouched
├── lib/                      (new)
│   ├── supabaseClient.js     (new)  # createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
│   ├── format.js             (new)  # re-export inr/off + date helpers
│   └── guards.jsx            (new)  # RequireAdmin, useAdminSession
├── admin/                    (new)
│   ├── AdminLayout.jsx       (new)  # sidebar + topbar + <Outlet/>
│   ├── AdminRoutes.jsx       (new)  # /admin, products, categories, inventory, orders, customers, coupons, reports, settings, login
│   ├── pages/                (new)  # Dashboard, ProductsAdmin, CategoriesAdmin, InventoryAdmin, OrdersAdmin, CustomersAdmin, CouponsAdmin, Reports, Settings, AdminLogin
│   ├── components/           (new)  # DataTable, ProductForm, CategoryForm, ImageUploader, StockPill, StatCard, StatusBadge
│   ├── hooks/                (new)  # useProducts, useCategories, useOrders, useCustomers, useUploads
│   ├── services/             (new)  # per-entity Supabase queries
│   └── types.js              (new)  # JSDoc shapes from §10 + new entities
└── styles/admin.css          (new)  # sidebar/table/stats on existing tokens
```

**Routing (proposed):** `/admin/*` under `RequireAdmin` + `AdminLayout`; storefront routes unchanged. Supabase isolated in `lib/` + `admin/services/` for a later single-hook storefront swap.

## 13. Security and Production Readiness

- **AuthN/Z — Confirmed absent, highest risk:** no sessions/roles/guards. Admin needs Supabase Auth (password + MFA), `is_admin` claim/table, `RequireAdmin` guard **plus** RLS — never route-hiding alone.
- **RLS (to build):** anon read-only active `products/categories/images`; customers own `orders/wishlists/profiles` only; admins full CRUD + Storage write; PII never anon-readable.
- **Price/stock integrity:** client constants are forgeable. Compute totals server-side (DB/Edge function), snapshot `unit_price`, decrement stock transactionally, keep 1–10 cap as DB check.
- **Uploads:** MIME (jpeg/png/webp), ≤5 MB, dimension check, EXIF strip; `product-images/` bucket, admin-write/public-read; never trust filenames.
- **Validation:** keep Contact/Newsletter regex baseline; add server-side (Zod/DB checks): price ≥ 0, orig ≥ price, stock ≥ 0, slug unique, coupon 0–100% + window.
- **Secrets:** `.env` empty/gitignored — correct. New `VITE_SUPABASE_URL` + anon key only (service-role never in Vite); add missing `.env.example`.
- **Errors:** only `Toast` + inline `.err`; admin needs RLS-safe messages + loading/empty states (none exist).
- **Deploy:** default Vite SPA needs fallback rewrites (`/product/:id`, `/admin/*`), env wiring, build gate; add CSP/headers with auth.
- **Confirmed vs potential:** missing auth/RLS/validation = **Confirmed**; XSS/SQLi/CSRF = **potential** (React escapes; `encodeURIComponent` art safe) — re-audit after Supabase lands.

## 14. Missing Requirements and Technical Risks

1. No backend/schema/Storage — build all write targets (mitigate: shared `types.js` + `data.js` seed).
2. No TypeScript — unchecked shapes (mitigate: JSDoc + validation; defer TS migration).
3. No table/modal/form/chart libs — velocity cost (hand-build minimal set; add `recharts`+`zod` when needed).
4. Single-file components/pages — conflicts/testability (new `admin/` split; leave storefront alone).
5. localStorage cart keyed by numeric `id` — breaks on UUIDs (version `ax_cart_v2`, expire old).
6. Denormalized category, single stock, static ratings — schema redesign (variants/images/reviews tables).
7. No tests/lint/CI (add guard + RLS smoke tests pre-launch).
8. **Unknown/inaccessible:** Supabase project, photography, gateway, host — decisions gated on them.

## 15. Phased Implementation Roadmap

- **P1 Architecture & model prep (2–3 d):** freeze JSDoc `types.js`; `data.js` → seed JSON; UUID vs numeric; `.env.example`; auth model. *Test:* seed round-trip. *Risk:* id migration.
- **P2 Schema & security (3–5 d):** tables (categories, products, variants, images, profiles, wishlists, coupons, orders, items, settings), Storage, RLS (anon-read/owner/admin), constraints + totals function. *Test:* policy matrix in SQL.
- **P3 Shell & auth (2–4 d):** `@supabase/supabase-js`, client, `AdminLayout/Routes/Login`, `RequireAdmin`, `admin.css`. *Test:* guard deny incl. direct URL.
- **P4 Products & categories (4–6 d):** `DataTable`, forms, URL filters (copy Shop), status/duplicate. *Test:* CRUD, slug unique, inactive hidden.
- **P5 Images & inventory (3–4 d):** uploader + reorder/cover, variant stock, history. *Test:* type/size reject, race-safe decrement.
- **P6 Orders & customers (4–6 d):** list/detail/status flow, customer detail; real checkout replaces demo. *Test:* E2E totals match server calc.
- **P7 Coupons/reports/settings (3–5 d):** coupons + redemption, revenue charts + CSV, shipping/announcement settings. *Test:* expiry/min-order/double-use.
- **P8 Harden & deploy (3–5 d):** flag-swapped storefront reads, cart-key migration, RLS re-audit, CSP/headers, SPA fallbacks, build gate, runbook.

## 16. Recommended First Implementation Task

**"Freeze catalog contract + seed pack" (no backend writes, no UI changes):**

1. Add `src/admin/types.js` (JSDoc): Category `{slug,name,emoji,a,b}` + Product `{id,name,category,brand,price,orig,rating,reviews,stock,badge,sizes,isNew,best,images,desc,specs}` 1:1 from `data.js:1-53`, marked `frontend-only`.
2. Add `scripts/export-seed.mjs` (no new deps): import `data.js` → emit `seed/categories.json` + `seed/products.json` (strip data-URIs → `image_emoji` + "replace with Storage URLs").
3. Add `.env.example` with empty `VITE_SUPABASE_URL=` / `VITE_SUPABASE_ANON_KEY=`.
4. Acceptance: seed reproduces 8 categories + 16 products; `npm run build` passes; zero diffs to existing `src/`.

*Why first:* unblocks schema design with real data, zero live risk, forces id/slug/stock decisions pre-UI.

## 17. Open Questions and Items Requiring Verification

1. Supabase project — exists? owner? region/plan? (**Unknown**.)
2. ID strategy — numeric vs UUID? (cart keys, URLs, seeds.)
3. Photography — source/license/volume for 16+ × 3 views?
4. Payments — which gateway (Razorpay/Stripe)? key holders?
5. Admin roster — who is `is_admin`? MFA?
6. Order workflow — statuses, 7-day returns enforcement, COD verify?
7. Coupons — honor newsletter 10%? stacking/expiry?
8. Ratings — static vs reviews table?
9. Category visuals — emoji+gradient vs real imagery?
10. Hosting — Vercel/Netlify? fallback + env owner?
11. Build health — `npm run dev/build` never run (audit-only); **Unknown**, run on approval.

---

### Closing summary

- **Architecture:** Vite + React 18 + Router 6 SPA; 7 files; Context + localStorage; hardcoded catalog with SVG art; demo cart/checkout; zero backend/auth/env.
- **Key gaps:** (1) no persistent data/images, (2) no auth/RLS, (3) no orders/customers/coupons, (4) no admin primitives (tables, modals, validated forms, charts), (5) shapes unfit for production (denormalized category, single stock, static ratings).
- **Next step:** §16 seed-contract task → Phase 2 schema + RLS → then admin UI. **Stopped here awaiting approval; nothing implemented, installed, or migrated.**

