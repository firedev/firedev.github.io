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
