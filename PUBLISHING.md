# Publishing `@ithouse-bd/ngx-dropdown`

This repository publishes one package to npm: **`@ithouse-bd/ngx-dropdown`**, built from
[`libs/ngx-dropdown`](libs/ngx-dropdown). Releases are built and published by GitHub
Actions using **npm Trusted Publishing (OIDC)**, so no npm token is ever stored in the
repository.

- Workflow: [.github/workflows/publish.yml](.github/workflows/publish.yml)
- CI (build + package check): [.github/workflows/ci.yml](.github/workflows/ci.yml)

---

## Release flow at a glance

```
edit version + CHANGELOG  ->  commit  ->  git tag vX.Y.Z  ->  git push --follow-tags
                                                              |
                                              GitHub Actions builds the library,
                                              verifies the tag, publishes to npm
                                              with provenance and creates a release.
```

After that, the package is live at
<https://www.npmjs.com/package/@ithouse-bd/ngx-dropdown>.

---

## Prerequisites

- **Node.js 22** (the CI matrix uses 22; Local development also works on 20+ and 24)
- An **npm account** with 2FA enabled
- **Owner or admin** access to the `ithouse-bd/angular-libs` GitHub repository

Installs use the [`legacy-peer-deps` setting in .npmrc](.npmrc): `@angular/animations` is
published only up to `20.1.8` and peer-requires `@angular/common@20.1.8`, while the rest of
Angular resolves to `20.3.x`. Both local and CI installs must use the same mode, so do not
delete that file — `npm ci` relies on it.

## One-time setup

Do this once. After it is done, every release is a single tag push.

### 1. Create an npm account

Sign up at <https://www.npmjs.com/signup> and enable two-factor authentication
(npm requires 2FA for publishing).

### 2. Own the `@ithouse-bd` scope

A scoped package name needs an npm **organization** that owns the scope. Organizations
are free for unlimited public packages.

1. Open <https://www.npmjs.com/org/create>
2. Create the organization **`ithouse-bd`** — this is what makes `@ithouse-bd/ngx-dropdown` valid
3. Pick the **free / public packages** plan

> The scope and the npm organization name must match exactly. `ithouse` was already taken,
> so this repository uses **`ithouse-bd`** (the same name as the GitHub org). If you ever
> change it again, update `name` in [libs/ngx-dropdown/package.json](libs/ngx-dropdown/package.json),
> the path mapping in [tsconfig.base.json](tsconfig.base.json) and the imports in
> [apps/demo-app](apps/demo-app) together, otherwise the workspace will not resolve the library.

### 3. Publish the first version from your machine

npm can only register a trusted publisher for a package that **already exists**, so the
very first version is published locally. Later releases go through Actions.

```bash
# from the repository root
npx nx build ngx-dropdown

cd dist/libs/ngx-dropdown
npm publish --access public
```

`npm` asks for your 2FA one-time password. `--access public` is required because scoped
packages default to private.

> Prefer not to type an OTP? Create a **Granular Access Token** with read/write access to
> `@ithouse-bd` and "bypass 2FA" enabled, export it as `NPM_TOKEN`, and add
> `//registry.npmjs.org/:_authToken=${NPM_TOKEN}` to your `~/.npmrc`. Revoke it afterwards.

### 4. Register the trusted publisher

The workflow file must already exist on the default branch — it does, so push first.

1. Open <https://www.npmjs.com/package/@ithouse-bd/ngx-dropdown/access> (package → **Settings**)
2. Find **Trusted publishing** and choose **GitHub Actions**
3. Fill in exactly:

   | Field | Value |
   | --- | --- |
   | Organization or user | `ithouse-bd` |
   | Repository | `angular-libs` |
   | Workflow filename | `publish.yml` |
   | Environment | *(leave empty)* |

4. Save

From now on, a run of `.github/workflows/publish.yml` in `ithouse-bd/angular-libs` can
publish without any token. npm also attaches a **provenance** attestation automatically
so users can verify which commit and workflow produced a release.

### 5. Repository requirements

- **Public repository** — required for provenance and for free unlimited Actions minutes
  on a free GitHub plan. Publishing still works from a private repo, but without
  provenance.
- **GitHub-hosted runners** only; self-hosted runners are not supported by npm trusted
  publishing.
- The `publish.yml` filename registered in step 4 must match exactly. Renaming or
  deleting the workflow breaks publishing until the npm settings are updated.

---

## Cutting a release

### 1. Bump the version and document it

Only the library manifest is versioned; the workspace root stays at `0.0.0`.

