#!/usr/bin/env python3

import argparse
import json
from pathlib import Path
from typing import Any

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
CONTENT_PATH = ROOT / "content" / "site-content.json"
PUBLIC_PATH = ROOT / "public"
CARD_MAX_WIDTH = 1200
CARD_MAX_HEIGHT = 1600
CARD_QUALITY = 88


def is_upload_url(value: str) -> bool:
    return isinstance(value, str) and value.startswith("/uploads/")


def public_url_to_path(url: str) -> Path:
    return PUBLIC_PATH / url.removeprefix("/")


def build_card_url(original_url: str) -> str:
    path = Path(original_url)
    return str(path.with_name(f"{path.stem}-card{path.suffix}"))


def get_image_size(path: Path) -> tuple[int, int]:
    with Image.open(path) as image:
        image = ImageOps.exif_transpose(image)
        return image.size


def ensure_card_variant(original_url: str, dry_run: bool) -> tuple[str, int, int, bool]:
    original_path = public_url_to_path(original_url)
    if not original_path.exists():
        raise FileNotFoundError(f"Missing source image: {original_url}")

    width, height = get_image_size(original_path)
    card_url = build_card_url(original_url)
    card_path = public_url_to_path(card_url)

    if width <= CARD_MAX_WIDTH and height <= CARD_MAX_HEIGHT:
        return original_url, width, height, False

    if card_path.exists():
        return card_url, width, height, False

    if not dry_run:
        card_path.parent.mkdir(parents=True, exist_ok=True)
        with Image.open(original_path) as image:
            image = ImageOps.exif_transpose(image).convert("RGB")
            image.thumbnail((CARD_MAX_WIDTH, CARD_MAX_HEIGHT), Image.Resampling.LANCZOS)
            save_kwargs: dict[str, Any] = {
                "quality": CARD_QUALITY,
                "optimize": True,
            }
            if card_path.suffix.lower() in {".jpg", ".jpeg"}:
                save_kwargs["format"] = "JPEG"
                save_kwargs["progressive"] = True
            image.save(card_path, **save_kwargs)

    return card_url, width, height, True


def normalize_asset(asset: Any, original_url: str, card_url: str, width: int, height: int) -> dict[str, Any]:
    existing = asset if isinstance(asset, dict) else {}
    return {
        "original": existing.get("original") or original_url,
        "card": existing.get("card") or card_url,
        "hero": existing.get("hero") or original_url,
        "detail": existing.get("detail") or original_url,
        "width": existing.get("width") or width,
        "height": existing.get("height") or height,
    }


def backfill_artworks(data: dict[str, Any], dry_run: bool) -> dict[str, int]:
    created = 0
    updated = 0

    for artwork in data.get("artworks", []):
        image = artwork.get("image", "")
        if is_upload_url(image):
            card_url, width, height, generated = ensure_card_variant(image, dry_run)
            artwork["imageAsset"] = normalize_asset(artwork.get("imageAsset"), image, card_url, width, height)
            updated += 1
            if generated:
                created += 1

        gallery = artwork.get("gallery") or []
        gallery_assets = artwork.get("galleryAssets") or []
        next_assets = []
        changed = False

        for index, url in enumerate(gallery):
            current_asset = gallery_assets[index] if index < len(gallery_assets) else None
            if is_upload_url(url):
                card_url, width, height, generated = ensure_card_variant(url, dry_run)
                next_assets.append(normalize_asset(current_asset, url, card_url, width, height))
                updated += 1
                changed = True
                if generated:
                    created += 1
            else:
                next_assets.append(current_asset)

        if changed or gallery_assets:
            artwork["galleryAssets"] = next_assets

    return {"created": created, "updated": updated}


def backfill_exhibitions(data: dict[str, Any], dry_run: bool) -> dict[str, int]:
    created = 0
    updated = 0

    for exhibition in data.get("exhibitions", []):
        cover = exhibition.get("cover", "")
        if not is_upload_url(cover):
            continue

        card_url, width, height, generated = ensure_card_variant(cover, dry_run)
        exhibition["coverAsset"] = normalize_asset(exhibition.get("coverAsset"), cover, card_url, width, height)
        updated += 1
        if generated:
            created += 1

    return {"created": created, "updated": updated}


def backfill_articles(data: dict[str, Any], dry_run: bool) -> dict[str, int]:
    created = 0
    updated = 0

    for article in data.get("articles", []):
        cover = article.get("cover", "")
        if not is_upload_url(cover):
            continue

        card_url, width, height, generated = ensure_card_variant(cover, dry_run)
        article["coverAsset"] = normalize_asset(article.get("coverAsset"), cover, card_url, width, height)
        updated += 1
        if generated:
            created += 1

    return {"created": created, "updated": updated}


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Backfill imageAsset/coverAsset/galleryAssets with conservative card variants.",
    )
    parser.add_argument("--dry-run", action="store_true", help="Preview changes without writing files.")
    args = parser.parse_args()

    data = json.loads(CONTENT_PATH.read_text(encoding="utf-8"))

    artwork_stats = backfill_artworks(data, args.dry_run)
    exhibition_stats = backfill_exhibitions(data, args.dry_run)
    article_stats = backfill_articles(data, args.dry_run)

    if not args.dry_run:
        CONTENT_PATH.write_text(
            json.dumps(data, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

    summary = {
        "dry_run": args.dry_run,
        "artworks": artwork_stats,
        "exhibitions": exhibition_stats,
        "articles": article_stats,
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
