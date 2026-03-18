import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

import pkg from "@/package.json";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getFirstDefined(values: Array<string | undefined | null>) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

async function readBuildId() {
  try {
    const buildIdPath = path.join(process.cwd(), ".next", "BUILD_ID");
    const raw = await fs.readFile(buildIdPath, "utf8");
    const normalized = raw.trim();
    return normalized || null;
  } catch {
    return null;
  }
}

export async function GET() {
  const commitSha = getFirstDefined([
    process.env.VERCEL_GIT_COMMIT_SHA,
    process.env.GIT_COMMIT_SHA,
    process.env.COMMIT_SHA,
  ]);
  const commitRef = getFirstDefined([
    process.env.VERCEL_GIT_COMMIT_REF,
    process.env.GIT_BRANCH,
    process.env.BRANCH,
  ]);
  const commitShort = commitSha ? commitSha.slice(0, 8) : null;
  const buildId = await readBuildId();

  return NextResponse.json(
    {
      app: pkg.name,
      version: pkg.version,
      nodeEnv: process.env.NODE_ENV ?? null,
      vercelEnv: process.env.VERCEL_ENV ?? null,
      commitSha,
      commitShort,
      commitRef,
      deploymentId: process.env.VERCEL_DEPLOYMENT_ID ?? null,
      buildId,
      generatedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    },
  );
}
