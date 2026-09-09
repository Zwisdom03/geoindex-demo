# GeoIndex · Retrieval Showcase

Live site: https://zwisdom03.github.io/geoindex-demo/

This static demonstration lets reviewers explore saved GeoIndex remote-sensing retrieval results without a running model or backend.

## Two-page experience

1. On `index.html`, select one of 11 queries from the dropdown and confirm.
2. On `results.html`, view the original top 8 results and their ranking scores.
3. Select an image to inspect the larger preview, source description, and evidence. Additional score details are collapsed initially.
4. Return to the first page to choose another query. The previous choice and interface language are preserved.

English and Chinese navigation are available. All retrieval queries were originally executed in Chinese; English query titles are display translations. Both bare-land queries have been removed. The interface has no download controls.

## Reading the results

The scores are ranking signals, not calibrated probabilities. Explanations summarize the saved metadata and evidence. The strict-match diagnostic is based on rules, not human relevance judgments. These selected examples are not an aggregate benchmark.

The remaining results retain their original values and ranking from the September 6, 2026 export using the existing BGE-M3 / FAISS index. The index contains 1,224 image documents and 37,025 structured documents. Source and export fingerprints are recorded in `data/provenance.json`.

## Local use and maintenance

Open `index.html` in a browser. Assets are bundled with relative paths; no backend or CDN is needed. Publish this directory on GitHub Pages using `main` and `/(root)`. `.nojekyll` enables static-file publishing.

The local GeoIndex project's `tools/pages_queries.json` controls the query selection. `tools/export_pages_demo.py` creates data and preview assets; `tools/refine_pages_demo.py` updates the visible selection from existing saved results without rerunning inference.
