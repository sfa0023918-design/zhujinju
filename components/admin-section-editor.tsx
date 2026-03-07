"use client";

import { useActionState } from "react";

import type { AdminActionState } from "@/app/admin/actions";
import type { EditableSectionKey } from "@/lib/site-data";

const initialState: AdminActionState = {};

type AdminSectionEditorProps = {
  action: (state: AdminActionState, formData: FormData) => Promise<AdminActionState>;
  section: EditableSectionKey;
  title: string;
  description: string;
  initialJson: string;
};

export function AdminSectionEditor({
  action,
  section,
  title,
  description,
  initialJson,
}: AdminSectionEditorProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="section" value={section} />
      <div className="space-y-2 border-b border-[var(--line)] pb-5">
        <h1 className="font-serif text-[2rem] leading-none tracking-[-0.04em] text-[var(--ink)] md:text-[3.3rem]">
          {title}
        </h1>
        <p className="max-w-2xl text-sm leading-7 text-[var(--muted)]">{description}</p>
      </div>
      <label className="grid gap-2">
        <span className="text-[0.76rem] tracking-[0.18em] text-[var(--accent)]">JSON 内容</span>
        <textarea
          name="content"
          required
          defaultValue={initialJson}
          rows={28}
          spellCheck={false}
          className="min-h-[65vh] w-full border border-[var(--line)] bg-[var(--surface)] px-4 py-4 font-mono text-[0.82rem] leading-7 text-[var(--ink)] outline-none transition-colors focus:border-[var(--line-strong)]"
        />
      </label>
      <div className="flex flex-col gap-4 border-t border-[var(--line)] pt-5 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1 text-sm text-[var(--muted)]">
          <p>保存后将更新仓库中的 `content/site-content.json`。</p>
          <p>GitHub 提交完成后，Vercel 会自动重新部署正式站点。</p>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 items-center justify-center border border-[var(--line-strong)] px-6 text-[var(--ink)] transition-colors duration-300 hover:bg-[var(--surface-strong)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "保存中" : "保存当前分区"}
        </button>
      </div>
      {state.error ? <p className="text-sm leading-7 text-[#8e4e3b]">{state.error}</p> : null}
      {state.success ? <p className="text-sm leading-7 text-[var(--muted)]">{state.success}</p> : null}
    </form>
  );
}
