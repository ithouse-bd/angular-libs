# Angular Libraries — `@ithouse-bd/ngx-dropdown`

An Nx workspace that builds and publishes Angular component libraries.

| Project | Path | Description |
| --- | --- | --- |
| **`ngx-dropdown`** | [libs/ngx-dropdown](libs/ngx-dropdown) | **Published to npm as [`@ithouse-bd/ngx-dropdown`](https://www.npmjs.com/package/@ithouse-bd/ngx-dropdown).** Advanced dropdown / multi-select for **Angular 20+** with search, grouping, pagination, infinite scroll, keyboard navigation and light/dark theming. |
| `ui-components` | [libs/ui-components](libs/ui-components) | Small Tailwind-based component set (`lib-card`, `lib-button`). Workspace only. |
| `tailwind-styles` | [libs/tailwind-styles](libs/tailwind-styles) | Tailwind configured with the `tw-` prefix so it can live next to Bootstrap. |
| `demo-app` | [apps/demo-app](apps/demo-app) | Demo application exercising every dropdown feature. |

## Setup

```bash
npm install
```

## Development

```bash
npx nx serve demo-app     # http://localhost:4200
npx nx build ngx-dropdown # build the publishable library
npx nx build demo-app     # build the demo app
npx nx build              # build everything
```

## The dropdown library

```bash
npm install @ithouse-bd/ngx-dropdown
```

```typescript
import { DropdownComponent, DropdownOption } from '@ithouse-bd/ngx-dropdown';

@Component({
  imports: [DropdownComponent],
  template: `<ith-dropdown [options]="options" [multiple]="true"></ith-dropdown>`,
})
export class MyComponent {}
```

- Full guide: [libs/ngx-dropdown/README.md](libs/ngx-dropdown/README.md)
- Documentation: [libs/ngx-dropdown/DOCUMENTATION.md](libs/ngx-dropdown/DOCUMENTATION.md)
- Theming: [libs/ngx-dropdown/THEMING.md](libs/ngx-dropdown/THEMING.md)
- Changelog: [libs/ngx-dropdown/CHANGELOG.md](libs/ngx-dropdown/CHANGELOG.md)
- Screenshots: [libs/ngx-dropdown/docs/images](libs/ngx-dropdown/docs/images)

## Publishing

Releases are published to npm by GitHub Actions when a `v*` tag is pushed, using npm
Trusted Publishing (no npm token in the repository).

```bash
# 1. bump libs/ngx-dropdown/package.json + CHANGELOG.md
# 2. tag and push
git tag v1.0.1
git push origin main --follow-tags
```

The complete setup and troubleshooting guide is in [PUBLISHING.md](PUBLISHING.md).

## Tailwind and Bootstrap together

The Tailwind libraries are configured with:

- `prefix: 'tw-'` — utilities are prefixed so they never collide with Bootstrap classes
- `preflight: false` — Bootstrap's reset is preserved

Use `tw-bg-blue-500` next to `btn btn-primary` without conflicts.
