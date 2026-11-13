# Homeloom für Raycast

Erinnerungen, Notizen und die Einkaufsliste deines [Homeloom](https://github.com/mariusgassen/homeloom)-Haushalts, direkt in Raycast. [English](README.md)

## Befehle

- **Today** (Heute): fällige Erinnerungen und Termine; Erinnerungen abhaken.
- **Add Reminder**: Text, optional Fälligkeit, nur du oder geteilt.
- **Add Event**: Titel, Beginn und optional Ende, oder ganztägig.
- **Add Note**: Markdown, nur du oder geteilt.
- **Notes**: deine Notizen lesen und bearbeiten.
- **Shopping List**: die gemeinsame Liste ansehen und Dinge eintippen, abhaken.
- **Ask Assistant**: eine Frage zu deinem Haushalt stellen und nachfragen.

## Einrichten

1. Trag in deinem Anmeldedienst (authentik) beim Provider, den Homeloom nutzt, die Weiterleitungs-URI `https://raycast.com/redirect?packageName=Extension` ein.
2. Öffne in Raycast einen Homeloom-Befehl und trage deine Homeloom-Adresse, die Anmeldeadresse des Providers (sein OpenID Configuration Issuer) sowie Client-ID und Secret ein.
3. Der erste Befehl öffnet ein Browserfenster zum Anmelden. Danach bleibst du angemeldet.

Du handelst als du selbst, mit denselben Regeln wie in der App. Das Client-Secret liegt in den Raycast-Einstellungen.

## Entwickeln

```sh
npm install
npm run dev
```

Die Erweiterung spricht mit der REST-API von Homeloom (`/v1`). Siehe `CLAUDE.md`.

## Lizenz

MIT
