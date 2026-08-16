# Handoff — Acadia trip plan site

Context for continuing this work in Claude Code. Written 16 Aug 2026.

## What this is

A single-page, self-contained HTML trip plan for **Acadia National Park, 8–11 October 2026**,
for two adults and a three-year-old. It exists in two places:

1. A **Cowork artifact** (`acadia-toddler-oct-2026`) — the private version, with booking details.
2. A **deployable repo** — the public version, booking details stripped.

The immediate task is getting the repo onto GitHub and deployed to Railway.

---

## State right now

| Piece | Status |
|---|---|
| `index.html` (public, scrubbed) | Done, smoke-tested |
| `server.js`, `package.json`, `railway.json`, README, `.gitignore` | Done |
| Local git repo, one commit on `main` | Done — never pushed |
| GitHub repo `nsacheri/acadia-trip-plan` | **Blocked / not created** |
| Railway project | Created, empty, waiting |
| Railway service + deploy + domain | **Not started** — needs the repo |

### The GitHub blocker

The Cowork sandbox routes git through a proxy that only injects credentials for repos in the
session's authorized set. `nsacheri/acadia-trip-plan` is not in it, and no `add_repo` tool was
available. Both `api.github.com` writes and `git push` return 403. **This is a sandbox boundary,
not an account permission problem** — from a normal Claude Code session with the user's own
`gh` auth, this should just work.

Verify first: `gh auth status` and `gh repo view nsacheri/acadia-trip-plan`.

### Railway identifiers

```
workspace   fdd20f90-056c-48d1-a288-c85a8e9683b5   (nicoduo's Projects, personal)
project     68e67fc9-b088-49d4-8d18-5fcf0bd3f76f   (acadia-trip-plan)
environment 5d9cf4b0-4150-4561-ba1d-0c1bfeff1aaf   (production)
account     nicoduo / nico@duolingo.com
```

Railway MCP connector is connected. The deploy path is `create-deployment` with
`repo: "nsacheri/acadia-trip-plan"`, `branch: "main"`, then `generate-domain`.
Railway needs GitHub access to the repo before it can pull — if the user granted only selected
repos, this one must be added.

---

## Next steps, in order

1. `gh repo create nsacheri/acadia-trip-plan --public --source=. --push` from the repo directory.
   The commit is already made, on `main`, authored as Nico with Claude co-authored.
2. Confirm Railway has GitHub access to the repo.
3. Railway MCP: `create-deployment` → poll `get-status` / `list-deployments` → `generate-domain`.
4. If the build fails, `get-logs` with `types: ["build","deploy"]`.

---

## Repo layout and why

```
index.html      the whole site — 202 KB, fully self-contained
server.js       ~50-line zero-dependency Node http server
package.json    no deps; start script only; engines node >=18
railway.json    Nixpacks, `node server.js`, healthcheck /healthz
README.md
.gitignore
```

**Zero dependencies is deliberate** — no install step, no supply chain, fast builds. `server.js`
reads `index.html` once at boot, pre-gzips it, serves with an ETag, and handles `SIGTERM` so
redeploys don't drop requests. Verified locally: 200 on `/`, 200 on `/healthz`, 208 KB raw →
62 KB gzipped, 304 on `If-None-Match`.

**Leaflet 1.9.4 is inlined** into `index.html` (BSD-2-Clause, attribution comment retained)
rather than loaded from a CDN. The Cowork artifact sandbox blocked cdnjs. The only remaining
network dependency at view time is CARTO basemap tiles — those were blocked in the sandbox too
but work fine in a normal browser. If tiles ever need to go away entirely, there is a proven
fallback: `@geo-maps/earth-coastlines-500m` on npm has usable Mount Desert Island geometry
(clip to bbox, project to Web Mercator, emit SVG paths — ~26 KB, renders Somes Sound correctly).

---

## Design decisions worth not re-litigating

**Three categorical colours, not more.** Map markers are an all-pairs colour problem (any marker
can sit beside any other), and the validated palette only clears all-pairs floors for its first
three slots. So: Friday `#2a78d6`, Saturday `#eb6834`, travel days `#1baf7a` (dark-mode steps
`#3987e5` / `#d95926` / `#199e70`). Validated with the dataviz skill's
`scripts/validate_palette.js` against surfaces `#ffffff` and `#1C2126` — all checks pass except
a light-mode contrast WARN on the aqua, which is relieved by visible numeric labels plus the
full table view underneath.

**Thursday and Sunday share one colour** because they are literally the same drive in both
directions.

**Lodging and optional stops use shape, not new hues** — dark square for lodging, hollow ring
for optional. Add-ons from the toggle keep their *day's* colour and get a dashed ring + `+`, so
you can see which day they'd slot into.

**Default map view is Mount Desert Island only.** Portland, Bangor and Ellsworth carry `far:true`
and sit off-frame until you filter to them or hit "Zoom out to Portland" — at full extent the
island collapses to a dot.

