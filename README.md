# GeoIndex · Precomputed Retrieval Showcase

Interactive, static examples of remote-sensing retrieval using the existing GeoIndex BGE-M3 / FAISS index. This site is intended for reviewers to inspect saved ranking results and their evidence without running a server.

## What the demo provides

- 13 Chinese queries spanning entities, combinations, spatial relations, activities, and quantity intent.
- The original top 8 candidates per query, with exact numeric scores in the JSON downloads.
- Image thumbnails and larger RGB previews, score breakdowns, matched conditions, source descriptions, and supporting evidence.
- English and Chinese navigation; English query titles are display translations, not separately executed searches.
- A permanent precomputed-results notice. There is no live query endpoint or model inference in the browser.

The strict-match diagnostic comes from the existing GeoIndex rules and is not a human relevance judgment. Partial matches are retained. These selected examples are not an aggregate retrieval benchmark. Recorded retrieval timings are single local runs, exclude model loading and image export, and include a first-query warm-up effect.

## Open locally

Open `index.html` in a browser. All application assets are relative and bundled; no CDN or backend is needed. The `data/dataset.js` wrapper makes local file opening work without a web server. The equivalent `data/dataset.json` is available for download.

## Publish on GitHub Pages

1. Create a public repository, for example `Zwisdom03/geoindex-demo`.
2. Upload the contents of this directory to its `main` branch, with `index.html` at the repository root.
3. Open **Settings → Pages → Build and deployment**.
4. Select **Deploy from a branch**, branch **main**, folder **/(root)**, and save.
5. Wait for the Pages deployment to finish. For that repository name, the expected address is `https://zwisdom03.github.io/geoindex-demo/`.

The expected address is a deployment target; its appearance here does not establish that a deployment has completed. `.nojekyll` enables plain static-file publishing. The folder can also be published under a different repository name because internal URLs are relative.

Official guide: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site

## Export provenance

`data/provenance.json` records the actual export time, source image identifier, package versions, index-file SHA-256 hashes, retrieval-code SHA-256 hashes, and search parameters. The existing index contains 1,224 image documents and 37,025 documents in total. The web images are generated from local source imagery with the aspect ratio preserved, without embedded EXIF metadata.

The export was produced by `tools/export_pages_demo.py` in the local GeoIndex project, using `tools/pages_queries.json` and the environment image:

```
sha256:c590966647a4525a4c6c3da32b4e4e9cba4f4de0ca7d099bfc566b90b29b0f40
```

For regeneration in the project environment, run the exporter with the existing model, index, and image collection available. The exporter also supports `--defer-images` followed by `--images-only` on the image host when the Docker daemon cannot mount that drive. Original model weights and full-resolution imagery remain runtime inputs for regeneration; the published artifact consists of saved results and display previews.

## Data files

| Path | Contents |
| --- | --- |
| `data/dataset.json` | All queries and enriched results |
| `data/queries/*.json` | A single query, parsed constraints, results, scores, and evidence |
| `data/provenance.json` | Export settings and content fingerprints |
| `assets/images/*-thumbnail.webp` | Previews with a maximum side of 640 pixels |
| `assets/images/*-preview.webp` | Previews with a maximum side of 1,600 pixels |

Thumbnail and preview downloads are display derivatives, not full-resolution source downloads. Source descriptions and evidence retain their original language.
