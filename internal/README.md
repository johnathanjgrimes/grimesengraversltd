# Grimes internal hub

Internal tools and processes for Grimes Engravers. Not part of the public website.

## Open the hub

```bash
cd ~/code/grimesengraversltd
python3 scripts/dashboard.py            # http://hub.grimes.test (or http://localhost:8765)
python3 scripts/dashboard.py --set-password   # one-off, before sharing it beyond this Mac
```

## Local nicknames

| Type | Goes to |
|---|---|
| http://grimes.test | The website running locally (`npm run dev` or `npm run preview`) |
| http://hub.grimes.test | The internal hub |

One-off setup: add `127.0.0.1 grimes.test hub.grimes.test` to `/etc/hosts`, `brew install caddy`, then
`caddy start --config internal/Caddyfile` (stop with `caddy stop`).

## What's where

| Folder | What | In Git? |
|---|---|---|
| `internal/processes/` | How we do things (these guides). Edit them like any file. | Yes |
| `scripts/` | The hub and tools: `dashboard.py`, `proof.py`, `plaque_proof.py`, `fetch-templates.sh` | Yes |
| `supplier-templates/` | Crystal Galleries engraving templates (`./scripts/fetch-templates.sh`) | No (ignored) |
| `proofs/` | Proofs made in the hub | No (ignored) |
| `private/` | Outreach list, PostHog key, hub password | No (ignored) |
| `fonts/` | Engraving fonts for plaque proofs (downloaded automatically) | No (ignored) |

Rules of thumb: no customer details, passwords or keys in `internal/` (it's committed). Those go in `private/`.

## Adding a process

Create a Markdown file in `internal/processes/`, e.g. `refunds.md`, starting with a `# Title` line.
It appears in the hub's **Processes** tab automatically, in file-name order (prefix with `01-`, `02-` to order them).
