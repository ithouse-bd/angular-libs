# @ithouse/ngx-dropdown Documentation

A modern, feature-rich Angular dropdown/select component built for global use with full theming support.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Theming](#theming)
- [API Reference](#api-reference)
- [Usage Examples](#usage-examples)
- [Styling & Customization](#styling--customization)
- [Browser Support](#browser-support)
- [Contributing](#contributing)

## Features

| Feature | Status | Description |
|---------|--------|-------------|
| Single Select | ✅ | Basic dropdown selection |
| Multi-select | ✅ | Select multiple options with checkboxes |
| Searchable/Filterable | ✅ | Filter options by typing |
| Grouped Options | ✅ | Organize options into groups/categories |
| Pagination | ✅ | Handle large datasets with pagination |
| Disabled Options | ✅ | Disable specific options |
| Disable Dropdown | ✅ | Disable the entire component |
| Select All/Clear All | ✅ | Bulk actions in multi-select mode |
| Clearable | ✅ | Clear current selection |
| Form Control Support | ✅ | Works with Reactive Forms & Template Driven Forms |
| Dark/Light Theme | ✅ | Built-in theme support with CSS variables |
| Customizable | ✅ | Highly customizable via CSS variables |

## Installation

### NPM
```bash
npm install @ithouse/ngx-dropdown
```

### Yarn
```bash
yarn add @ithouse/ngx-dropdown
```

### PNPM
```bash
pnpm add @ithouse/ngx-dropdown
```

## Quick Start

### 1. Import the Module

```typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgxDropdownModule } from '@ithouse/ngx-dropdown';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    NgxDropdownModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

### 2. Use in Template

```html
<ith-dropdown 
  [options]="options" 
  placeholder="Choose an option"
  (selectionChange)="onChange($event)">
</ith-dropdown>
```

### 3. Define Options

```typescript
import { Component } from '@angular/core';
import { DropdownOption } from '@ithouse/ngx-dropdown';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent {
  options: DropdownOption[] = [
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' },
    { value: '3', label: 'Option 3' }
  ];

  onChange(event: any) {
    console.log('Selected:', event);
  }
}
```

> **Design Preview:** ![Basic Dropdown](./docs/images/basic-dropdown.png)
> *Basic single select dropdown in light theme*

## Theming

The dropdown comes with built-in support for light, dark, and system theme. It uses CSS custom properties for easy customization.

### Quick Theme Setup

Add `data-theme` attribute to your `html` or `body` element:

```html
<html data-theme="light">  <!-- or "dark" or "auto" -->
```

Or use the `dark` class:

```html
<html class="dark">
```

### Available Themes

| Theme | Usage | Description |
|-------|-------|-------------|
| `light` | `data-theme="light"` | Clean light theme (default) |
| `dark` | `data-theme="dark"` or `.dark` class | Modern dark theme for low-light environments |
| `auto`/`system` | `data-theme="auto"` or no attribute | Follows system preference via `prefers-color-scheme` |

> **Design Preview:** ![Theme Comparison](./docs/images/theme-comparison.png)
> *Light theme (left) vs Dark theme (right)*

### Theme Toggle Example

```typescript
// theme.service.ts
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  setTheme(theme: 'light' | 'dark' | 'auto') {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }

  getTheme(): 'light' | 'dark' | 'auto' {
    return (localStorage.getItem('theme') as any) || 'auto';
  }

  initTheme() {
    this.setTheme(this.getTheme());
  }
}
```

```html
<div class="theme-switcher">
  <button (click)="setTheme('light')">☀️ Light</button>
  <button (click)="setTheme('dark')">🌙 Dark</button>
  <button (click)="setTheme('auto')">💻 System</button>
</div>
```

## API Reference

### Inputs

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `options` | `DropdownOption[]` | `[]` | Array of options to display in dropdown |
| `config` | `DropdownConfig` | `{}` | Configuration object (alternative to individual inputs) |
| `placeholder` | `string` | `'Select...'` | Placeholder text when no selection |
| `multiple` | `boolean` | `false` | Enable multi-selection mode |
| `searchable` | `boolean` | `true` | Enable search/filter functionality |
| `disabled` | `boolean` | `false` | Disable entire dropdown |
| `pageable` | `boolean` | `false` | Enable pagination for large lists |
| `pageSize` | `number` | `10` | Number of options per page |
| `groupBy` | `string` | `undefined` | Property name to group options by |
| `showSelectAll` | `boolean` | `true` | Show "Select All" button in multi-select mode |
| `clearable` | `boolean` | `true` | Show clear button to reset selection |
| `closeOnSelect` | `boolean` | `true` | Auto-close dropdown after selection (single select only) |

### Outputs

| Event | Type | Description |
|-------|------|-------------|
| `selectionChange` | `EventEmitter<DropdownChangeEvent>` | Emits when selection changes |
| `searchChange` | `EventEmitter<string>` | Emits when search term changes |
| `openChange` | `EventEmitter<boolean>` | Emits when dropdown opens/closes |

### Interfaces

```typescript
interface DropdownOption {
  value: any;
  label: string;
  disabled?: boolean;
  group?: string;
  [key: string]: any; // Allow custom properties
}

interface DropdownConfig {
  placeholder?: string;
  searchable?: boolean;
  multiple?: boolean;
  disabled?: boolean;
  closeOnSelect?: boolean;
  maxHeight?: string;
  showSelectAll?: boolean;
  clearable?: boolean;
  searchPlaceholder?: string;
  noOptionsText?: string;
  pageable?: boolean;
  pageSize?: number;
  groupBy?: string;
}

interface DropdownChangeEvent {
  value: any | any[];
  selectedOptions: DropdownOption | DropdownOption[];
}
```

## Usage Examples

### 1. Multi-select with Search

```html
<ith-dropdown 
  [options]="countries" 
  [multiple]="true"
  [searchable]="true"
  placeholder="Select countries">
</ith-dropdown>
```

> **Design Preview:** ![Multi-select Dropdown](./docs/images/multiselect-dropdown.png)
> *Multi-select with checkboxes and search functionality*

### 2. Grouped Options

```typescript
groupedOptions: DropdownOption[] = [
  { value: 'ny', label: 'New York', group: 'USA' },
  { value: 'la', label: 'Los Angeles', group: 'USA' },
  { value: 'london', label: 'London', group: 'UK' },
  { value: 'manchester', label: 'Manchester', group: 'UK' },
  { value: 'tokyo', label: 'Tokyo', group: 'Japan' },
];
```

```html
<ith-dropdown 
  [options]="groupedOptions" 
  [groupBy]="'group'"
  placeholder="Select a city">
</ith-dropdown>
```

> **Design Preview:** ![Grouped Dropdown](./docs/images/grouped-dropdown.png)
> *Options organized by groups with sticky headers*

### 3. With Pagination (Large Datasets)

```html
<ith-dropdown 
  [options]="largeDataset" 
  [pageable]="true"
  [pageSize]="15"
  [searchable]="true"
  placeholder="Search from 1000+ items">
</ith-dropdown>
```

> **Design Preview:** ![Paginated Dropdown](./docs/images/paginated-dropdown.png)
> *Pagination controls for handling large option lists*

### 4. With Disabled Options

```typescript
options: DropdownOption[] = [
  { value: 'active1', label: 'Active Option' },
  { value: 'disabled1', label: 'Disabled Option', disabled: true },
  { value: 'active2', label: 'Another Active Option' },
];
```

```html
<ith-dropdown [options]="options" placeholder="Select option"></ith-dropdown>
```

### 5. Reactive Forms Integration

```typescript
import { FormBuilder, FormGroup } from '@angular/forms';

export class MyComponent {
  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      country: [['us', 'uk']], // Multi-select with initial values
      city: ['ny'] // Single select
    });
  }

  onSubmit() {
    console.log(this.form.value);
  }
}
```

```html
<form [formGroup]="form" (ngSubmit)="onSubmit()">
  <ith-dropdown 
    [options]="countries" 
    [multiple]="true"
    formControlName="country">
  </ith-dropdown>
  
  <ith-dropdown 
    [options]="cities" 
    formControlName="city">
  </ith-dropdown>
  
  <button type="submit">Submit</button>
</form>
```

## Styling & Customization

### CSS Variables

You can override the default theme variables to create your own custom theme.

```css
/* Custom theme */
.my-custom-theme .ith-dropdown {
  --ith-bg: #f9f9f9;
  --ith-text: #333333;
  --ith-border: #e0e0e0;
  --ith-border-focus: #6c5ce7;
  --ith-shadow-focus: rgba(108, 92, 231, 0.25);
  --ith-hover-bg: #f1f1f1;
  --ith-selected-bg: #f3f0ff;
  --ith-selected-text: #6c5ce7;
  --ith-selected-hover-bg: #e9e5ff;
}
```

```html
<div class="my-custom-theme">
  <ith-dropdown [options]="options"></ith-dropdown>
</div>
```

### Available CSS Variables

| Variable | Light Default | Dark Default | Purpose |
|----------|---------------|--------------|---------|
| `--ith-bg` | `#ffffff` | `#1e1e1e` | Background color |
| `--ith-text` | `#212529` | `#e1e1e1` | Text color |
| `--ith-border` | `#ced4da` | `#3d3d3d` | Border color |
| `--ith-border-focus` | `#86b7fe` | `#4dabf7` | Focus border color |
| `--ith-shadow-focus` | `rgba(13, 110, 253, 0.25)` | `rgba(77, 171, 247, 0.25)` | Focus shadow |
| `--ith-hover-bg` | `#f8f9fa` | `#2d2d2d` | Hover background |
| `--ith-selected-bg` | `#e7f1ff` | `#1a365d` | Selected item background |
| `--ith-selected-text` | `#0d6efd` | `#63b3ed` | Selected item text |
| `--ith-placeholder` | `#6c757d` | `#a0a0a0` | Placeholder text color |
| `--ith-panel-shadow` | `0 0.5rem 1rem rgba(0, 0, 0, 0.15)` | `0 0.5rem 1rem rgba(0, 0, 0, 0.5)` | Dropdown panel shadow |

### Class-based Customization

You can also target specific classes for more granular control:

```css
/* Customize trigger */
.ith-dropdown-trigger {
  border-radius: 8px;
  padding: 10px 14px;
}

/* Customize options */
.ith-dropdown-option {
  font-size: 14px;
}

/* Customize selected state */
.ith-dropdown-option-selected {
  font-weight: 600;
}
```

## Design Guidelines

For the best user experience, follow these guidelines:

- **Width**: The dropdown takes full width by default. Use container constraints as needed.
- **Height**: Default max-height is 250px. Adjust via `config.maxHeight` for your use case.
- **Search**: Enable search for lists with 10+ items for better UX.
- **Pagination**: Use pagination for lists with 50+ items to improve performance.
- **Grouping**: Use grouping when options have logical categories.
- **Accessibility**: The component includes ARIA attributes for screen readers.

> **Design Preview:** ![All Features Overview](./docs/images/all-features-overview.png)
> *Overview of all dropdown features in action*

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome | Latest |
| Firefox | Latest |
| Safari | Latest |
| Edge | Latest |
| Opera | Latest |

## Screenshots Guide

To make the documentation even better, add these screenshots to `docs/images/` folder:

- `basic-dropdown.png` - Basic single select
- `multiselect-dropdown.png` - Multi-select with checkboxes
- `grouped-dropdown.png` - Grouped options
- `paginated-dropdown.png` - With pagination
- `theme-comparison.png` - Light vs Dark side by side
- `all-features-overview.png` - Comprehensive view
- `form-integration.png` - With Angular forms

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © iTHouse
