"use client";

import { useActionState } from "react";

import type { AdminActionState } from "@/app/admin/actions";

const initialState: AdminActionState = {};

type AdminLoginFormProps = {
  action: (state: AdminActionState, formData: FormData) => Promise<AdminActionState>;
};

export function AdminLoginForm({ action }: AdminLoginFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5 border border-[var(--line)] bg-[var(--surface)] p-6 md:p-8">
      <label className="grid gap-2 text-sm text-[var(--muted)]">
        <span className="text-[0.76rem] tracking-[0.18em] text-[var(--accent)]">管理员账号</span>
        <input
          required
          name="email"
          type="text"
          className="h-11 border border-[var(--line)] bg-[var(--bg)] px-3 text-[var(--ink)] outline-none transition-colors focus:border-[var(--line-strong)]"
        />
      </label>
      <label className="grid gap-2 text-sm text-[var(--muted)]">
        <span className="text-[0.76rem] tracking-[0.18em] text-[var(--accent)]">管理员密码</span>
        <input
          required
          name="password"
          type="password"
          className="h-11 border border-[var(--line)] bg-[var(--bg)] px-3 text-[var(--ink)] outline-none transition-colors focus:border-[var(--line-strong)]"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 items-center justify-center border border-[var(--line-strong)] px-6 text-[var(--ink)] transition-colors duration-300 hover:bg-[var(--surface-strong)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "登录中" : "进入内容后台"}
      </button>
      {state.error ? <p className="text-sm leading-7 text-[#8e4e3b]">{state.error}</p> : null}
    </form>
  );
}
