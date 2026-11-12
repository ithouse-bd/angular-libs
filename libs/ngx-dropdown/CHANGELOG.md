# Changelog

All notable changes to `@ithouse-bd/ngx-dropdown` are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-11-12

### Added

- **`CascaderComponent` (`<ith-cascader>`)** — a cascading / dependent select for
  hierarchical data such as division → district → sub-district, or category → sub-category:
  - drill-down navigation with an in-panel breadcrumb and a back button;
  - **API-driven levels**: `loadChildren` (Promise or RxJS observable) fetches one level at a
    time, cached per node, with a spinner, inline error and retry;
  - dynamic per-level placeholders (`levelPlaceholders`) for “Select Division → Select
    District → Select Sub-district” flows;
  - `resolveValue` hydrates the breadcrumb of an existing value, so edit forms work with
    API-backed trees and any value type (string, number, object via `bindValue`);
  - **server-side search**: `searchFn` (Promise or RxJS observable) is debounced, returns
    hits with their full path, keeps the breadcrumb of a picked hit and reloads that level's
    siblings on open; stale responses are dropped and failures offer a retry;
  - disabled options (a leaf or a whole branch) are dimmed, skipped by keyboard navigation
    and cannot be selected, with `aria-disabled`;
  - redesigned visuals: neutral surfaces with an indigo accent, 44px trigger, layered panel
    shadow, pill level hint, thin scrollbar, SVG clear icons aligned with the chevron, and a
    calmer selected state (subtle inset ring instead of a darker fill, light + dark);
  - search across the whole tree (static + already-loaded levels), showing each hit's full path;
  - single value with `[(value)]`, `selectionChange`, clear button and `ControlValueAccessor`
    (reactive and template-driven forms);
  - `changeOnSelect` for trees where intermediate nodes are valid values;
  - keyboard support: `ArrowUp` / `ArrowDown`, `ArrowRight` / `ArrowLeft`, `Home` / `End`,
    `Enter`, `Escape`, `Backspace`;
  - the same `--ith-*` theme tokens, dark/auto modes and `data-theme` convention as
    `<ith-dropdown>`, plus ARIA combobox/listbox wiring.
- `CascaderOption`, `CascaderSearchResult` and `CascaderChangeEvent` types.
- `NgxDropdownModule` now exports both components.

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
