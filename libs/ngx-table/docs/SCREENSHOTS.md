# Preview images

The documentation uses three SVG mockups so the README renders on GitHub and npm without
binary assets:

| File | Used by | Shows |
| --- | --- | --- |
| [table-overview.svg](images/table-overview.svg) | README, DOCUMENTATION, THEMING | Toolbar, purple header, rows, pagination footer |
| [table-selection.svg](images/table-selection.svg) | README, DOCUMENTATION | Selected rows, select-all checkbox, count badge, row actions |
| [table-dark.svg](images/table-dark.svg) | THEMING | Dark palette |

## Regenerating real screenshots

The mockups mirror the demo app. To capture the real component instead:

```bash
npx nx serve demo-app      # http://localhost:4300
```

Then take a screenshot of the **Data Table — client side** section (browser device toolbar,
1440 px wide works well) and save it as `docs/images/<name>.png`. Update the Markdown
references to the new file name.

For the dark image, click **🌙 Dark** in the demo header first.

## Editing the SVGs

Any editor works (Inkscape, Illustrator, Figma). Keep them self-contained — no external
fonts or images — so they render everywhere. The palette matches the component defaults:

| Role | Colour |
| --- | --- |
| Header bar | `#5b21b6` → `#7c3aed` |
| Accent | `#6d28d9` |
| Accent soft | `#ede9fe` |
| Selected row | `#f1ecff` |
| Border | `#e8eaf0` |
| Text | `#1f2937` |
| Muted | `#6b7280` |
