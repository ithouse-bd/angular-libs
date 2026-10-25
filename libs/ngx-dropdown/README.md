# @ithouse-bd/ngx-dropdown

[![npm version](https://img.shields.io/npm/v/@ithouse-bd/ngx-dropdown.svg)](https://www.npmjs.com/package/@ithouse-bd/ngx-dropdown)
[![npm downloads](https://img.shields.io/npm/dm/@ithouse-bd/ngx-dropdown.svg)](https://www.npmjs.com/package/@ithouse-bd/ngx-dropdown)
[![license](https://img.shields.io/npm/l/@ithouse-bd/ngx-dropdown.svg)](https://github.com/ithouse-bd/angular-libs/blob/main/libs/ngx-dropdown/LICENSE)
[![Angular](https://img.shields.io/badge/Angular-20%2B-dd0031.svg)](https://angular.dev)

A modern, dependency-free dropdown / select component for Angular with multi-select,
search, grouping, pagination, infinite scroll, full keyboard support and light/dark
theming. Built on standalone components and signal inputs, and designed to sit
comfortably next to Bootstrap or Tailwind without style conflicts.

```html
<ith-dropdown [options]="fruits" placeholder="Select a fruit"></ith-dropdown>
```

## Features

- **Single & multi-select** with clearable values and select-all / clear-all
- **Search** across options, with a configurable empty state
- **Grouping** by any option property
- **Pagination** (prev/next) or **infinite scroll** (`loadMore`) for long lists
- **Server-side mode** for API-driven data (external paging, search and loading state)
- **Keyboard navigation** and ARIA wiring — arrows, Home/End, Enter/Space, Escape
- **Reactive & template-driven forms** through `ControlValueAccessor`
- **Theming** with CSS variables: light, dark and auto
- **Signal inputs**, standalone component, and an `NgModule` wrapper if you prefer modules
- **No runtime dependencies** other than `tslib`; no CSS framework required

## Compatibility

| Angular | Supported |
| --- | --- |
| 20 and newer (20+) | ✅ |
| 17, 18, 19 | ❌ not supported |
| Standalone components | ✅ (the default since Angular 19) |
| NgModule apps | ✅ (`NgxDropdownModule`) |
| Zoneless change detection | ✅ |
| SSR / prerendering | ✅ (no direct DOM access outside the browser) |

## Installation

```bash
npm install @ithouse-bd/ngx-dropdown
# or
yarn add @ithouse-bd/ngx-dropdown
# or
pnpm add @ithouse-bd/ngx-dropdown
```

**Angular 20 or newer is required.** `@angular/common`, `@angular/core` and
`@angular/forms` are peer dependencies — install them if your app does not already have
them.

## Quick start

### Standalone (recommended)

```typescript
import { Component } from '@angular/core';
import {
  DropdownChangeEvent,
  DropdownComponent,
  DropdownOption,
} from '@ithouse-bd/ngx-dropdown';

@Component({
  selector: 'app-demo',
  imports: [DropdownComponent],
  template: `
    <ith-dropdown
      [options]="fruits"
      placeholder="Select a fruit"
      (selectionChange)="onSelection($event)">
    </ith-dropdown>
  `,
})
export class DemoComponent {
  fruits: DropdownOption[] = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'orange', label: 'Orange' },
  ];

  onSelection(event: DropdownChangeEvent) {
    console.log(event.value, event.selectedItems);
  }
}
```

### With an NgModule

```typescript
import { NgxDropdownModule } from '@ithouse-bd/ngx-dropdown';

@NgModule({
  imports: [NgxDropdownModule],
})
export class AppModule {}
```

## Usage

### Multi-select

```html
<ith-dropdown
  [options]="countries"
  [multiple]="true"
  [searchable]="true"
  placeholder="Select countries">
</ith-dropdown>
```

### Searchable

```html
<ith-dropdown
  [options]="options"
  [searchable]="true"
  searchPlaceholder="Type to search..."
  noOptionsText="Nothing matches your search">
</ith-dropdown>
```

### Grouped options

```html
<ith-dropdown [options]="cities" groupBy="group" placeholder="Select a city"></ith-dropdown>
```

```typescript
cities = [
  { value: 'ny', label: 'New York', group: 'USA' },
  { value: 'la', label: 'Los Angeles', group: 'USA' },
  { value: 'london', label: 'London', group: 'UK' },
];
```

### Pagination (prev/next buttons)

```html
<ith-dropdown [options]="items" [pageable]="true" [pageSize]="10"></ith-dropdown>
```

### Infinite scroll

Client-side — options are revealed chunk by chunk as the list is scrolled:

```html
<ith-dropdown [options]="items" [infiniteScroll]="true" [pageSize]="20"></ith-dropdown>
```

Server-side — the component asks for more data through `loadMore`:

```html
<ith-dropdown
  [options]="options()"
  [infiniteScroll]="true"
  [serverSide]="true"
  [loading]="isLoading()"
  [hasMore]="hasMorePages()"
  bindLabel="name"
  bindValue="id"
  (loadMore)="loadNextPage()"
  (searchChange)="onSearch($event)">
</ith-dropdown>
```

> `infiniteScroll` takes precedence over `pageable` when both are enabled. A
> "Load more…" button is also rendered as a fallback for keyboard and touch users.

### Custom field names

```html
<ith-dropdown [options]="users" bindLabel="fullName" bindValue="id"></ith-dropdown>
```

### Two-way binding

`value` is a model input, so it supports the banana-in-a-box syntax:

```html
<ith-dropdown [options]="fruits" [(value)]="selectedFruit"></ith-dropdown>
```

### Reactive forms

```typescript
import { FormControl } from '@angular/forms';

myControl = new FormControl<string | null>(null);
```

```html
<ith-dropdown [options]="fruits" [formControl]="myControl"></ith-dropdown>
```

### Disabled options

```typescript
options = [
  { value: 1, label: 'Available' },
  { value: 2, label: 'Disabled', disabled: true },
  { value: 3, label: 'Also available' },
];
```

## API

### Inputs

All inputs are Angular signal inputs.

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `options` | `DropdownOption[]` | `[]` | Options to display |
| `value` | `any \| any[] \| null` | `null` | Selected value(s); two-way bindable |
| `placeholder` | `string` | `'Select...'` | Placeholder text |
| `multiple` | `boolean` | `false` | Enable multi-select |
| `searchable` | `boolean` | `true` | Enable the search field |
| `disabled` | `boolean` | `false` | Disable the whole control |
| `clearable` | `boolean` | `true` | Show the clear (×) button |
| `closeOnSelect` | `boolean` | `true` | Close after selecting (single select) |
| `showSelectAll` | `boolean` | `true` | Show select-all / clear-all in multi-select |
| `maxHeight` | `string` | `'250px'` | Max height of the options list |
| `searchPlaceholder` | `string` | `'Search...'` | Search field placeholder |
| `noOptionsText` | `string` | `'No options found'` | Text shown when the filter matches nothing |
| `bindLabel` | `string \| undefined` | `undefined` | Property used for the label (falls back to `label`/`name`/`text`/`title`) |
| `bindValue` | `string \| undefined` | `undefined` | Property used as the value (falls back to `value`, else the whole object) |
| `groupBy` | `string \| undefined` | `undefined` | Property to group options by |
| `pageable` | `boolean` | `false` | Enable prev/next pagination |
| `pageSize` | `number` | `10` | Items per page / per scroll chunk |
| `infiniteScroll` | `boolean` | `false` | Reveal options on scroll (takes precedence over `pageable`) |
| `hasMore` | `boolean` | `true` | Server-side infinite scroll: whether more pages exist |
| `serverSide` | `boolean` | `false` | Disable local filtering/slicing; the consumer supplies the current page |
| `totalItems` | `number` | `0` | Total item count for the server-side pagination UI |
| `loading` | `boolean` | `false` | Show the loading state |
| `loadingText` | `string` | `'Loading...'` | Text shown while loading |

### Outputs

| Output | Type | Description |
| --- | --- | --- |
| `selectionChange` | `DropdownChangeEvent` | Emitted when the selection changes |
| `valueChange` | `any \| any[] \| null` | Emitted with the new value (enables `[(value)]`) |
| `searchChange` | `string` | Emitted when the search term changes |
| `openChange` | `boolean` | Emitted when the dropdown opens or closes |
| `pageChange` | `number` | Emitted when the page changes |
| `loadMore` | `void` | Emitted (server-side infinite scroll) when more data should be fetched |

### Types

```typescript
interface DropdownOption {
  value: any;
  label: string;
  disabled?: boolean;
  group?: string;
  [key: string]: any;
}

interface DropdownChangeEvent {
  value: any | any[];
  selectedItems: DropdownOption | DropdownOption[] | null;
}
```

### Keyboard navigation

| Key | Dropdown closed | Dropdown open |
| --- | --- | --- |
| `ArrowDown` | Opens, highlighting the first option | Move to the next option |
| `ArrowUp` | Opens, highlighting the last option | Move to the previous option |
| `Home` / `End` | — | Jump to the first / last option |
| `Enter` / `Space` | Opens | Select the highlighted option |
| `Escape` | — | Close the dropdown |

Disabled options are skipped while navigating.

## Theming

The component exposes its colours as CSS custom properties and responds to a
`data-theme` attribute on the root element:

```html
<html data-theme="dark">
<!-- or data-theme="light" / data-theme="auto" -->
```

```css
ith-dropdown {
  --ith-bg: #ffffff;
  --ith-border: #ced4da;
  --ith-text: #212529;
  --ith-primary: #0d6efd;
}
```

A complete variable reference, custom theme recipes and integration examples for
Bootstrap and Tailwind live in
[THEMING.md](https://github.com/ithouse-bd/angular-libs/blob/main/libs/ngx-dropdown/THEMING.md).

## Styling

Default styles ship with the component (class names are prefixed with `ith-`), so it
works out of the box next to Bootstrap, Tailwind or a plain stylesheet. No global CSS
import is required.

## Screenshots

The documentation gallery (basic, multi-select, grouped, paginated, server-side,
infinite scroll and light/dark comparison) is available in
[docs/images](https://github.com/ithouse-bd/angular-libs/tree/main/libs/ngx-dropdown/docs/images).

## Documentation

- [Full documentation](https://github.com/ithouse-bd/angular-libs/blob/main/libs/ngx-dropdown/DOCUMENTATION.md)
- [Theming guide](https://github.com/ithouse-bd/angular-libs/blob/main/libs/ngx-dropdown/THEMING.md)
- [Changelog](https://github.com/ithouse-bd/angular-libs/blob/main/libs/ngx-dropdown/CHANGELOG.md)

## Versioning

This package follows [Semantic Versioning](https://semver.org/). Breaking changes are
only released in major versions and are listed in the changelog.

## Contributing

Issues and pull requests are welcome at
[ithouse-bd/angular-libs](https://github.com/ithouse-bd/angular-libs/issues).

## License

[MIT](https://github.com/ithouse-bd/angular-libs/blob/main/libs/ngx-dropdown/LICENSE) © iTHouse
