# Homeloom für Raycast

Erinnerungen, Notizen und die Einkaufsliste deines [Homeloom](https://github.com/mariusgassen/homeloom)-Haushalts, direkt in Raycast. [English](README.md)

## Befehle

- **Today** (Heute): fällige Erinnerungen und Termine; Erinnerungen abhaken.
- **Add Reminder**: Text, optional Fälligkeit, nur du oder geteilt.
- **Add Note**: Markdown, nur du oder geteilt.
- **Shopping List**: die gemeinsame Liste ansehen und Dinge eintippen.

## Einrichten

1. Öffne in Homeloom **Einstellungen › Andere Apps** und erstelle einen Schlüssel mit Zugriff auf Werkzeuge.
2. Öffne in Raycast einen Homeloom-Befehl und trage deine Homeloom-Adresse und den Schlüssel ein.

Der Schlüssel handelt als du in einem Haushalt und gilt, bis du ihn in Homeloom löschst. Er liegt in den Raycast-Einstellungen.

## Entwickeln

```sh
npm install
npm run dev
```

Die Erweiterung spricht nur mit dem `/mcp`-Endpunkt von Homeloom. Siehe `CLAUDE.md`.

## Lizenz

MIT
