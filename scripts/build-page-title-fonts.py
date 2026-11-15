"""Subset the existing shared title font by rendered public route.

Usage: python scripts/build-page-title-fonts.py /path/to/rendered-usage.json
The input maps route paths to Song text collected from a production browser
render (including below-fold text). Collection/home additionally include every
published artwork title, preserving filters, pagination and carousel changes.
Full route copy is included even when it is initially folded or hidden by a
language switch. Original font files remain the fallback for later CMS edits
and new routes.
"""
import argparse
import hashlib
import json
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import RecordingPen

root = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser()
parser.add_argument("usage", type=Path)
args = parser.parse_args()
usage = json.loads(args.usage.read_text())
content = json.loads((root / "content/site-content.json").read_text())
manifest = json.loads((root / "lib/data/reading-fonts.json").read_text())
source = root / "public/fonts" / manifest["core"]["400"]
original = TTFont(source)
available = set(original.getBestCmap())
titles = "".join(a["title"]["zh"] for a in content["artworks"] if a.get("publicationStatus") != "draft")


def non_ascii_copy(value):
    if isinstance(value, str):
        return "".join(c for c in value if ord(c) > 127)
    if isinstance(value, dict):
        return "".join(non_ascii_copy(v) for v in value.values())
    if isinstance(value, list):
        return "".join(non_ascii_copy(v) for v in value)
    return ""


route_copy = {
    f"/{prefix}/{item['slug']}": non_ascii_copy(item)
    for section, prefix in (("artworks", "collection"), ("exhibitions", "exhibitions"), ("articles", "journal"))
    for item in content[section]
}
result = {}
for route, text in sorted(usage.items()):
    text += route_copy.get(route, "")
    if route in ("/", "/collection"):
        text += titles
    glyphs = set(map(ord, text)) & available
    if not glyphs:
        continue
    font = TTFont(source, recalcTimestamp=False)
    options = subset.Options()
    options.flavor = "woff2"
    options.recalc_timestamp = False
    sub = subset.Subsetter(options=options)
    sub.populate(unicodes=glyphs)
    sub.subset(font)
    font.flavor = "woff2"
    temporary = root / "public/fonts/.page-title.woff2"
    font.save(temporary)
    digest = hashlib.sha256(temporary.read_bytes()).hexdigest()[:12]
    target = temporary.with_name(f"page-title-{digest}.woff2")
    temporary.replace(target)
    checked = TTFont(target)
    assert set(checked.getBestCmap()) == glyphs
    for metric in ("ascent", "descent", "lineGap"):
        assert getattr(original["hhea"], metric) == getattr(checked["hhea"], metric)
    for cp in glyphs:
        assert original["hmtx"][original.getBestCmap()[cp]] == checked["hmtx"][checked.getBestCmap()[cp]]
        pens = []
        for f in (original, checked):
            pen = RecordingPen()
            f.getGlyphSet()[f.getBestCmap()[cp]].draw(pen)
            pens.append(pen.value)
        assert pens[0] == pens[1], (route, cp)
    result[route] = target.name
    print(route, len(glyphs), target.stat().st_size, flush=True)
(root / "lib/data/page-title-fonts.json").write_text(json.dumps(result, indent=2) + "\n")
