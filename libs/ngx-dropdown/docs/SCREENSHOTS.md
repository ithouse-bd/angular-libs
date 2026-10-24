# Screenshots Guide

All screenshots/mockups are available in SVG format in the `docs/images/` folder. You can open them in any browser or image viewer.

## Available Mockups

| Image | Description | Use Case |
|-------|-------------|----------|
| [basic-dropdown.svg](./images/basic-dropdown.svg) | Basic single select dropdown | Default usage |
| [multiselect-dropdown.svg](./images/multiselect-dropdown.svg) | Multi-select with search and checkboxes | Multiple selections |
| [grouped-dropdown.svg](./images/grouped-dropdown.svg) | Grouped options with headers | Categorized data |
| [paginated-dropdown.svg](./images/paginated-dropdown.svg) | Client-side pagination with prev/next buttons | Large local datasets |
| [pagination-serverside.svg](./images/pagination-serverside.svg) | Server-side pagination with loading state | API-driven data |
| [infinite-scroll.svg](./images/infinite-scroll.svg) | Infinite scroll / load-more list | Long feeds |
| [theme-comparison.svg](./images/theme-comparison.svg) | Light vs Dark theme | Theme demonstration |
| [all-features-overview.svg](./images/all-features-overview.svg) | Every feature on one screen | Documentation overview |

## Converting SVG to PNG (Optional)

If you need PNG images for better compatibility:

```bash
# Using Inkscape
inkscape basic-dropdown.svg --export-type=png --export-dpi=192

# Using ImageMagick
convert -density 192 basic-dropdown.svg basic-dropdown.png

# Using rsvg-convert
rsvg-convert -d 192 -p 192 basic-dropdown.svg -o basic-dropdown.png
```

## Taking Real Screenshots

To capture actual screenshots of the working component:

1. Run the demo app: `npx nx serve demo-app`
2. Open `http://localhost:4200` in your browser
3. Use your browser's screenshot tool or OS screenshot utility
4. Save as PNG in `docs/images/` folder
5. Update the documentation to reference `.png` files instead of `.svg`

The SVG mockups provided give a good representation of the component's appearance and are perfect for documentation.
