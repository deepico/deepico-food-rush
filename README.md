# Deepico Food Rush 🏭🍎

Arcade-Sortier-Spiel im Browser. Lebensmittel fallen von oben – fange die richtigen Items, um Bestellungen zu erfüllen!

## Setup

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
# Output in /dist
```

## ERP-Integration

### Option A: Als Route einbinden
Das Spiel als eigene Route (z.B. `/game` oder `/food-rush`) im ERP-Router registrieren. Die `App`-Komponente aus `src/App.tsx` direkt importieren.

### Option B: Als iFrame einbetten
Build erstellen und als statische Dateien hosten. Im ERP-Dashboard einbetten:
```html
<iframe src="/food-rush/index.html" width="850" height="700" frameborder="0"></iframe>
```

### Option C: Standalone auf Vercel/Subdomain
```bash
npm run build
# dist/ Ordner auf Vercel, Netlify oder eigenen Server deployen
```

## Supabase High Scores (optional)

Für globale Online-Highscores eine `.env` Datei erstellen:

```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

SQL für die Highscore-Tabelle:
```sql
CREATE TABLE highscores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name VARCHAR(20) NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  level_reached VARCHAR(20) NOT NULL,
  orders_completed INTEGER NOT NULL DEFAULT 0,
  accuracy DECIMAL(5,2) NOT NULL DEFAULT 0,
  items_caught INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_highscores_score ON highscores(score DESC);

ALTER TABLE highscores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Highscores lesbar" ON highscores FOR SELECT USING (true);
CREATE POLICY "Highscores einfügbar" ON highscores FOR INSERT WITH CHECK (true);
```

Ohne Supabase werden High Scores automatisch im localStorage gespeichert.

## Tech Stack

- React + TypeScript + Vite
- HTML5 Canvas (Game Rendering)
- Tailwind CSS (UI)
- Supabase (optional, High Scores)

## Spielmechanik

- **5 Level**: Frutico (Obst), Meatico (Fleisch), Lattico (Milch), Fontico (Getränke), Crustico (Bäckerei)
- **Endlos-Modus** nach Level 5
- **← → Pfeiltasten**: Korb bewegen
- **Leertaste**: Magnet-Boost (1x pro Level)
- **P**: Pause
- Items mit **blauem Ring** = in der Bestellung → unbedingt fangen!
- Items mit **grünem Glow + 💀** = verdorben → vermeiden!
- Items mit **goldenem Glow + ⭐** = Bonus → +25 Punkte

## Projektstruktur

```
src/
├── App.tsx                    # Haupt-App mit Screen-Management
├── game/
│   ├── GameEngine.ts          # Game Loop & State Management
│   ├── Canvas.tsx             # React Canvas Wrapper
│   ├── levels/levels.ts       # Level-Definitionen
│   ├── renderer/GameRenderer.ts  # Canvas Drawing
│   ├── systems/
│   │   ├── SpawnSystem.ts     # Item-Spawning
│   │   ├── PhysicsSystem.ts   # Bewegung & Kollision
│   │   ├── ScoreSystem.ts     # Punkte & Leben
│   │   └── OrderSystem.ts     # Bestellungen
│   └── utils/InputManager.ts  # Tastatur-Input
├── components/                # React UI Screens
├── lib/supabase.ts           # High Score API
└── types/game.ts             # TypeScript Interfaces
```
