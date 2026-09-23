# firedev.com

Portfolio on Bridgetown 2.2 + Tailwind CSS 4.

## Branches

- `source` — the editable Bridgetown project.
- `master` — generated `output/` only; GitHub Pages serves this branch from `/`.
- Never commit Bridgetown source to `master` and never edit `output/` by hand.

## Commands

Ruby must run through mise:

```sh
mise exec -- npm install
mise exec -- npm run start
mise exec -- ./build.sh
```

The production build goes to `output/`. Check key pages with `curl` or by inspecting
the generated HTML. If a real browser is required, use Brave only — never Chrome.

## Content architecture

- Posts live in `src/_posts/` and use `src/_layouts/post.serb`.
- Projects live in `src/_projects/` and render at `/projects/:slug/`.
- `About`, `Posts`, and every post/project page use the shared `default` layout.
- Never copy generated project or post HTML back into `src/`; that freezes the old
  header and causes the design to drift.
- Do not add browser favicons or Google favicon-service images as project logos.

## Deploy

1. On `source`, commit and push all intended source changes.
2. Run `mise exec -- ./build.sh`.
3. Clone `git@github.com:firedev/firedev.github.io.git` branch `master` into a
   temporary directory.
4. Sync `output/` into that clone with deletion enabled, preserving its `.git/`.
5. Commit and push `master`.
6. Wait for GitHub Pages to report `built`, then verify:
   `https://firedev.com/`, `/projects/`, and `/projects/unpos/`.

Do not force-push either branch. `src/CNAME` must remain `firedev.com`.

## Project screenshots

Card and project-page media are 16:10 with `object-cover`. Shoot live sites at
`--window-size=1024,640 --force-device-scale-factor=2` (→ 2048×1280, then `cwebp -q 82`):
a narrower window fills the frame with content instead of whitespace (Nick, 23.09.2026).
Check the shot: if the site's nav wraps or the headline is cut, go up to 1280×800 —
thinkforward.academy needs 1280.
Light mode: `--blink-settings=preferredColorScheme=1`. zsh does not word-split
`set -- $p` in a loop — use `set -- ${=p}`, or every shot silently goes to the wrong
path (23.09.2026: that, not Brave, was why window sizes looked ignored). Brave headless
hangs while Brave GUI is open; use Playwright's
`~/Library/Caches/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-mac-arm64/chrome-headless-shell`
with the same flags.

## Copy

Project text is Nick's words verbatim — lift it from the project's own site or vault note
(`rg` the exact line), never paraphrase or translate his Russian into new English lines.
23.09.2026: invented Tell Others lines ("What I want to leave behind…", "One card for each
thing…") read wrong to Nick; the fix was his lines from tellothers.com unchanged.
