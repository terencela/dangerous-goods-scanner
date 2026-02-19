# ZRH Baggage Checker (Expanded Prototype)

This is a mobile-first single-page app prototype for checking whether travel items are allowed in hand baggage and checked baggage for Zurich Airport departures.

## What's included

- **State-driven multi-screen flow**: Home → Camera → Item Identification → Question Wizard → Result → History detail.
- **Camera integration** via `getUserMedia` with optional skip/fallback.
- **Rule-backed categories and dynamic questions** held in an in-app DB-like structure (`item_categories`, `item_questions`, source links).
- **Deterministic rules engine** with battery Wh calculation (`Wh = mAh × V / 1000`) and category-specific logic.
- **Clear verdict cards** for hand and checked baggage with condition text, tips, and decision facts.
- **Saved scan history** with detailed per-scan review and delete capability.

## Run locally

Because this app uses browser camera APIs and JSX via Babel CDN, run through a local server:

```bash
python3 -m http.server 4173
```

Then open `http://127.0.0.1:4173`.

## Source scope

Rules encoded are based on the Zurich Airport pages provided in the prompt:
- https://www.flughafen-zuerich.ch/en/passengers/fly/all-about-the-flight/what-is-allowed-in-your-bag
- https://www.flughafen-zuerich.ch/en/passengers/fly/all-about-the-flight/security-check
- https://www.flughafen-zuerich.ch/en/passengers/fly/all-about-the-flight/security-check/batterien

Always verify latest airport + airline policies before travel.
