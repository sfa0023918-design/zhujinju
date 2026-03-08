import { execSync } from "node:child_process";

const siteBaseUrl = process.env.SITE_BASE_URL ?? "https://www.zhujinju.com";

function readRemoteContent() {
  return JSON.parse(execSync("git show origin/main:content/site-content.json", { encoding: "utf8" }));
}

function readRemoteFile(repoPath) {
  try {
    execSync(`git cat-file -e origin/main:${repoPath}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

async function fetchHtml(url) {
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`请求失败：${url} -> ${response.status}`);
  }

  return await response.text();
}

async function main() {
  const content = readRemoteContent();
  const issues = [];

  for (const artwork of content.artworks) {
    const expectedMedia = [artwork.image, ...(artwork.gallery ?? [])].filter(Boolean);
    const pageUrl = `${siteBaseUrl}/collection/${artwork.slug}`;
    const html = await fetchHtml(pageUrl);

    for (const mediaPath of expectedMedia) {
      if (mediaPath.startsWith("/api/placeholder/")) {
        continue;
      }

      const repoPath = `public${mediaPath}`;
      if (!readRemoteFile(repoPath)) {
        issues.push(`[missing-file] ${artwork.slug}: ${repoPath}`);
      }

      if (!html.includes(mediaPath)) {
        issues.push(`[missing-render] ${artwork.slug}: ${mediaPath}`);
      }
    }
  }

  if (issues.length) {
    console.error("Artwork media audit failed:");
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }
    process.exit(1);
  }

  console.log(`Artwork media audit passed for ${content.artworks.length} artworks.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
