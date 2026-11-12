# Roadmap: status.eurth.org

This fork of [UptimeFlare](https://github.com/lyc8503/UptimeFlare) runs the Eurth status page. There are no tagged releases: every pull request merged to `main` deploys straight to Cloudflare, so each section below is a day of merged work, newest first. Add to it in the same pull request as the change.

## Next

- Disconnect the Cloudflare "Workers Builds" Git integration for the `eurth-status` worker. It fails on every commit (it runs `wrangler deploy` from the repo root, which has no entry point) and is not what deploys the site; the GitHub Action does. Needs a Cloudflare dashboard sign-in.
- Outage notifications: the webhook in `uptime.config.ts` is still the example Telegram placeholder, so no alerts go anywhere yet.
- Pick from the aviation ideas list (arrivals board, annunciator panel, NOTAM format, ATIS audio and more), proposed on 2026-10-30.

## 2026-11-12

- Monitor flag.eurth.org (Flagwright, the flag maker) as `FLG005` in the mainline fleet.
- Flip cards sit three to a row (two below 1040 px); a "vacant stand" card fills out the last row until the next site arrives.
- Search title and description no longer list the sites one by one, so they stay right as sites are added.
- This roadmap.

## 2026-10-30

- Share card, SEO title and description in the server-rendered head; dark radar share image; animated radar favicon (#8).
- The radar beside the wordmark, the nav icons and the "On time" clocks really animate (background images instead of CSS masks); static dish on the radar panel (#7).
- Departure Mono for all monospace text; animated line-md icons; ticking clocks for "On time"; a drawn radar sweep icon; day bars that rise like piano keys under the pointer; lightning over red days and rain clouds over amber ones; radar data blocks that never overlap; even 14 px gaps (#6).
- Radar icon by the wordmark, compact tower report with live readouts, aligned columns, full-width fleet groups, propeller plane for the heritage fleet (#5).
- Tower console: radar centred on EBAW, split-flap cards, ATIS ticker, clocks and transponder, departures board; gov.eurth.org monitor; NOTAMs, Hangar, Terminal and Call the tower in the header; glowing latency traces with streaming packets; Mainline and Heritage fleets; aviation wording (#4).

## 2026-10-29

- Synced with upstream UptimeFlare; the Upstream Sync workflow now merges instead of replacing every file.
- Core and legacy monitor groups; every outgoing link tagged `?ref=status.eurth.org`; "Report a problem" opens a GitHub issue instead of an email.
- First dark "Mission Control" theme: Barlow Condensed and IBM Plex, bezel panels, amber status bar (#3).

## 2026-10-25 to 2026-10-26

- Deploy targets the renamed `eurth-status` worker (#1).
- Fixed double `https://` in the map and news links (#2).

## 2026-05-21 to 2026-09-29

- Forked UptimeFlare and configured the Eurth monitors: eurth.org, map.eurth.org, news.eurth.org and europans.com, checked from Western Europe.
- Renamed the project from `uptimeflare` to `eurth-status`; custom favicon.

## Not planned

- **Squash merges.** The fork merges upstream UptimeFlare history; squashing pull requests would cut that link and make every later upstream sync conflict.
- **New npm dependencies for icons or fonts.** Upstream changes `package.json` and its lock file, so extra dependencies mean merge conflicts. Font Awesome Free and line-md icons are copied in; Departure Mono is a bundled file.
- **Font Awesome Pro icons**, such as its propeller plane. It needs a paid licence, so the heritage fleet's plane is drawn instead.
- **Fonts from Google at page load.** Fonts are self-hosted through `next/font`, so visitors make no requests to Google.
- **Editing upstream components directly.** Eurth changes live in `components/eurth/` and `styles/eurth.*`, with only small marked lines in upstream files, to keep upstream merges clean.
