# Theming Guide for @ithouse/ngx-dropdown

This guide will help you customize the appearance of the dropdown to match your application's design system.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Theme Modes](#theme-modes)
- [CSS Custom Properties](#css-custom-properties)
- [Creating Custom Themes](#creating-custom-themes)
- [Integration Examples](#integration-examples)
- [Tips & Best Practices](#tips--best-practices)

## Overview

The dropdown uses CSS Custom Properties (variables) for all colors, making it easy to theme without overriding individual styles. It supports:

- **Light theme** (default)
- **Dark theme**
- **Auto/System theme** (follows OS preference)
- **Custom themes** (completely your own design)

## Quick Start

### Step 1: Set up theme switching

Add the `data-theme` attribute to your root element:

```html
<!DOCTYPE html>
<html lang="en" data-theme="light">
  ...
</html>
```

### Step 2: Use the dropdown as normal

No additional configuration needed. The dropdown will automatically pick up the theme.

```html
<ith-dropdown [options]="options"></ith-dropdown>
```

## Theme Modes

### 1. Light Theme (Default)
```html
<html data-theme="light">
```

### 2. Dark Theme
```html
<html data-theme="dark">
<!-- or -->
<html class="dark">
```

### 3. System/Auto Theme
Respects user's OS preference (light/dark mode):

```html
<html data-theme="auto">
<!-- or simply omit data-theme attribute -->
<html>
```

The component uses `@media (prefers-color-scheme: dark)` to detect system preference when in auto mode.

## CSS Custom Properties

All themeable properties are defined on the `.ith-dropdown` class. Override them in your CSS.

### Core Colors

| Variable | Description | Light | Dark |
|----------|-------------|-------|------|
| `--ith-bg` | Background color of trigger and panel | `#ffffff` | `#1e1e1e` |
| `--ith-text` | Main text color | `#212529` | `#e1e1e1` |
| `--ith-border` | Default border color | `#ced4da` | `#3d3d3d` |
| `--ith-placeholder` | Placeholder text color | `#6c757d` | `#a0a0a0` |

### Interactive States

| Variable | Description | Light | Dark |
|----------|-------------|-------|------|
| `--ith-border-focus` | Border color when focused/open | `#86b7fe` | `#4dabf7` |
| `--ith-shadow-focus` | Focus ring shadow | `rgba(13, 110, 253, 0.25)` | `rgba(77, 171, 247, 0.25)` |
| `--ith-hover-bg` | Background on hover | `#f8f9fa` | `#2d2d2d` |
| `--ith-selected-bg` | Background for selected items | `#e7f1ff` | `#1a365d` |
| `--ith-selected-text` | Text color for selected items | `#0d6efd` | `#63b3ed` |
| `--ith-selected-hover-bg` | Background for selected items on hover | `#d0e3ff` | `#2a4365` |

### Panel & Groups

| Variable | Description | Light | Dark |
|----------|-------------|-------|------|
| `--ith-panel-shadow` | Dropdown panel shadow | `0 0.5rem 1rem rgba(0, 0, 0, 0.15)` | `0 0.5rem 1rem rgba(0, 0, 0, 0.5)` |
| `--ith-group-bg` | Group header background | `#f8f9fa` | `#252525` |
| `--ith-group-text` | Group header text | `#495057` | `#b0b0b0` |
| `--ith-action-bg` | Action bar/pagination background | `#f8f9fa` | `#252525` |

### Disabled State

| Variable | Description | Light | Dark |
|----------|-------------|-------|------|
| `--ith-disabled-bg` | Background when disabled | `#e9ecef` | `#2d2d2d` |
| `--ith-disabled-opacity` | Opacity when disabled | `0.6` | `0.5` |

## Creating Custom Themes

### Example 1: Purple Theme

```css
[data-theme="purple"] .ith-dropdown {
  --ith-bg: #ffffff;
  --ith-text: #2d3436;
  --ith-border: #ddd6fe;
  --ith-border-focus: #8b5cf6;
  --ith-shadow-focus: rgba(139, 92, 246, 0.25);
  --ith-hover-bg: #f5f3ff;
  --ith-selected-bg: #f3f0ff;
  --ith-selected-text: #7c3aed;
  --ith-selected-hover-bg: #e9e5ff;
  --ith-placeholder: #6b7280;
  --ith-panel-shadow: 0 10px 15px -3px rgba(139, 92, 246, 0.1);
}
```

Usage:
```html
<html data-theme="purple">
  <ith-dropdown [options]="options"></ith-dropdown>
</html>
```

### Example 2: Bootstrap-inspired Theme

```css
[data-theme="bootstrap"] .ith-dropdown {
  --ith-bg: #ffffff;
  --ith-text: #212529;
  --ith-border: #dee2e6;
  --ith-border-focus: #86b7fe;
  --ith-shadow-focus: rgba(13, 110, 253, 0.25);
  --ith-hover-bg: #f8f9fa;
  --ith-selected-bg: #0d6efd;
  --ith-selected-text: #ffffff;
  --ith-selected-hover-bg: #0b5ed7;
  --ith-border-radius: 0.375rem;
}
```

### Example 3: Material Design Theme

```css
[data-theme="material"] .ith-dropdown {
  --ith-bg: #ffffff;
  --ith-text: #1f1f1f;
  --ith-border: transparent;
  --ith-border-focus: #6750a4;
  --ith-shadow-focus: rgba(103, 80, 164, 0.12);
  --ith-hover-bg: #f7f2fa;
  --ith-selected-bg: #e8def8;
  --ith-selected-text: #1d192b;
  --ith-selected-hover-bg: #e6e0e9;
  --ith-panel-shadow: 0px 1px 2px rgba(0, 0, 0, 0.3), 0px 2px 6px 2px rgba(0, 0, 0, 0.15);
}
```

## Integration Examples

### With Angular Service

```typescript
import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type Theme = 'light' | 'dark' | 'auto' | string;

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'app-theme';

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.loadTheme();
  }

  setTheme(theme: Theme): void {
    this.document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(this.THEME_KEY, theme);
  }

  getTheme(): Theme {
    return localStorage.getItem(this.THEME_KEY) as Theme || 'auto';
  }

  loadTheme(): void {
    this.setTheme(this.getTheme());
  }

  toggleTheme(): void {
    const current = this.getTheme();
    if (current === 'light') this.setTheme('dark');
    else if (current === 'dark') this.setTheme('auto');
    else this.setTheme('light');
  }
}
```

### With Angular Material / Bootstrap

The dropdown is designed to work alongside other UI libraries. Since it uses isolated CSS variables with `ith-` prefix classes, there are no style conflicts.

```html
<!-- Works with Bootstrap -->
<div class="row">
  <div class="col-md-6">
    <label class="form-label">Country</label>
    <ith-dropdown [options]="countries"></ith-dropdown>
  </div>
</div>
```

```html
<!-- Works with Tailwind (use our tw- prefixed utilities) -->
<div class="tw-space-y-4">
  <ith-dropdown [options]="options" class="tw-w-full"></ith-dropdown>
</div>
```

## Tips & Best Practices

1. **Use data-theme on html/body** - Apply theme to a high-level element so all dropdowns inherit it
2. **Persist user preference** - Save theme choice in localStorage for better UX
3. **Support system preference** - Use `auto` mode to respect OS settings
4. **Keep accessibility in mind** - Ensure sufficient contrast ratios in custom themes (WCAG AA minimum)
5. **Test both themes** - Always test your custom theme in both light and dark modes
6. **Use semantic colors** - Consider using CSS variables from your design system
7. **Scope themes if needed** - Apply themes to specific containers for multi-theme sections

## Recommended Color Palettes

### Modern Dark Theme
```css
[data-theme="modern-dark"] .ith-dropdown {
  --ith-bg: #0f172a;
  --ith-text: #e2e8f0;
  --ith-border: #334155;
  --ith-border-focus: #3b82f6;
  --ith-shadow-focus: rgba(59, 130, 246, 0.3);
  --ith-hover-bg: #1e293b;
  --ith-selected-bg: #1e3a8a;
  --ith-selected-text: #93c5fd;
  --ith-selected-hover-bg: #1e40af;
  --ith-placeholder: #64748b;
  --ith-panel-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
}
```

### Clean Minimal Theme
```css
[data-theme="minimal"] .ith-dropdown {
  --ith-bg: #ffffff;
  --ith-text: #1a1a1a;
  --ith-border: #e5e5e5;
  --ith-border-focus: #000000;
  --ith-shadow-focus: rgba(0, 0, 0, 0.1);
  --ith-hover-bg: #fafafa;
  --ith-selected-bg: #f5f5f5;
  --ith-selected-text: #000000;
  --ith-selected-hover-bg: #eeeeee;
  --ith-placeholder: #737373;
}
```

Need help with theming? Check out our [Documentation](./DOCUMENTATION.md) or open an issue on GitHub.
