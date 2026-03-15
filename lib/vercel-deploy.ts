export type VercelDeployTriggerResult = {
  triggered: boolean;
  warning?: string;
};

function getDeployHookUrl() {
  const raw = process.env.VERCEL_DEPLOY_HOOK_URL?.trim();
  return raw ? raw : null;
}

function extractDeployError(detail: string) {
  const normalized = detail.trim();

  if (!normalized) {
    return "部署服务未返回可读结果。";
  }

  return normalized.length > 140 ? `${normalized.slice(0, 137)}...` : normalized;
}

export async function triggerVercelDeploy(reason: string): Promise<VercelDeployTriggerResult> {
  const hookUrl = getDeployHookUrl();

  if (!hookUrl) {
    return {
      triggered: false,
      warning: "已保存成功，但当前未配置自动部署钩子，所以仍需手动触发正式站部署。",
    };
  }

  try {
    const response = await fetch(hookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reason,
        source: "admin",
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const detail = extractDeployError(await response.text());
      return {
        triggered: false,
        warning: `已保存成功，但自动部署触发失败：${detail}`,
      };
    }

    return { triggered: true };
  } catch (error) {
    return {
      triggered: false,
      warning: `已保存成功，但自动部署触发失败：${error instanceof Error ? error.message : "未知错误。"}`,
    };
  }
}

export function appendDeployStatusMessage(
  baseMessage: string,
  deploy: VercelDeployTriggerResult,
) {
  if (deploy.triggered) {
    return `${baseMessage} 已自动触发正式站重新部署，通常几分钟后前台会更新。`;
  }

  if (deploy.warning) {
    return `${baseMessage} ${deploy.warning}`;
  }

  return baseMessage;
}
