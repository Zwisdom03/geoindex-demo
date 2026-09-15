# GeoIndex · Retrieval Showcase

Live site: https://zwisdom03.github.io/geoindex-demo/

This static demonstration lets reviewers explore frozen GeoIndex v2 results on RSITMD-GeoIndex Lite Benchmark v1.0 without a running model or backend.

## Two-page experience

1. On `index.html`, select one of 12 official benchmark queries across Keyword, Multi-constraint, Spatial relation, and Natural language types.
2. On `results.html`, view the frozen Top-10 results and their ranking scores.
3. Select an image to inspect the larger preview, source description, and evidence. Additional score details are collapsed initially.
4. Return to the first page to choose another query. The previous choice and interface language are preserved.

English and Chinese navigation are available. Retrieval uses the official English benchmark query text; Chinese titles are display translations. The interface has no download controls.

## Reading the results

The scores are ranking signals, not calibrated probabilities. Explanations summarize the saved metadata and evidence. The strict-match diagnostic is based on rules, not human relevance judgments. These selected examples are not an aggregate benchmark.

The displayed results were regenerated with the frozen `rsitmd-geoindex-v2-signed-evidence-v1` profile. The release contains 452 gallery images; 451 are indexed because `farmland_132.tif` is absent from the frozen index. Retrieval scans the full indexed gallery using the v2 SQLite structured index, Qwen3-Embedding-0.6B description vectors, and signed structure/relation evidence fusion. Database text comes from Qwen3.7-Plus visual annotations, not RSITMD human captions. Source and export fingerprints are recorded in `data/provenance.json`.

## Local use and maintenance

Open `index.html` in a browser. Assets are bundled with relative paths; no backend or CDN is needed. Publish this directory on GitHub Pages using `main` and `/(root)`. `.nojekyll` enables static-file publishing.

The local GeoIndex project's `tools/pages_queries.json` controls the selected official queries. `tools/export_pages_demo_rsitmd_v2.py` runs the frozen profile and creates the saved data and preview assets.
