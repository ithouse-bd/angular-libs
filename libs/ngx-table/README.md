# @ithouse-bd/ngx-table

[![npm version](https://img.shields.io/npm/v/@ithouse-bd/ngx-table.svg)](https://www.npmjs.com/package/@ithouse-bd/ngx-table)
[![npm downloads](https://img.shields.io/npm/dm/@ithouse-bd/ngx-table.svg)](https://www.npmjs.com/package/@ithouse-bd/ngx-table)
[![license](https://img.shields.io/npm/l/@ithouse-bd/ngx-table.svg)](https://github.com/ithouse-bd/angular-libs/blob/main/libs/ngx-table/LICENSE)
[![Angular](https://img.shields.io/badge/Angular-20%2B-dd0031.svg)](https://angular.dev)

A generic, fully themeable data table for Angular. Bring your own row type and column
configuration — the table handles sorting, global search, per-column filters, pagination,
row selection, row actions and custom templates, for both client-side arrays and
API-driven (server) data.

![Data table overview](https://raw.githubusercontent.com/ithouse-bd/angular-libs/main/libs/ngx-table/docs/images/table-overview.svg)

```html
<ith-table title="Students" [data]="students" [columns]="columns" selectionMode="multi">
</ith-table>
```

## Features

- **Generic** — `TableColumn<T>` typed against your own row interface; dot-paths for nested data
- **Sorting** — click a header to cycle `asc → desc → unsorted`, custom comparators per column
- **Search** — global search box plus a filter row that covers **every column**: text,
  number, date or select controls, per-column placeholders, custom `filterPredicate`, or
  your own filter template
- **Pagination** — page window, first/last/prev/next, rows-per-page selector and range summary
- **Selection** — single or multi, select-all for the page or all filtered rows, keep keys across pages
- **Row actions** — declarative action buttons with icons, classes, disabled/hidden rules, or your own template
- **Custom templates** — cell, header, row actions, toolbar, footer and empty state
- **Server mode** — the table emits sort/search/filter/page changes; you supply one page of rows
- **Presentation** — striped, bordered, dense, hover, sticky header, fixed max height, loading overlay
- **Theming** — CSS variables with light, dark and system (`auto`) modes; zero style-framework dependency
- **Signals everywhere** — `input()`, `model()`, `output()`, standalone component, zoneless-safe
- **No runtime dependencies** except `tslib`

## Compatibility

| | Supported |
| --- | --- |
| Angular 20 and newer | ✅ |
| Angular 17, 18, 19 | ❌ not supported (`>=20.0.0` peer range) |
| Standalone components | ✅ |
| NgModule apps | ✅ (`NgxTableModule`) |
| Zoneless change detection | ✅ |
| SSR / prerendering | ✅ no direct DOM access |

## Installation

```bash
npm install @ithouse-bd/ngx-table
# or
yarn add @ithouse-bd/ngx-table
# or
pnpm add @ithouse-bd/ngx-table
```

**Angular 20 or newer is required.** `@angular/common` and `@angular/core` are peer
dependencies.

## Quick start

### 1. Describe your rows

```typescript
import { TableColumn } from '@ithouse-bd/ngx-table';

interface Student {
  id: number;
  name: string;
  email: string;
  roll: number;
  active: boolean;
}

readonly columns: TableColumn<Student>[] = [
  { key: 'roll', header: 'Roll', width: '80px', align: 'center' },
  { key: 'name', header: 'Name', minWidth: '180px' },
  { key: 'email', header: 'Email' },
  {
    key: 'active',
    header: 'Status',
    formatter: (value) => (value ? 'Active' : 'Inactive'),
  },
];
```

### 2. Render the table

```typescript
import { Component } from '@angular/core';
import { TableComponent } from '@ithouse-bd/ngx-table';

@Component({
  selector: 'app-students',
  imports: [TableComponent],
  template: `
    <ith-table
      title="Student List"
      [data]="students"
      [columns]="columns"
      selectionMode="multi"
      [pageSize]="10"
      (rowClick)="openStudent($event.row)">
    </ith-table>
  `,
})
export class StudentsComponent {}
```

The `keyField` defaults to `'id'`; set `[keyField]="'studentId'"` when your rows use another
unique field.

## Custom cell templates

Add `ithTableCell` templates for any column key. The context exposes `$implicit` (the row),
`row`, `column`, `value` and `index`:

```html
<ith-table [data]="students" [columns]="columns">
  <ng-template ithTableCell="name" let-row let-index="index">
    <strong>{{ index + 1 }}. {{ row.name }}</strong>
  </ng-template>

  <ng-template ithTableCell="active" let-value="value">
    <span [class.text-success]="value" [class.text-muted]="!value">
      {{ value ? 'Active' : 'Inactive' }}
    </span>
  </ng-template>
</ith-table>
```

Import the directive next to the table (or use `NgxTableModule`):

```typescript
import { TableCellDirective, TableComponent } from '@ithouse-bd/ngx-table';

@Component({ imports: [TableComponent, TableCellDirective], /* … */ })
```

Other slots: `ithTableHeader="key"`, `ithTableFilter="key"`, `ithTableRowActions`,
`ithTableToolbar`, `ithTableFooter`, `ithTableEmpty`.

![Selection and row actions](https://raw.githubusercontent.com/ithouse-bd/angular-libs/main/libs/ngx-table/docs/images/table-selection.svg)

## Row actions

```typescript
readonly actions: TableRowAction<Student>[] = [
  { id: 'edit', label: 'Edit', icon: '✎' },
  {
    id: 'delete',
    label: 'Delete',
    class: 'is-danger',
    disabled: (row) => row.active,
  },
];
```

```html
<ith-table
  [data]="students"
  [columns]="columns"
  [rowActions]="actions"
  (actionClick)="handleAction($event)">
</ith-table>
```

`$event` is `{ action, row, index }`. Use `#ithTableRowActions` for a completely custom
actions column.

## Server-side mode

```html
<ith-table
  mode="server"
  [data]="pageRows()"
  [total]="total()"
  [loading]="loading()"
  [columns]="columns"
  [page]="page()"
  [pageSize]="pageSize()"
  [sort]="sort()"
  [search]="search()"
  (pageChange)="onPage($event)"
  (pageSizeChange)="onPageSize($event)"
  (sortChange)="onSort($event)"
  (searchChange)="onSearch($event)"
  (filterChange)="onFilters($event)">
</ith-table>
```

In server mode the table does **not** re-sort, search or slice the array — it renders
exactly the rows you pass, asks for the rest through outputs, and uses `[total]` for the
pager. See the [full documentation](https://github.com/ithouse-bd/angular-libs/blob/main/libs/ngx-table/DOCUMENTATION.md)
for a complete example.

## Theming

```css
.my-table {
  --ith-table-header-bg: #0f172a;
  --ith-table-accent: #2563eb;
  --ith-table-radius: 8px;
}
```

Light/dark/auto follows the same convention as `@ithouse-bd/ngx-dropdown`: set
`data-theme="light" | "dark" | "auto"` on `<html>` or `<body>`. All variables are listed
in the [theming guide](https://github.com/ithouse-bd/angular-libs/blob/main/libs/ngx-table/THEMING.md).

The component ships ~15 kB of scoped CSS (~3 kB gzipped). If your `angular.json` keeps the
Angular default `anyComponentStyle` budget (8 kB error), raise it to `16kb`/`20kb`.

## API at a glance

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `data` | `T[]` | `[]` | Rows to render (current page in server mode) |
| `columns` | `TableColumn<T>[]` | `[]` | Column configuration |
| `keyField` | `string` | `'id'` | Unique key path used for selection and tracking |
| `mode` | `'client' \| 'server'` | `'client'` | Local or API-driven data |
| `total` | `number` | `0` | Total row count (server mode) |
| `selectionMode` | `'none' \| 'single' \| 'multi'` | `'none'` | Row selection |
| `selectAllScope` | `'page' \| 'all'` | `'page'` | What the header checkbox selects |
| `selected` | `T[]` | `[]` | Two-way bindable selection |
| `rowActions` | `TableRowAction<T>[]` | `[]` | Action buttons per row |
| `page` / `pageSize` | `number` | `1` / `10` | Two-way bindable pager state |
| `search` | `string` | `''` | Two-way bindable global search |
| `sort` | `TableSort \| null` | `null` | Two-way bindable sort state |
| `pageSizeOptions` | `number[]` | `[10, 20, 50, 100]` | Rows-per-page choices |
| `showFilters` | `boolean` | `false` | Per-column filter row (text / number / date / select) |
| `loading` | `boolean` | `false` | Loading overlay |
| `striped` / `bordered` / `dense` / `hoverable` | `boolean` | `false` / `false` / `false` / `true` | Presentation modifiers |
| `stickyHeader` / `maxHeight` | `boolean` / `string` | `false` / `''` | Scroll container behaviour |

Outputs: `sortChange`, `searchChange`, `filterChange`, `pageChange`, `pageSizeChange`,
`selectedChange`, `actionClick`, `rowClick`.

Full reference, every template context and recipes:
**[DOCUMENTATION.md](https://github.com/ithouse-bd/angular-libs/blob/main/libs/ngx-table/DOCUMENTATION.md)**.

## Development

```bash
npx nx build ngx-table        # build the package into dist/libs/ngx-table
npx nx serve demo-app         # run the demo (client + server table examples)
```

## License

MIT © iTHouse
