# raycast-homeloom

A Raycast extension for [Homeloom](https://github.com/mariusgassen/homeloom), the private household app. The person building it is Marius; he often writes in German.

## How it talks to Homeloom

- Through Homeloom's REST API (`{url}/v1`, contract in `apps/api/api/openapi.yaml` in the Homeloom repo; read it before adding a command), as the signed-in person. The extension is not an assistant, so it does not use the MCP endpoint.
- Sign-in is authentik OAuth with PKCE (`src/lib/auth.ts`). It reuses Homeloom's own authentik client: its client ID and secret are preferences, the redirect URI `https://raycast.com/redirect?packageName=Extension` is added to that provider, and the API needs no change. The issuer is a preference too (discovery from it).
- The household is the person's first one, cached in LocalStorage.
- Everything goes through `src/lib/homeloom.ts`. Commands never call `fetch`.
- Never log or show the client secret, tokens or note bodies.

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
