# Homeloom for Raycast

Reminders, notes and the shopping list of your [Homeloom](https://github.com/mariusgassen/homeloom) household, from Raycast. [Deutsch](README.de.md)

## Commands

- **Today**: reminders and events that are due; mark a reminder done.
- **Add Reminder**: text, optional due time, just you or shared.
- **Add Event**: title, start and optional end, or all day.
- **Add Note**: Markdown, just you or shared.
- **Add Expense**: an amount, a category and who paid, split evenly.
- **Money**: who owes whom, and settle up.
- **Chores**: what is still to do, tick it off.
- **Add Chore**: a title, the effort and how often it repeats.
- **Notes**: read your notes and edit them.
- **Shopping List**: see the shared list and add items by typing, tick them off.
- **Ask Assistant**: ask a question about your household and ask more.

## Set up

1. In your sign-in provider (authentik), add the redirect URI `https://raycast.com/redirect?packageName=Extension` to the provider Homeloom uses.
2. In Raycast, open any Homeloom command and enter your Homeloom address, the provider's sign-in address (its OpenID Configuration Issuer), and its client ID and secret.
3. The first command opens a browser window to sign in. After that it stays signed in.

You act as yourself, with the same rules as in the app. The client secret is stored in Raycast's preferences.

## Develop

```sh
npm install
npm run dev
```

The extension talks to Homeloom's REST API (`/v1`). See `CLAUDE.md`.

## Licence

MIT
