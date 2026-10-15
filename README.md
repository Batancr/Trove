# Trove

A marketplace for buying and selling anything, starting with a few sellers (the first mostly sells antiques). Buyers' money is held until the item is in their hands, and sellers only ship once payment is confirmed. The outline and diagrams are in `../../marketplace/`.

**Status: Phase 0 demo.** Everything works in the browser, but nothing is charged and data is saved only in that browser's localStorage. Real payments, accounts and email need a backend (next steps in `PROCESS.md`).

## What's in the demo
- **Browse and search.** Plain-language search ("brass under $40", "1950s toys pickup") pulls out price, decade and pickup filters. Searches with no results lead to the Wanted list.
- **Antique-honest listings.** Each listing has a condition scale, a required flaws field, measurements, and an age marked as estimated, confirmed or unknown. There's public Q&A on every listing.
- **Cart with combined shipping.** Items are packed into small, medium and large boxes, and the cart says how many more small items fit at no extra shipping. Card orders start at $5; cheaper finds can be picked up and paid in person.
- **Three ways to get it.** Ship, meet up, or local delivery. Meetups and deliveries use a 6-digit handoff code: the buyer checks the item, then reads the code to the seller, which releases the money (or confirms payment in person).
- **Order engine.** One record per order, with every change logged: paid and held → shipped → delivered → released, plus refunds, problems, cancellations and no-shows. Time rules run automatically: no shipment in 3 days means a refund, delivered plus 3 quiet days means release, no delivery scan in 14 days becomes a problem, and a missed meetup cancels after 2 days. The demo bar's "Skip ahead 1 day" button shows these in action.
- **Alerts.** "Essentials only" or "Every step", for buyers and sellers separately.
- **Colour drafts.** "Colours" in the demo bar switches background and button colours to compare options.
- **No fees.** Trove takes nothing, and during launch it also pays the card processing (`CONFIG.trovePaysCardFee`).
- **Front page and tour.** Four tappable feature tiles (pay safely, meet with a code, sell in a minute, seller dashboard) and a short tour that runs on the first visit. Menu, Take the tour runs it again.
- **Buyer tools.** A Browse menu in the header holds types, price ranges and pickup; home shows everything grouped by type, a compact grid option to see more at once, Recently viewed, and Share links for WeChat, RedNote or Facebook.
- **Seller dashboard.** To do (key numbers on top, then orders by deadline), Schedule (two-week meetup calendar plus ship-by dates), Listings (grouped by type; "Add many at once" turns a batch of photos into drafts), Interest (questions to answer, then views, saves, questions and carts per item, with buyer names), Money (weekly sales chart, held, released, fees, true profit, CSV for your accountant), Insights (best categories, most watched, what buyers want) and Profile. Shop pages are split into sections by type.
- **Policies.** Drafts of the terms, returns, privacy, cookies and about pages, each marked for you to complete. Marketing emails are opt-in, and buyers can download or delete their data.

## Layout
- `docs/`: the whole site (GitHub Pages can serve main /docs).
  - `logic.js`: pure rules (order engine, shipping, search, money, alerts, CSV). No DOM.
  - `store.js`: where data lives. This is the only file that changes when a real database is added.
  - `app.js`: the page.
  - `samples.js`: sample sellers, listings and line drawings.
  - `i18n.js`: Simplified Chinese wording (switch in Menu or Settings).
- `tests/logic.test.js`: run with `node tests/logic.test.js` (66 tests).
- `tools/build_preview.py`: builds one HTML file for the Claude artifact preview.

## Settings to check before going live
`CONFIG` at the top of `docs/logic.js` holds placeholder numbers: the card fee (2.9% + 30¢), box rates ($12 / $18 / $32), the local delivery fee ($8), the $5 card minimum, the deadlines, and tax (0%, assuming you're under the GST/HST small supplier threshold). Check each against current Stripe pricing, Canada Post rates and the CRA.
