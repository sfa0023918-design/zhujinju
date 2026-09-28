# Editorial fonts

The public site uses Source Han Serif SC Regular (Adobe, SIL OFL 1.1) for Chinese headings and Source Serif 4 Regular (Adobe, SIL OFL 1.1) for English titles. License files are included here. Admin typography is unchanged.

Sources: https://github.com/adobe-fonts/source-han-serif and https://github.com/adobe-fonts/source-serif

Source Han Serif is subset and renamed `ZhujinjuSong-Regular`. The core WOFF2 contains the homepage headings plus punctuation and Latin characters. Disjoint Unicode blocks provide remaining glyphs on demand, including future CMS titles. The browser never downloads the 24 MB source OTF. No external font service is needed.

To rebuild with fontTools and Brotli installed:

```sh
python scripts/build-editorial-fonts.py /path/to/source-font-directory
```

That directory must contain `SourceHanSerifSC-Regular.otf`, `SourceSerif4-Regular.woff2`, `LICENSE-han.txt`, and `LICENSE-source-serif.md`. Generated font rules live in `app/(site)/editorial-fonts.css`.
