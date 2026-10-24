# @ithouse/ngx-dropdown

Advanced Angular dropdown/select component with support for multiselect, search, grouping, pagination, infinite scroll, and more. Built to work seamlessly with Bootstrap and can be used alongside other CSS frameworks.

## Features

- ✅ Single & Multi-select
- ✅ Searchable/Filterable options
- ✅ Option grouping
- ✅ Pagination (prev/next buttons) for large datasets
- ✅ Infinite scroll (auto load-more on scroll) as an alternative to pagination
- ✅ Disable individual options
- ✅ Disable entire dropdown
- ✅ Select All/Clear All for multiselect
- ✅ Clearable selections
- ✅ Customizable placeholder
- ✅ Keyboard navigation (Arrow keys, Home/End, Enter, Space, Escape)
- ✅ Server-side pagination & search for API-driven data
- ✅ FormControl integration (ControlValueAccessor)
- ✅ Standalone component or NgModule usage
- ✅ Light/Dark/Auto theming via CSS variables
- ✅ Works with Bootstrap and other CSS frameworks

## Installation

```bash
npm install @ithouse/ngx-dropdown
# or
yarn add @ithouse/ngx-dropdown
# or
pnpm add @ithouse/ngx-dropdown
```

## Usage

### Import Module

```typescript
import { NgxDropdownModule } from '@ithouse/ngx-dropdown';

@NgModule({
  imports: [NgxDropdownModule]
})
export class AppModule {}
```

Or use the standalone component directly:

```typescript
import { DropdownComponent } from '@ithouse/ngx-dropdown';

@Component({
  standalone: true,
  imports: [DropdownComponent],
  template: `<ith-dropdown [options]="options"></ith-dropdown>`
})
export class MyComponent {}
```

### Basic Usage

```html
<ith-dropdown 
  [options]="options" 
  placeholder="Select an option"
  (selectionChange)="onSelectionChange($event)">
</ith-dropdown>
```

```typescript
options = [
  { value: 1, label: 'Option 1' },
  { value: 2, label: 'Option 2' },
  { value: 3, label: 'Option 3' }
];
```

### Multiselect

```html
<ith-dropdown 
  [options]="options" 
  [multiple]="true"
  placeholder="Select multiple options">
</ith-dropdown>
```

### Searchable

```html
<ith-dropdown 
  [options]="options" 
  [searchable]="true"
  searchPlaceholder="Type to search...">
</ith-dropdown>
```

### Grouped Options

```html
<ith-dropdown 
  [options]="groupedOptions" 
  groupBy="group"
  placeholder="Select from groups">
</ith-dropdown>
```

```typescript
groupedOptions = [
  { value: 1, label: 'Apple', group: 'Fruits' },
  { value: 2, label: 'Banana', group: 'Fruits' },
  { value: 3, label: 'Carrot', group: 'Vegetables' },
];
```

### With Pagination (prev/next buttons)

```html
<ith-dropdown 
  [options]="largeOptionsList" 
  [pageable]="true"
  [pageSize]="10">
</ith-dropdown>
```

### With Infinite Scroll (auto load on scroll)

Instead of pagination buttons, reveal options as the user scrolls to the bottom of the list:

```html
<!-- Client-side: options are sliced locally and grown on scroll -->
<ith-dropdown 
  [options]="largeOptionsList" 
  [infiniteScroll]="true"
  [pageSize]="20"
  [searchable]="true">
</ith-dropdown>
```

```html
<!-- Server-side: emits (loadMore) so you can append the next page from your API -->
<ith-dropdown 
  [options]="loadedOptions()"
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

> **Note:** `infiniteScroll` takes precedence over `pageable` when enabled. A "Load more…" button is also rendered as a fallback for keyboard/touch users.

### Keyboard Navigation

| Key | Closed dropdown | Open dropdown |
|---|---|---|
| `ArrowDown` | Opens (highlights first option) | Move to next option |
| `ArrowUp` | Opens (highlights last option) | Move to previous option |
| `Home` / `End` | — | Jump to first / last option |
| `Enter` / `Space` | Opens | Select highlighted option |
| `Escape` | — | Close dropdown |

Disabled options are skipped during navigation.

### Disabled Options

```typescript
options = [
  { value: 1, label: 'Available' },
  { value: 2, label: 'Disabled', disabled: true },
  { value: 3, label: 'Also Available' },
];
```

### With Reactive Forms

```typescript
import { FormControl } from '@angular/forms';

myControl = new FormControl();
```

```html
<ith-dropdown [options]="options" [formControl]="myControl"></ith-dropdown>
```

## API

### Inputs

| Input | Type | Default | Description |
|---|---|---|---|
| options | DropdownOption[] | [] | Array of options to display |
| placeholder | string | 'Select...' | Placeholder text |
| multiple | boolean | false | Enable multiselect |
| searchable | boolean | true | Enable search functionality |
| disabled | boolean | false | Disable the dropdown |
| clearable | boolean | true | Show clear (×) button when a value is selected |
| closeOnSelect | boolean | true | Close dropdown after selection (single select) |
| showSelectAll | boolean | true | Show Select All/Clear All in multiselect mode |
| maxHeight | string | '250px' | Max height of the options list |
| searchPlaceholder | string | 'Search...' | Search input placeholder |
| noOptionsText | string | 'No options found' | Text when filter yields nothing |
| bindLabel | string | undefined | Option property to display (falls back to label/name/text/title) |
| bindValue | string | undefined | Option property used as the value (falls back to `value`, else whole object) |
| groupBy | string | undefined | Property name to group by |
| pageable | boolean | false | Enable prev/next pagination |
| pageSize | number | 10 | Items per page / per scroll chunk |
| infiniteScroll | boolean | false | Auto load-more on scroll (takes precedence over `pageable`) |
| hasMore | boolean | true | (Server-side infinite scroll) whether more pages exist |
| serverSide | boolean | false | Disable local filtering/slicing; consumer supplies current page |
| totalItems | number | 0 | Total item count for server-side pagination UI |
| loading | boolean | false | Show loading state |
| loadingText | string | 'Loading...' | Text shown during loading |

### Outputs

| Output | Type | Description |
|---|---|---|
| selectionChange | EventEmitter<DropdownChangeEvent> | Emitted when selection changes |
| searchChange | EventEmitter<string> | Emitted when search term changes |
| openChange | EventEmitter<boolean> | Emitted when dropdown opens/closes |
| pageChange | EventEmitter<number> | Emitted when page changes (button pagination / server-side search) |
| loadMore | EventEmitter<void> | Emitted (server-side infinite scroll) when more data should be fetched |

## Styling

The component comes with default styles. It uses CSS classes with `ith-` prefix and CSS variables for theming. See [THEMING.md](./THEMING.md) for details. The component is designed to work well alongside Bootstrap — no style conflicts.

## License

MIT