```bash
# libs/ngx-dropdown/package.json
"version": "1.1.0"
```

Add a matching `## [1.1.0] - YYYY-MM-DD` section to
[libs/ngx-dropdown/CHANGELOG.md](libs/ngx-dropdown/CHANGELOG.md).

Semantic versioning applies:

| Change | Version bump |
| --- | --- |
| New input/output, new behaviour that is backwards compatible | minor (`1.1.0`) |
| Bug fix, docs, styling | patch (`1.0.1`) |
| Removed/renamed input, changed default, dropped Angular version | major (`2.0.0`) |

### 2. Check the build locally (optional but fast)

```bash
npx nx build ngx-dropdown
cd dist/libs/ngx-dropdown && npm pack --dry-run
```

The second command lists exactly what will be published.

### 3. Tag and push

```bash
git add libs/ngx-dropdown/package.json libs/ngx-dropdown/CHANGELOG.md
git commit -m "release(ngx-dropdown): v1.1.0"
git tag v1.1.0
git push origin main --follow-tags
```

The tag **must** be `v` + the version in `libs/ngx-dropdown/package.json`; the workflow
fails early if they differ, so a mismatched tag can never publish the wrong version.

### 4. Watch the run

Open the **Actions** tab → **Publish**. The job:

1. installs dependencies (`npm ci`)
2. builds the library (`nx build ngx-dropdown`, partial compilation)
3. verifies tag ↔ package version
4. verifies the tarball contains `package.json`, `README.md`, `LICENSE`, `index.d.ts`
5. runs `npm publish ./dist/libs/ngx-dropdown --access public` with OIDC
6. creates a GitHub release for the tag

---

## What gets published

The build output in `dist/libs/ngx-dropdown` is the package:

| File | Purpose |
| --- | --- |
| `package.json` | manifest, `exports`, peer dependencies |
| `index.d.ts` + maps | TypeScript types |
| `fesm2022/*.mjs` | compiled runtime (partial compilation) |
| `README.md` | rendered on the npm package page |
| `LICENSE` | MIT |

Source, tests, docs and the demo app are **not** included. Preview the file list with
`npm pack --dry-run` inside `dist/libs/ngx-dropdown`.

---

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| `403 Forbidden — You do not have permission to publish` | The npm account running the publish is not a member of the `@ithouse-bd` org, or `--access public` is missing for a scoped package. |
| `EOTP` / "one-time password required" | A token-based publish without a bypass-2FA token. Trusted publishing avoids this entirely. |
| `404 Not Found — PUT https://registry.npmjs.org/@ithouse-bd%2fngx-dropdown` | The scope does not exist yet, or you are not a member of it. Create/join the org first. |
| `Package name too similar to existing package` | npm blocks names close to an existing one; that is why the scope is `@ithouse-bd`, not `@ithouse`. |
| `npm error 403 ... cannot publish over previously published version` | Versions are immutable. Bump the version and tag again. |
| Workflow fails with "Trying to publish a package that has been compiled in full compilation mode" | `angularCompilerOptions.compilationMode` must stay `"partial"` in [tsconfig.lib.prod.json](libs/ngx-dropdown/tsconfig.lib.prod.json). |
| Workflow fails at the OIDC exchange | Trusted publisher mismatch: check owner `ithouse-bd`, repository `angular-libs`, workflow filename `publish.yml`. |
| Provenance missing on npm | Provenance needs a **public** repository and a GitHub-hosted runner. |
| `Tag v1.1.0 does not match version 1.1.1` | Bump the manifest or retag; the workflow refuses to publish mismatched versions. |
| Need to publish before the trusted publisher exists | Publish locally with `npm publish --access public` (see step 3), or add an `NPM_TOKEN` secret and `env: NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}` to the publish step. |
| `npm ci` fails with `ERESOLVE could not resolve` | `.npmrc` is missing or was deleted; it sets `legacy-peer-deps`, which the Angular 20.1/20.3 peer mismatch requires. Restore the file. |
| `npm publish` prints "compiled in full compilation mode" | Partial compilation is mandatory for npm; keep `compilationMode: "partial"` in [tsconfig.lib.prod.json](libs/ngx-dropdown/tsconfig.lib.prod.json). |

## Dry run without publishing

Build the library and inspect the exact artifact:

```bash
npx nx build ngx-dropdown
cd dist/libs/ngx-dropdown
npm pack --dry-run          # list files and size
npm pack                    # produce the .tgz if you want to test an install
```

To test the tarball in another project:

```bash
npm install /path/to/ithouse-bd-ngx-dropdown-1.0.0.tgz
```
