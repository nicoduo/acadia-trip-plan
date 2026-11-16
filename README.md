# Acadia trip plan — 8–11 October 2026

A single-page, self-contained trip plan for Acadia National Park with a three-year-old,
built around a Thursday-afternoon arrival at Portland (PWM) and a Sunday-afternoon departure.

**The premise:** the flights leave exactly two usable days — Friday and Saturday — so the
plan treats those as the whole trip rather than pretending it's a long weekend.

## What's in it

- **Interactive map** of all 23 stops, colour-coded by day. Friday's east-side cluster and
  Saturday's west-side cluster sit on opposite corners of the island, which is the plan's
  central constraint made visible.
- **A Neither / Add hikes / Add bike ride toggle** that adds optional stops to both the map
  and the list, and states what each option costs you. Add-ons keep their day's colour and
  carry a dashed ring, so you can see where they'd slot in.
- **Tide and daylight tables** for the actual dates. Tide pooling at Ship Harbor only works
  within ~90 minutes of low tide, and exactly one usable window survives the flight schedule.
- **Cadillac Summit reservation drop times** — the $6 timed-entry slots release at 10:00 ET
  two days ahead, and one of those mornings falls while you're at the departure gate.
- **A Seal Cove vs Ellsworth comparison** showing the total driving comes out about even,
  so the choice rests on what the lodging itself gives you rather than proximity.

## Running it

```bash
npm start          # http://localhost:3000
```

No dependencies. `server.js` is a ~50-line Node http server that reads `index.html` once at
boot, pre-gzips it, and serves it with an ETag. `index.html` is fully self-contained —
Leaflet is inlined, so the only network request at view time is for map background tiles.

## Deploying

Configured for Railway via `railway.json` (Nixpacks, `node server.js`, health check at
`/healthz`). It will run unmodified anywhere that sets `PORT` — Render, Fly, Heroku, Cloud Run.

## A note on the data

Tide predictions are NOAA station 8413320 (Bar Harbor). Sunrise and sunset are computed for
44.39°N, 68.20°W in Eastern Daylight Time. Drive times are off-peak estimates — the Sunday
departure deliberately carries extra margin, because Route 1 through Ellsworth backs up on
holiday weekends and the return ticket is non-refundable.

Personal booking details have been removed from this public copy.

## Sources

- [Cadillac Summit Road vehicle reservations — NPS](https://www.nps.gov/acad/planyourvisit/vehicle_reservations.htm)
- [Island Explorer shuttle](https://www.exploreacadia.com/)
- [NOAA tide predictions, Bar Harbor](https://tidesandcurrents.noaa.gov/stationhome.html?id=8413320)
- [Bar Island fast facts — NPS](https://www.nps.gov/articles/000/bar-island-fast-facts.htm)
- [Carriage roads — NPS](https://www.nps.gov/acad/planyourvisit/carriage-roads.htm)
