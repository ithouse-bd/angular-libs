# Deploying the demo app (free, live)

The demo application in [`apps/demo-app`](apps/demo-app) is a static Angular app — no
backend, no database, no server — so it can be hosted for free and stays awake permanently.

Production build:

```bash
npx nx build demo-app --configuration=production
# output: dist/apps/demo-app  (index.html + hashed JS/CSS)
```

[`vercel.json`](vercel.json) already contains the settings Vercel needs, so nothing has to
be configured by hand:

| Setting | Value |
| --- | --- |
| Framework preset | Other (detection disabled) |
| Install command | `npm ci --include=dev` |
| Build command | `npx nx build demo-app --configuration=production` |
| Output directory | `dist/apps/demo-app` |
| Node.js version | Vercel default (20+), see `engines` in [package.json](package.json) |

## One-time setup

1. Sign in at <https://vercel.com> **with GitHub** (Hobby plan — free, no card)
2. **Add New → Project** → import `ithouse-bd/angular-libs`
3. Leave the detected settings alone — `vercel.json` overrides them. If Vercel shows a
   "Root Directory" prompt, keep the repository root, **not** `apps/demo-app`
4. Deploy

Every push to `main` then redeploys automatically, and every pull request gets its own
preview URL.

## Alternative: deploy from the CLI

```bash
npx vercel login
npx vercel --prod
```

The first run asks to link the project; answer with the repository root as the project
directory.

## Notes

- `npm ci` needs [`.npmrc`](.npmrc) (it sets `legacy-peer-deps` for the Angular 20.1/20.3
  peer mismatch), so that file must stay committed.
- The build is served from the domain root, which matches `<base href="/">` in the built
  `index.html`. Deploying under a sub-path (e.g. GitHub Pages) would need
  `--base-href=/<path>/`.
- Vercel's free Hobby plan allows commercial use only with Pro; for a public component
  demo this is fine.
- The app has no routing, so no SPA rewrite rules are required.

## After the first deploy

Put the URL in [README.md](README.md) and in the "Live demo" section of
[libs/ngx-dropdown/README.md](libs/ngx-dropdown/README.md) so npm visitors can try the
component before installing it.
