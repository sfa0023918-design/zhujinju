type InquiryPayload = {
  name: string;
  email: string;
  organization: string;
  identity: string;
  artwork: string;
  message: string;
};

type InquiryMeta = {
  ip: string;
  userAgent: string;
  pageUrl: string;
  receivedAt: string;
};

class InquiryConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InquiryConfigError";
  }
}

function getInquiryMailConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.INQUIRY_FROM_EMAIL?.trim();
  const to = (process.env.INQUIRY_TO_EMAIL ?? process.env.CONTACT_EMAIL ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!apiKey) {
    throw new InquiryConfigError("未配置 RESEND_API_KEY，联系表单暂时无法投递。");
  }

  if (!from) {
    throw new InquiryConfigError("未配置 INQUIRY_FROM_EMAIL，联系表单暂时无法投递。");
  }

  if (!to.length) {
    throw new InquiryConfigError("未配置 INQUIRY_TO_EMAIL，联系表单暂时无法投递。");
  }

  return { apiKey, from, to };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatOptional(label: string, value: string) {
  return value ? `${label}: ${value}` : `${label}: -`;
}

export function isInquiryConfigError(error: unknown): error is InquiryConfigError {
  return error instanceof InquiryConfigError;
}

export async function sendInquiryEmail(payload: InquiryPayload, meta: InquiryMeta) {
  const { apiKey, from, to } = getInquiryMailConfig();
  const subject = `New inquiry from ${payload.name} | Zhu Jin Ju`;
  const text = [
    "A new inquiry has been submitted on zhujinju.com.",
    "",
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    formatOptional("Organization", payload.organization),
    formatOptional("Role", payload.identity),
    formatOptional("Artwork", payload.artwork),
    "",
    "Message:",
    payload.message,
    "",
    `Submitted at: ${meta.receivedAt}`,
    `Page: ${meta.pageUrl || "-"}`,
    `IP: ${meta.ip || "-"}`,
    `User-Agent: ${meta.userAgent || "-"}`,
  ].join("\n");

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1f2937; line-height: 1.6;">
      <h2 style="margin: 0 0 16px;">New inquiry from zhujinju.com</h2>
      <table style="border-collapse: collapse; width: 100%; max-width: 720px;">
        <tbody>
          <tr><td style="padding: 6px 0; width: 140px;"><strong>Name</strong></td><td style="padding: 6px 0;">${escapeHtml(payload.name)}</td></tr>
          <tr><td style="padding: 6px 0;"><strong>Email</strong></td><td style="padding: 6px 0;">${escapeHtml(payload.email)}</td></tr>
          <tr><td style="padding: 6px 0;"><strong>Organization</strong></td><td style="padding: 6px 0;">${escapeHtml(payload.organization || "-")}</td></tr>
          <tr><td style="padding: 6px 0;"><strong>Role</strong></td><td style="padding: 6px 0;">${escapeHtml(payload.identity || "-")}</td></tr>
          <tr><td style="padding: 6px 0;"><strong>Artwork</strong></td><td style="padding: 6px 0;">${escapeHtml(payload.artwork || "-")}</td></tr>
          <tr><td style="padding: 6px 0; vertical-align: top;"><strong>Message</strong></td><td style="padding: 6px 0; white-space: pre-wrap;">${escapeHtml(payload.message)}</td></tr>
        </tbody>
      </table>
      <hr style="margin: 24px 0; border: 0; border-top: 1px solid #e5e7eb;" />
      <p style="margin: 0 0 6px;"><strong>Submitted at:</strong> ${escapeHtml(meta.receivedAt)}</p>
      <p style="margin: 0 0 6px;"><strong>Page:</strong> ${escapeHtml(meta.pageUrl || "-")}</p>
      <p style="margin: 0 0 6px;"><strong>IP:</strong> ${escapeHtml(meta.ip || "-")}</p>
      <p style="margin: 0;"><strong>User-Agent:</strong> ${escapeHtml(meta.userAgent || "-")}</p>
    </div>
  `.trim();

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      reply_to: payload.email,
      subject,
      text,
      html,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`邮件投递失败：${errorText}`);
  }

  return (await response.json()) as { id?: string };
}
