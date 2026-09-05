# Jubee World Learning Site

This folder is ready to publish with GitHub Pages. The homepage teaches children how to create Jubee World from three empty files in five working versions. It also includes the finished ten-level game as a playable example.

The homepage now begins with links and directions for installing Visual Studio Code and turning on GitHub Copilot Free. The finished example places its most useful values in an `EASY_SETTINGS` section near the top of `finished-game/game.js`, where children can safely experiment with movement speed, jump height, gravity, sound volume, apple-power time, and the wait between stages.

## Preview on your computer

Double-click `index.html`. Select **Play the finished example** to open the included game.

## Publish with GitHub Pages

1. Sign in at [github.com](https://github.com/).
2. Create a new public repository named `jubee-world-learning`.
3. Upload everything inside this folder. Keep `index.html` at the top level and keep the `finished-game` folder together.
4. Open **Settings → Pages**.
5. Choose **Deploy from a branch**.
6. Choose the `main` branch and `/(root)`, then save.
7. Wait a few minutes for the website address to appear.

The address will usually be:

    https://YOUR-USERNAME.github.io/jubee-world-learning/

## Files

- `index.html` — the complete five-version learning homepage
- `site.css` — homepage appearance
- `site.js` — copy buttons and saved progress boxes
- `site-assets/` — local homepage pictures; no outside image service is used
- `finished-game/` — the complete playable Jubee World example

The finished game uses an HTML `<canvas>` element as its drawing screen. This is a standard part of a web browser and is unrelated to Canvas LMS. The website does not connect to Canvas LMS or load files from it.
