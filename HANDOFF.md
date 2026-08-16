# Handoff — Acadia trip plan site

Context for continuing this work in Claude Code. Written 16 Aug 2026, revised the same evening
after the repo was pushed.

## What this is

A single-page, self-contained HTML trip plan for **Acadia National Park, 8–11 October 2026**,
for two adults and a three-year-old. It exists in two places:

1. A **Cowork artifact** (`acadia-toddler-oct-2026`) — the private version, with booking details.
2. A **deployable repo** — the public version, booking details stripped.

**The site is live: https://acadia-trip-plan-production.up.railway.app**

Repo on GitHub, deployed to Railway, tiles confirmed rendering. Nothing is blocking.

---

## State right now

| Piece | Status |
|---|---|
| `index.html` (public, scrubbed) | Done, smoke-tested |
| `server.js`, `package.json`, `railway.json`, README, `.gitignore` | Done |
| Local git repo, two commits on `main` | Done |
| GitHub repo [`nicoduo/acadia-trip-plan`](https://github.com/nicoduo/acadia-trip-plan) | **Done** — public, pushed 16 Aug 2026 |
| Railway project | Linked (`railway link -p 68e67fc9… -e 5d9cf4b0…`) |
| Railway service + deploy + domain | **Done** — service `acadia-trip-plan` ● Online, domain generated |

### The GitHub blocker — resolved, and the original diagnosis was wrong

The earlier version of this doc blamed the 403s on the Cowork sandbox's git proxy and predicted
that a normal Claude Code session with the user's own `gh` auth would "just work". **That was
wrong, and it would have sent the next session down the same dead end.**

The real cause: the local `gh` is authenticated as **`nicoduo`** (member of the `duolingo` org).
**`nsacheri` is a separate personal GitHub user account**, not an org and not something `nicoduo`
can create repos under. `gh repo create nsacheri/…` fails from a normal machine too — different
error, same wall. The sandbox proxy may also have been a factor, but it was never the only one.

Resolved by creating the repo under the authenticated account instead:

```
gh repo create nicoduo/acadia-trip-plan --public --source=. --push
```

Note this puts a personal trip page on the Duolingo-associated GitHub account. Consistent with
Railway (also nico@duolingo.com), but worth a conscious re-decision if the site outlives the trip.
To move it to `nsacheri` later, authenticate as that account (`gh auth login`) and re-push, or
transfer the repo from GitHub's settings page.

### Verified on a real machine, 16 Aug 2026

Re-checked outside the sandbox rather than trusted from the earlier notes:

- **Scrub is clean.** No `N8M8VW`, no `24D/E/F` or `26D`, no first names, no `mail.google.com`
  anywhere in `index.html`.
- **Server works.** `/` → 200 (207,892 bytes), `/healthz` → 200, gzip → 61,457 bytes.
- Node v26.5.1, Railway CLI 5.31.0, both present locally.

And again against production once deployed:

- `/healthz` → 200, `/` → 200 in 0.3 s, **byte-identical to local** (207,892 raw / 61,457 gzipped).
- Security headers survive the proxy: `x-content-type-options: nosniff`, `referrer-policy:
  no-referrer`, `cache-control: public, max-age=300`, ETag intact. HTTP/2 via `railway-hikari`.
- **CARTO basemap tiles render — the long-standing unknown is closed.** 12/12 tiles fetched from
  `basemaps.cartocdn.com` and decoded at 512×512, 23 markers placed, Leaflet 1.9.4. The
  `@geo-maps` offline fallback documented below is **not needed**; leave it as insurance only.
- Scrub re-verified on the live page: header reads "two adults and a three-year-old", no names,
  no confirmation code.

### Railway identifiers

```
workspace   fdd20f90-056c-48d1-a288-c85a8e9683b5   (nicoduo's Projects, personal)
project     68e67fc9-b088-49d4-8d18-5fcf0bd3f76f   (acadia-trip-plan)
environment 5d9cf4b0-4150-4561-ba1d-0c1bfeff1aaf   (production)
account     nicoduo / nico@duolingo.com
```

**The Railway MCP connector is not available in a plain Claude Code session** — it was a Cowork
connector. Don't plan around `create-deployment` / `generate-domain` / `get-logs` unless you can
confirm those tools are actually loaded. The Railway **CLI** is installed locally (5.31.0, logged
in as nico@duolingo.com) and covers the same ground.

Two deploy paths, pick one:

- **From GitHub** (keeps push-to-redeploy): connect `nicoduo/acadia-trip-plan` to the project in
  the Railway dashboard. If the GitHub app was granted only selected repos, add this one.
- **From local** (fastest, no GitHub coupling): `railway link` to project
  `68e67fc9-b088-49d4-8d18-5fcf0bd3f76f`, then `railway up`.

---

## Next steps, in order

Deployment is finished. All of the following are done:

1. ~~Create the GitHub repo~~ — `nicoduo/acadia-trip-plan`, public.
2. ~~Link the Railway project~~ — production environment.
3. ~~Deploy~~ — `railway up --ci -y`. Nixpacks, Node, zero deps, ~90 s. The
   `UndefinedVar: $NIXPACKS_PATH` line in the build log is a **Nixpacks base-image warning, not an
   error** — it appears on every build and the deploy succeeds regardless. Don't chase it.
4. ~~Generate a domain and confirm tiles render~~ — both good, see above.

**Redeploy** after editing `index.html`: `railway up --ci -y` from the repo directory. The GitHub
repo is *not* wired to Railway as a deploy source — pushing to `main` alone will **not** redeploy.
Either always deploy via the CLI, or connect the repo in the Railway dashboard to get
push-to-deploy. Right now git and the live site can drift apart silently; that's the one trap left.

If a future build fails: `railway logs --build`.

### Left deliberately undone

- **`railway setup agent`** — the CLI suggests installing Railway's MCP server and skills into the
  session. Not run; it changes local agent config and nothing here needed it.
- **CLI upgrade** — 5.31.0 installed, 5.41.2 available. Not upgraded mid-deploy.

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
