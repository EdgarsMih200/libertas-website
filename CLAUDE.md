# Instructions for Claude

0. **Sync at session start.** Run `git pull`, then check what changed since `context.md` was last committed:
   `git diff --stat $(git log -1 --format=%H -- context.md)..HEAD -- . ':!context.md' ':!CLAUDE.md'`.
   If site files changed (e.g. images uploaded on GitHub), read only those diffs, update the affected parts of
   `context.md`, and commit + push it. If nothing changed, skip this.
1. **Read `context.md` first.** It describes the site structure, courses, CSS classes and known gaps.
   Do not re-scan the whole repo. Open only the files a task actually touches.
2. **Keep `context.md` current.** If a change adds or renames pages, sections, classes, courses, assets or config,
   update `context.md` in the same commit.
3. **Push after each completed stage.** When a stage of work is done, commit with a clear message and
   `git push origin main`. The user has authorized this. Pushing to `main` deploys the live site through Cloudflare,
   so don't push half-finished or broken work. Commit only files that belong to the stage.
4. New non-site files (notes, tooling) must be added to `.assetsignore` so they aren't published.
5. Keep answers short. Show diffs or summaries, not whole files.
