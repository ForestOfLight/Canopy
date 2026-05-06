# Contributing a Translation to Canopy

Canopy currently supports: American English, German, Indonesian, Chinese, Welsh, and Japanese. New translations are always welcome!

## Getting Started

### 1. Fork and clone the repository

1. Go to [github.com/ForestOfLight/Canopy](https://github.com/ForestOfLight/Canopy) and click **Fork** (top right).
2. Clone your fork (use the `dev` branch):
   ```bash
   git clone -b dev https://github.com/<your-username>/Canopy.git
   cd Canopy
   ```
3. Create a new branch for your translation:
   ```bash
   git checkout -b translation/fr_FR
   ```

## Adding or Updating a Translation

### Updating an existing language

Open the existing `.lang` file for your locale in `Canopy[RP]/texts/` (e.g., `de_DE.lang`) and update any strings that need changing.

### Adding a new language

1. Copy the English reference file and rename it to your locale code:
   ```bash
   cp "Canopy[RP]/texts/en_US.lang" "Canopy[RP]/texts/fr_FR.lang"
   ```
   Valid locale codes are listed at [wiki.bedrock.dev/text/text-intro#vanilla-languages](https://wiki.bedrock.dev/text/text-intro#vanilla-languages).

2. Add your locale code to `Canopy[RP]/texts/languages.json`:
   ```json
   [
       "en_US",
       "de_DE",
       "id_ID",
       "zh_CN",
       "cy_GB",
       "ja_JP",
       "fr_FR"
   ]
   ```

### Translating the strings

Open your `.lang` file. Each line is a key-value pair:

```
commands.help=Displays help pages.
```

- **Translate the value only** (right side of `=`) — never change the key (left side)
- **Preserve format codes exactly** — `§a`, `§r`, `§l` are color/style codes; `%s`, `%1`, `%2` are placeholders that get filled in at runtime. Changing or removing them will break the output.

Example — correct:
```
commands.help=Zeigt Hilfeseiten an.
```

Example — incorrect (key changed):
```
befehle.hilfe=Zeigt Hilfeseiten an.
```

## Testing Your Translation

1. Place the Canopy resource pack in your Minecraft `development_resource_packs` folder.
2. Launch Minecraft and set your game language to the locale you translated.
3. Load a world with the Canopy pack applied.
4. Test strings in-game — check commands, messages, and UI text.

**Tip:** If you make changes to the `.lang` file while Minecraft is running, you can reload without restarting using:

```
/reload all
```

This only works when the pack is in `development_resource_packs`.

## Submitting a PR

1. Stage only your translation files:
   ```bash
   git add "Canopy[RP]/texts/fr_FR.lang"
   # If you added a new language, also stage languages.json:
   git add "Canopy[RP]/texts/languages.json"
   ```
2. Commit:
   ```bash
   git commit -m "translation: add fr_FR"
   ```
3. Push to your fork:
   ```bash
   git push origin translation/fr_FR
   ```
4. Open a pull request on GitHub targeting the **`dev` branch**.
   - Your PR should only contain changes to your `.lang` file (and `languages.json` if it's a new language). Any other changes belong in a separate PR.

## Questions?

Reach out on the [Canopy Discord](https://discord.gg/9KGche8fxm) — we're happy to help.
