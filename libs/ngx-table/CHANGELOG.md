# Changelog

All notable changes to `@ithouse-bd/ngx-table` are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
[Semantic Versioning](https://semver.org/).

## [1.0.0] — 2026-10-25

### Added

- `<ith-table>` standalone component with signal inputs, `model()` inputs and outputs.
- `TableColumn<T>` configuration: dot-path fields, alignment, widths, formatters, custom
  comparators, custom search/filter values, hidden columns, header/cell classes.
- Client-side mode with global search, per-column filters, sorting and pagination.
- Customizable filters on every column: `filterType` (`text`, `number`, `date`, `select`),
  `filterOptions`, `filterPlaceholder`, `filterPredicate`, `filterAllLabel` and a custom
  control template (`ithTableFilter="key"`).
- Server-side mode (`mode="server"`) with `total`, `loading`, `sortChange`, `searchChange`,
  `filterChange`, `pageChange` and `pageSizeChange` outputs.
- Sorting: `asc → desc → unsorted` cycling, `aria-sort`, custom `sortFn`, table-wide and
  per-column opt-out.
- Selection: `none` / `single` / `multi`, page or all-filtered select-all, indeterminate
  header checkbox, selection preserved across pages by `keyField`.
- Row actions: declarative buttons (icon, class, disabled/hidden rules) and the
  `ithTableRowActions` template.
- Custom templates: `ithTableCell`, `ithTableHeader`, `ithTableFilter`,
  `ithTableRowActions`, `ithTableToolbar`, `ithTableFooter`, `ithTableEmpty`.
- Pagination footer: range summary, total label, centred page window, first/previous/next/last
  buttons, rows-per-page selector.
- Presentation: `striped`, `bordered`, `dense`, `hoverable`, `stickyHeader`, `maxHeight`,
  loading overlay and empty state.
- Theming with CSS variables for light, dark (`[data-theme="dark"]` / `.dark`) and system
  (`[data-theme="auto"]`) modes.
- Accessibility: `aria-sort`, `aria-current`, labelled checkboxes and pagination, `aria-busy`,
  `aria-selected` rows, and `Enter`/`Space` activation for clickable rows.
- Published package now ships `DOCUMENTATION.md`, `THEMING.md`, `CHANGELOG.md` and the SVG
  previews next to the README.
- `NgxTableModule` wrapper for NgModule-based applications.
- Documentation (README, DOCUMENTATION, THEMING), SVG previews, MIT license.

### Fixed

- Server mode no longer resets `page` when `search`, `filters`, `sort` or `pageSize` change,
  so one query change produces one request instead of two.
- `filterType: 'date'` compares the calendar date, so ISO strings are not shifted by the
  browser time zone.
- `filterType: 'number'` compares numerically, so `12`, `12.0` and `012` all match `12`.
- Empty-state `colspan` falls back to `1` when the table has no visible columns.
- The host element is `display: block` by default, so the table no longer depends on the
  page's CSS to lay out correctly.

### Requirements

- Angular **20 or newer** (`@angular/common`, `@angular/core` peer dependencies).
- No runtime dependencies except `tslib`.
