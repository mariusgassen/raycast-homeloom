# Homeloom for Raycast

Reminders, notes and the shopping list of your [Homeloom](https://github.com/mariusgassen/homeloom) household, from Raycast. [Deutsch](README.de.md)

## Commands

- **Today**: reminders and events that are due; mark a reminder done.
- **Add Reminder**: text, optional due time, just you or shared.
- **Add Note**: Markdown, just you or shared.
- **Shopping List**: see the shared list and add items by typing.

## Set up

1. In Homeloom open **Settings › Other apps** and make a key for **Assistant**. Calendar and Notes keys are passwords for other apps and don't work here.
2. In Raycast, open any Homeloom command and enter your Homeloom address and the key.

The key acts as you in one household and works until you delete it in Homeloom. It is stored in Raycast's preferences.

## Develop

```sh
npm install
npm run dev
```

The extension talks to Homeloom's `/mcp` endpoint only. See `CLAUDE.md`.

## Licence

MIT
