# Tailwind Bootstrap Workspace

This Nx monorepo contains:
- **Tailwind CSS Library** (`libs/tailwind-styles`) - Tailwind CSS configured with `tw-` prefix to avoid conflicts with Bootstrap
- **UI Components Library** (`libs/ui-components`) - Reusable Angular components using Tailwind CSS
- **Dropdown Library** (`libs/ngx-dropdown`) - Advanced dropdown component with multiselect, search, grouping, pagination features
- **Demo App** (`apps/demo-app`) - Example app showing Tailwind + Bootstrap integration

## Dropdown Library Name Suggestions for @ithouse org

For publishing to the iTHouse GitHub organization, here are some recommended package names:

1. **`@ithouse/ngx-dropdown`** (Recommended) - Clean, follows Angular package naming conventions, clearly describes the component
2. **`@ithouse/ngx-select`** - Shorter alternative, common naming for select/dropdown components
3. **`@ithouse/iselect`** - Very short and memorable
4. **`@ithouse/ng-select`** - Similar to popular ng-select but namespaced to your org
5. **`@ithouse/ui-dropdown`** - Good if you want a more generic UI component name

I recommend **`@ithouse/ngx-dropdown`** as it's descriptive, follows the ngx- prefix convention used by Angular ecosystem libraries, and clearly indicates it's an Angular component.

## Setup

```bash
npm install
```

## Development

```bash
# Serve the demo app
npx nx serve demo-app

# Build the dropdown library
npx nx build ngx-dropdown

# Build all projects
npx nx build
```

## Using Tailwind with Bootstrap

The tailwind-styles library is configured with:
- `prefix: 'tw-'` - All Tailwind utilities are prefixed to avoid conflicts with Bootstrap
- `preflight: false` - Bootstrap's reset/normalize is preserved

To use in your app:

1. Import Tailwind styles in your app's styles
2. Use Tailwind classes with `tw-` prefix: `tw-bg-blue-500`, `tw-p-4`, etc.
3. Use Bootstrap classes normally: `btn btn-primary`, `card`, etc.

## Publishing the Dropdown Library

```bash
# Build the library
npx nx build ngx-dropdown --configuration=production

# Publish from dist folder
cd dist/libs/ngx-dropdown
npm publish --access public
```
