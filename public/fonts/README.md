# Editorial fonts

The public site uses Source Han Serif SC Regular (Adobe, SIL OFL 1.1) for Chinese headings and Source Serif 4 Regular (Adobe, SIL OFL 1.1) for English titles. License files are included here. Admin typography is unchanged.

Sources: https://github.com/adobe-fonts/source-han-serif and https://github.com/adobe-fonts/source-serif

Source Han Serif is subset and renamed `ZhujinjuSong-Regular`. The core WOFF2 contains the homepage headings plus punctuation and Latin characters. Disjoint Unicode blocks provide remaining glyphs on demand, including future CMS titles. The browser never downloads the 24 MB source OTF. No external font service is needed.

To rebuild with fontTools and Brotli installed:

```sh
python scripts/build-editorial-fonts.py /path/to/source-font-directory
```

That directory must contain `SourceHanSerifSC-Regular.otf`, `SourceSerif4-Regular.woff2`, `LICENSE-han.txt`, and `LICENSE-source-serif.md`. Generated font rules live in `app/(site)/editorial-fonts.css`.

## Contemporary preview (batch 1)

The Regular Chinese face and Source Serif 4 files above are retained. The new
Chinese Medium face uses Adobe Source Han Serif SC Medium (SIL OFL 1.1), renamed
`ZhujinjuSong-Medium` and partitioned into the same disjoint Unicode blocks as
Regular. Source OTFs are never served to browsers.

- Source Han Serif SC Medium: https://github.com/adobe-fonts/source-han-serif/blob/release/OTF/SimplifiedChinese/SourceHanSerifSC-Medium.otf (`LICENSE-han.txt`).
- Instrument Serif Regular/Italic: https://github.com/google/fonts/tree/main/ofl/instrumentserif (`LICENSE-instrument-serif.txt`).
- Instrument Sans variable, width 100 and weights 400–600: https://github.com/google/fonts/tree/main/ofl/instrumentsans (`LICENSE-instrument-sans.txt`).
- Anton Regular: https://github.com/google/fonts/tree/main/ofl/anton (`LICENSE-anton.txt`).

All are SIL OFL 1.1. Latin WOFF2 subsets cover supported glyphs in Basic Latin,
Latin-1, Latin Extended-A, U+2010–2027 and U+2030–203A. Source Serif 4 remains the
fallback for additional transliteration characters. All `@font-face` rules use
`font-display: swap`; only the public site imports these styles.

Rebuild with `python scripts/build-contemporary-fonts.py /path/to/downloaded-fonts`.
The source directory contains `SourceHanSerifSC-Medium.otf`,
`InstrumentSerif-Regular.ttf`, `InstrumentSerif-Italic.ttf`, `InstrumentSans.ttf`
(the upstream `InstrumentSans[wdth,wght].ttf`), `Anton-Regular.ttf`, and the three
Latin license files named above. Generated rules: `app/(site)/contemporary-fonts.css`.

## Reading subsets (2026-11-15)

The public layout now imports `reading-fonts.css`. Chinese Regular and Medium
retain the exact Source Han Serif SC 2.003 glyphs, metrics, weights and licenses.
Common titles form a small core; remaining current-site text is grouped by use.
The old disjoint Unicode blocks remain available for characters introduced later
through the CMS. Their advertised ranges exclude the new groups, so coverage
is complete without duplicate downloads. Latin faces are unchanged.

Rebuild with `python scripts/build-reading-fonts.py /path/to/source-fonts`, using
the original Regular and Medium OTFs. Content hashes in new asset filenames
prevent cache conflicts. `lib/data/reading-fonts.json` records glyph counts,
sizes and the preload filenames. Existing font assets are retained.
