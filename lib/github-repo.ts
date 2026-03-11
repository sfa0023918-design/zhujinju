type GitHubRepoConfig = {
  token: string;
  owner: string;
  repo: string;
  branch: string;
};

const DEV_PUBLIC_REPO_FALLBACK =
  process.env.NODE_ENV !== "production"
    ? {
        owner: "sfa0023918-design",
        repo: "zhujinju",
        branch: "main",
      }
    : null;

function getGitHubRepoConfig(): GitHubRepoConfig | null {
  const token = process.env.GITHUB_CONTENTS_TOKEN;
  const owner = process.env.GITHUB_REPO_OWNER;
  const repo = process.env.GITHUB_REPO_NAME;
  const branch = process.env.GITHUB_REPO_BRANCH ?? "main";

  if (!token || !owner || !repo) {
    return null;
  }

  return { token, owner, repo, branch };
}

function buildHeaders(config: GitHubRepoConfig) {
  return {
    Authorization: `Bearer ${config.token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "User-Agent": "zhujinju-content-admin",
  };
}

async function getExistingSha(config: GitHubRepoConfig, repoPath: string) {
  const endpoint = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${repoPath}`;
  const response = await fetch(`${endpoint}?ref=${config.branch}`, {
    headers: buildHeaders(config),
    cache: "no-store",
  });

  if (response.ok) {
    const payload = (await response.json()) as { sha?: string };
    return payload.sha;
  }

  if (response.status === 404) {
    return undefined;
  }

  throw new Error("无法读取 GitHub 当前文件。");
}

async function getRepoFilePayload(config: GitHubRepoConfig, repoPath: string) {
  const endpoint = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${repoPath}`;
  const response = await fetch(`${endpoint}?ref=${config.branch}`, {
    headers: buildHeaders(config),
    cache: "no-store",
  });

  if (response.ok) {
    return (await response.json()) as { sha?: string; content?: string; encoding?: string };
  }

  if (response.status === 404) {
    return null;
  }

  throw new Error("无法读取 GitHub 当前文件。");
}

async function putRepoFileBase64(
  repoPath: string,
  base64Content: string,
  message: string,
) {
  const config = getGitHubRepoConfig();

  if (!config) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("未配置 GitHub 内容写入环境变量，生产环境无法保存内容。");
    }

    return;
  }

  const endpoint = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${repoPath}`;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const sha = await getExistingSha(config, repoPath);
    const response = await fetch(endpoint, {
      method: "PUT",
      headers: buildHeaders(config),
      body: JSON.stringify({
        message,
        branch: config.branch,
        sha,
        content: base64Content,
      }),
    });

    if (response.ok) {
      return;
    }

    const errorText = await response.text();
    const shouldRetry = response.status === 409 || response.status === 422;

    if (shouldRetry && attempt < 2) {
      continue;
    }

    throw new Error(`GitHub 保存失败：${errorText}`);
  }
}

export async function putRepoUtf8File(
  repoPath: string,
  content: string,
  message: string,
) {
  await putRepoFileBase64(repoPath, Buffer.from(content, "utf8").toString("base64"), message);
}

export async function putRepoBinaryFile(
  repoPath: string,
  content: Buffer,
  message: string,
) {
  await putRepoFileBase64(repoPath, content.toString("base64"), message);
}

export async function getRepoUtf8File(repoPath: string) {
  const config = getGitHubRepoConfig();

  if (!config) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("未配置 GitHub 内容读取环境变量，生产环境无法读取最新内容。");
    }

    if (!DEV_PUBLIC_REPO_FALLBACK) {
      return null;
    }

    const response = await fetch(
      `https://raw.githubusercontent.com/${DEV_PUBLIC_REPO_FALLBACK.owner}/${DEV_PUBLIC_REPO_FALLBACK.repo}/${DEV_PUBLIC_REPO_FALLBACK.branch}/${repoPath}`,
      {
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return null;
    }

    return await response.text();
  }

  const payload = await getRepoFilePayload(config, repoPath);

  if (!payload) {
    return null;
  }

  if (!payload.content) {
    throw new Error("GitHub 返回的文件内容为空。");
  }

  const normalized = payload.content.replace(/\n/g, "");
  return Buffer.from(normalized, payload.encoding === "base64" ? "base64" : "utf8").toString("utf8");
}

export function hasGitHubRepoConfig() {
  return Boolean(getGitHubRepoConfig());
}