---

## Trip facts (researched; don't redo)

**Flights — Breeze, confirmation in the private artifact only.**
PIT 12:44 → PWM 2:20 pm Thu 8 Oct (MX1448). PWM 3:05 → PIT 5:07 pm Sun 11 Oct (MX2866).
Carry-on only, no checked bags.

**The central constraint:** Portland to the island is ~2h40 (Ellsworth) or ~3h20 (Seal Cove).
Arrival lands after Thursday's 6:00 pm sunset; Sunday needs a ~9:45 am departure. **Only Friday
and Saturday are usable.**

**Dates fall on the Indigenous Peoples'/Columbus Day weekend** (Monday 12 Oct) — busiest fall
weekend on the island. Friday is materially quieter than Saturday.

**Tides** (NOAA station 8413320, Bar Harbor, EDT). Afternoon lows: Thu 3:47 pm, Fri 4:37 pm,
Sat 5:23 pm, Sun 6:06 pm. Every morning low is pre-dawn. Ship Harbor and Wonderland only work
within ~90 min of low tide, so **Saturday ~4:00–5:45 pm is the only usable tide-pool window**
the flight schedule leaves.

**Sun** (44.39°N, 68.20°W, EDT): Fri rise 6:40 / set 5:58. Sat 6:41 / 5:56.

**Cadillac Summit Road** needs a $6 timed reservation (system runs 20 May – 25 Oct 2026).
30% released 90 days ahead (gone — that was July), 70% at **10:00 am ET two days before**.
Relevant drops: Wed 7 Oct for Friday, Thu 8 Oct for Saturday — the second falls while they're
at the departure gate at PIT. Recommendation is a daytime slot, not sunset.

**Island Explorer shuttle** runs through 12 Oct 2026 but serves **neither** candidate base —
the Tremont route (11) stops at Bass Harbor and Bernard, not Seal Cove; the Trenton route (9)
stops at the airport, not Ellsworth.

**Bar Island land bridge** is crossable 1.5 h either side of low tide → **Fri 3:07–6:07 pm**.
Half a mile across the sea bed from downtown Bar Harbor. Miss it and it's a nine-hour wait.

**Lodging is undecided**: Seal Cove (on-island, Tremont) vs Ellsworth (mainland). Total driving
comes out ~8h30 either way — Seal Cove is closer to the park, Ellsworth closer to Portland, and
they cancel. The real trade is a cottage with a kitchen versus a hotel with an indoor pool.
Southwest Harbor was flagged as an unpriced middle option. **Not booked as of this writing.**

**Bikes**: a friend who lives in Maine is joining with gear, and the child rides in a
front-mounted seat — so no rental logistics. Carriage roads exist only east of Somes Sound.
Gentlest loop is Witch Hole Pond from Duck Brook (3.3 mi); Little Long Pond at Seal Harbor is
the nearest easy riding to Seal Cove.

### Unverified — worth a call before the trip

- Jordan Pond House October hours (popovers are the Friday lunch plan)
- Thurston's Lobster Pound closing date — "mid-October", right at the edge
- Seal Cove Auto Museum October hours — the primary rain plan from Seal Cove
- Bass Harbor Head Light 2026 parking rules (NPS page last updated 2021)

---

## What was stripped from the public copy

Removed from `index.html` in the repo, still present in the Cowork artifact:

- Breeze confirmation code (header + footer source link)
- Seat numbers (both directions)
- All three first names (header subtitle and the Thursday timeline)
- The Gmail deep link to the booking email

Flight times and flight numbers were **kept** — the plan is unreadable without them, and they're
inert without a name attached. If you regenerate `index.html` from the artifact, re-apply these
four edits and re-assert that none of `N8M8VW`, `24D/E/F`, `26D`, the names, or `mail.google.com`
survive.

---

## Sources

- [Cadillac Summit reservations — NPS](https://www.nps.gov/acad/planyourvisit/vehicle_reservations.htm)
- [Island Explorer](https://www.exploreacadia.com/) · [route 11 Tremont](https://www.exploreacadia.com/route11.html) · [route 9 Trenton](https://www.exploreacadia.com/route9.html)
- [NOAA tide predictions, station 8413320](https://tidesandcurrents.noaa.gov/stationhome.html?id=8413320)
- [Bar Island fast facts — NPS](https://www.nps.gov/articles/000/bar-island-fast-facts.htm)
- [Carriage roads — NPS](https://www.nps.gov/acad/planyourvisit/carriage-roads.htm)
- [Bass Harbor Head Light — NPS](https://www.nps.gov/acad/planyourvisit/bass-harbor-head-light-station.htm)
- [Southwest Cycle](https://southwestcycle.com/rent/) · [Thurston's](https://www.thurstonforlobster.com/)
