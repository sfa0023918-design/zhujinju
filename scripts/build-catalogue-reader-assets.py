"""Build display derivatives and page geometry; never rewrite original plates."""
import json
from pathlib import Path
from PIL import Image, ImageStat

ROOT = Path(__file__).resolve().parents[1]
content = json.loads((ROOT / "content/site-content.json").read_text())
manifest = {}
generated = 0
for exhibition in content["exhibitions"]:
    for index, source in enumerate(exhibition.get("cataloguePageImages", [])):
        original = ROOT / "public" / source.lstrip("/")
        with Image.open(original) as image:
            width, height = image.size
            spread = exhibition.get("catalogueViewMode") == "spread-images" and width > height
            entry = {"width": width, "height": height, "spread": spread}
            if index == 0 and spread:
                left = image.crop((0, 0, width // 2, height)).resize((100, 100)).convert("RGB")
                stats = ImageStat.Stat(left)
                if min(stats.mean) > 250 and max(stats.stddev) < 2:
                    entry["openingSide"] = "right"
            for variant, max_width, quality in [("reader", 2400 if spread else 1600, 85), ("thumb", 400, 78)]:
                derivative = original.parent / variant / (original.stem + ".webp")
                if not derivative.exists():
                    derivative.parent.mkdir(parents=True, exist_ok=True)
                    copy = image.convert("RGB")
                    if width > max_width:
                        copy = copy.resize((max_width, round(height * max_width / width)), Image.Resampling.LANCZOS)
                    copy.save(derivative, "WEBP", quality=quality, method=4)
                    generated += 1
                entry[variant] = "/" + str(derivative.relative_to(ROOT / "public"))
            manifest[source] = entry
    print(exhibition["slug"], "complete", flush=True)
(ROOT / "lib/catalogue-reader-assets.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
print(f"{len(manifest)} plate geometries; {generated} new derivatives", flush=True)
