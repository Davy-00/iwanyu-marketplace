# Product export (CSV → JSON + images)

Use this helper to export a Shopify-style product CSV into:
- Full raw rows (every column preserved)
- Grouped products (by `Handle`) with variants + images
- Downloaded images into folders by handle
- A manifest CSV mapping each row to local image files

## Run

```bash
node scripts/export-shopify-csv.mjs /absolute/path/to/products_export.csv --out export/products_export
```

## Output

The output directory contains:
- `raw-rows.json` — every CSV row with all columns preserved
- `products.json` — products grouped by `Handle` with `variants` and `images`
- `images/` — downloaded files, grouped by handle
- `images-manifest.csv` — mapping: `handle,row_index,field,url,local_path,bytes,error`

## Notes

- Images are downloaded from `Image Src` and `Variant Image` columns.
- Duplicate image URLs are downloaded once (manifest still records each row occurrence).
