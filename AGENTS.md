# AGENTS.md

This file provides guidance to AI coding agents (Codex / Claude Code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint

# Format code with Prettier
pnpm format

# Check code formatting
pnpm format:check
```

## Agent Assets

- Canonical location: `.agents/commands` and `.agents/skills`
- `.claude/commands` and `.claude/skills` should reference `.agents/*`
- `.codex/commands` and `.codex/skills` should reference `.agents/*`

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui components
- Prettier for code formatting

## Verification Workflow

- After making changes, run `pnpm run format`, `pnpm run lint`, and `pnpm run build`.
- If any command fails, fix the issues and repeat verification until all commands complete successfully.
