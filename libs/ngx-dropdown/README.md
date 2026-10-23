# @ithouse/ngx-dropdown

Advanced Angular dropdown/select component with support for multiselect, search, grouping, pagination, and more. Built to work seamlessly with Bootstrap and can be used alongside other CSS frameworks.

## Features

- ✅ Single & Multi-select
- ✅ Searchable/Filterable options
- ✅ Option grouping
- ✅ Pagination support for large datasets
- ✅ Disable individual options
- ✅ Disable entire dropdown
- ✅ Select All/Clear All for multiselect
- ✅ Clearable selections
- ✅ Customizable placeholder
- ✅ Keyboard navigation support
- ✅ FormControl integration (ControlValueAccessor)
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

### With Pagination

```html
<ith-dropdown 
  [options]="largeOptionsList" 
  [pageable]="true"
  [pageSize]="10">
</ith-dropdown>
```

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
| config | DropdownConfig | {} | Configuration object |
| placeholder | string | 'Select...' | Placeholder text |
| multiple | boolean | false | Enable multiselect |
| searchable | boolean | true | Enable search functionality |
| disabled | boolean | false | Disable the dropdown |
| pageable | boolean | false | Enable pagination |
| pageSize | number | 10 | Number of items per page |
| groupBy | string | undefined | Property name to group by |
| showSelectAll | boolean | true | Show select all in multiselect mode |
| clearable | boolean | true | Allow clearing selection |
| closeOnSelect | boolean | true | Close dropdown after selection (single select) |

### Outputs

| Output | Type | Description |
|---|---|---|
| selectionChange | EventEmitter<DropdownChangeEvent> | Emitted when selection changes |
| searchChange | EventEmitter<string> | Emitted when search term changes |
| openChange | EventEmitter<boolean> | Emitted when dropdown opens/closes |

## Styling

The component comes with default styles. It uses CSS classes with `ith-` prefix. You can override them to customize the appearance. The component is designed to work well alongside Bootstrap - no style conflicts.

## License

MIT
