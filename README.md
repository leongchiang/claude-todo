# ClaudeTodo

An open-source tutorial project that teaches developers to build a real, deployed, AI-augmented web application using [Claude Code](https://docs.claude.com/en/docs/claude-code). The todo-list domain is trivial on purpose — the focus is the build process.

**Follow along:** [`TUTORIAL.md`](TUTORIAL.md) — a living document, updated chapter by chapter as the project ships.

## What's in the box

- Next.js 16 (App Router) · TypeScript strict · Tailwind v4
- NextAuth (Google + Microsoft SSO) · `better-sqlite3`
- Public REST API with auto-generated OpenAPI 3.1 + Scalar docs
- AI features powered by the Anthropic SDK (`@anthropic-ai/sdk`)
- Vitest + Playwright · Biome · pnpm

## Quickstart

```bash
pnpm install
cp .env.example .env.local      # then fill in
pnpm dev                        # http://localhost:3000
```

## Verifying the scaffold

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
```

## Docs

| File | Purpose |
|------|---------|
| [`TUTORIAL.md`](TUTORIAL.md) | Step-by-step build narrative |
| [`PRODUCT_SPEC.md`](PRODUCT_SPEC.md) | What we're building and why |
| [`CLAUDE.md`](CLAUDE.md) | Rules for Claude Code in this repo |
| [`TEST_CASES.md`](TEST_CASES.md) | Agreed observable behavior |

## License

MIT — see [`LICENSE`](LICENSE).
