# raycast-homeloom

A Raycast extension for [Homeloom](https://github.com/mariusgassen/homeloom), the private household app. The person building it is Marius; he often writes in German.

## How it talks to Homeloom

- Only through Homeloom's MCP endpoint (`POST {url}/mcp`, stateless streamable HTTP) with a personal key (`hlp_…`) as `Authorization: Bearer`. The key is made in Homeloom under Settings › Other apps (access: tools) and acts as that member in one household.
- The REST API (`/v1`) takes only authentik tokens or the session cookie, so this extension can't use it. Moving to authentik OAuth (Raycast PKCE, public provider, client ID in `OIDC_CLIENT_IDS`) would unlock the assistant chat; not done on purpose.
- Tools used: `list_entries`, `add_reminder`, `add_note`, `complete_reminder`, `list_shopping`, `add_to_shopping_list`. Their schemas live in `apps/api/internal/core/service/assistant_tools.go` in the Homeloom repo. Read it before adding a command; it is the contract.
- Everything goes through `src/lib/homeloom.ts`. Commands never call `fetch`.
- Never log or show the key or note bodies.

## Layout

- `src/*.tsx`: one file per command (`today`, `add-reminder`, `add-note`, `shopping-list`). Commands are declared in `package.json`.
- `src/lib/`: the client and helpers. `src/i18n/locales.ts`: copy in English and German; English is the fallback and a test fails if the key sets differ.

## Commands

```sh
npm run dev        # Raycast develop mode
npm run lint       # ray lint (also checks the store author; needs network)
npm run typecheck
npm test
npm run build
```

CI runs ESLint, Prettier, typecheck, tests and build.

## Rules

- Copy is short and warm; German uses informal "du". Don't name the tools behind Homeloom (no "Mealie").
- Use current versions; Dependabot keeps them there. `typescript` stays below 6.1 until `@raycast/eslint-config` allows more.
- Commits and PR titles are Conventional Commits (`feat: …`, `fix: …`, `chore: …`); a workflow checks the PR title. Releases go to the Raycast Store through its own repo, not release-please.
- `README.md` and `README.de.md` are kept in sync.
