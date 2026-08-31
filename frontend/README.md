# Vroomfondel — Erster Mockup-Screen

Menüpunkt 1 (Einstieg / Projekt-Intention) aus dem Struktur-Schema, als unverkabeltes High-Fidelity-Mockup. Kein Backend, kein Modell, keine echte Logik — nur die Oberfläche.

## Lokal starten (in VS Codium / VS Code)

```bash
npm install
npm run dev
```

Danach im Browser die angezeigte Adresse öffnen (üblicherweise `http://localhost:5173`).

## Was hier passiert

- Klick auf "Arbeitsraum betreten" — nötig wegen der Autoplay-Sperre der Browser, die automatische Sprachausgabe ohne vorherige Nutzerinteraktion verhindert. Passt konzeptionell auch gut: man "betritt" den Arbeitsraum aktiv.
- JARVIS begrüßt danach per Browser-eigener Sprachausgabe (`SpeechSynthesis`) und der Begrüßungstext baut sich synchron dazu auf.
- Zwei blasse, unverkabelte Module (Archive, Analysis) deuten die spätere Arbeitsumgebung an, ohne Aufmerksamkeit von JARVIS abzuziehen.

## Bewusst nicht enthalten (siehe Architecture Contract)

Kein Backend, kein State Management, keine echte KI-Sprachengine, kein Dragging, keine Persistenz, kein React Flow / Canvas-Interaktion — das kommt erst, wenn der Kern (Phase 1) steht.

## Falls die Systemstimme schlecht klingt

Das ist ein legitimes Ergebnis dieses Tests, kein Bug — dann wissen wir früh, dass die Sprachschicht später ersetzt werden muss (z. B. durch eine bessere TTS-Engine), ohne dass sich sonst etwas an der Architektur ändert.
