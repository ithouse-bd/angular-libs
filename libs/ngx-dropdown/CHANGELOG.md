# Changelog

All notable changes to `@ithouse-bd/ngx-dropdown` are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-10-25

### Changed

- **Requires Angular 20 or newer.** Peer dependencies narrowed from
  `^17.0.0 || ^18.0.0 || ^19.0.0 || ^20.0.0` to `>=20.0.0`; Angular 17, 18 and 19 are no
  longer supported.
- Removed the redundant `standalone: true` from the component decorators — standalone is
  the default since Angular 19.
- Documentation updated for the new Angular requirement and the `@ithouse-bd` package name.

## [1.0.0] - 2026-10-25

First public release.

### Added

- `DropdownComponent` (`<ith-dropdown>`) available both as a standalone component and
  through `NgxDropdownModule`.
- Single and multi-select modes with `selectionChange` events and `ControlValueAccessor`
  support for reactive and template-driven forms.
- Client-side search with a configurable `noOptionsText` empty state.
- Option grouping via `groupBy`.
- Pagination with prev/next buttons (`pageable`, `pageSize`, `pageChange`) and an
  `infiniteScroll` mode with a `loadMore` output for keyboard and touch users.
- Server-side mode (`serverSide`, `totalItems`, `loading`, `hasMore`) for API-driven data.
- Keyboard navigation: `ArrowUp` / `ArrowDown`, `Home` / `End`, `Enter` / `Space`,
  `Escape`, with ARIA combobox/listbox wiring and disabled-option skipping.
- Light, dark and auto themes driven by CSS custom properties on `data-theme`.
- Select-all / clear-all for multi-select, clearable single selection, individual
  disabled options and a disabled state for the whole control.
- Documentation: `README.md`, `DOCUMENTATION.md`, `THEMING.md` and an SVG mockup gallery.

[1.0.0]: https://github.com/ithouse-bd/angular-libs/releases/tag/v1.0.0
[1.0.1]: https://github.com/ithouse-bd/angular-libs/releases/tag/v1.0.1
