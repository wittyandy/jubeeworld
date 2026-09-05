# Jubee World Learning Site

This folder is ready to publish with GitHub Pages. The homepage teaches children how to create Jubee World from an empty parent folder named `jubee-world`. In Copilot Agent mode, each prompt creates the next complete folder: `version-1`, `version-2`, `version-3`, `version-4`, `version-5`, and `version-6`. Copilot copies the previous working version before making new changes, so earlier versions remain safe. Students download the provided game artwork for Version 4 from the project’s GitHub assets folder; no starter code or sound files are required.

Game assets: https://github.com/wittyandy/jubeeworld/tree/main/finished-game/assets

The included finished game places its smartphone movement and Jump controls in a separate panel below the game screen, rather than over the game.

The homepage now begins with links and directions for installing Visual Studio Code and turning on GitHub Copilot Free. The finished example places its most useful values in an `EASY_SETTINGS` section near the top of `finished-game/game.js`, where children can safely experiment with movement speed, jump height, gravity, sound volume, apple-power time, and the wait between stages.

## Preview on your computer

Double-click `index.html`. Select **Play the finished example** to open the included game.

## Publish with GitHub Pages

1. Sign in at [github.com](https://github.com/).
2. Create a new public repository named `jubeeworld`.
3. Upload everything inside this folder. Keep `index.html` at the top level and keep the `finished-game` folder together.
4. Open **Settings → Pages**.
5. Choose **Deploy from a branch**.
6. Choose the `main` branch and `/(root)`, then save.
7. Wait a few minutes for the website address to appear.

The address will usually be:

    https://YOUR-USERNAME.github.io/jubeeworld/

## Files

- `index.html` — the complete six-version learning homepage
- `site.css` — homepage appearance
- `site.js` — copy buttons and saved progress boxes
- `site-assets/` — local homepage pictures; no outside image service is used
- `finished-game/` — the complete playable Jubee World example
