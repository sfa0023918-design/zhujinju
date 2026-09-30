# CLAUDE.md — 竹瑾居网站

@AGENTS.md

本项目的共用规则全部在 `AGENTS.md`（上一行已引用）。如果当前环境没有自动载入它，开始任何任务前先完整读取 `AGENTS.md`。本文件只记录 Claude 专属事项，不重复共用规则；共用规则要调整时改 `AGENTS.md`。

## Claude 专属事项（环境情况截至 2026-09-30）

- 在 Cowork 沙盒里通过 device_bash 操作 `/Users/zhangmi/竹瑾居网站` 时，沙盒默认不允许删除文件，git 创建的 `.git/index.lock` 可能无法自行清除，会阻塞用户和 Codex 之后的 git 操作。
  - 只读 git 命令加 `GIT_OPTIONAL_LOCKS=0`。这只能减少可选锁操作，**不能保证**不产生 `index.lock`。
  - 每次在该目录运行 git 后检查 `.git/index.lock`。空锁文件不等于可删除，正在运行的 git 也可能持有空锁。删除前先确认：没有 git 进程或其他任务（包括 Codex）正在使用该锁，且它确为本次中断遗留。无法确认时保留并报告；确认后也要经用户许可再删除，并告知用户。
- 用户电脑上的沙盒 shell 连不上 GitHub（代理返回 403），不能从那里 pull 或 push。云端环境可只读克隆远程仓库核对，但没有推送凭据；需要推送或开 PR 时交给用户或 Codex，除非用户另行授权。
- 云端环境的 npm registry 可能被网络策略拦截，`npm ci` 不一定可用；因此没能运行的 lint、build、测试要如实说明，不写成已通过。
