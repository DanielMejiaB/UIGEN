# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Code Style

- Use comments sparingly. Only comment complex code.

## Commands

```bash
# Initial setup
npm run setup          # Install deps, generate Prisma client, run migrations

# Development
npm run dev            # Start dev server with Turbopack (requires NODE_OPTIONS shim)
npm run dev:daemon     # Start dev server in background, logs to log.txt

# Build & production
npm run build
npm start

# Database
npx prisma migrate dev # Create new migration
npm run db:reset       # Reset database (destructive)

# Lint & test
npm run lint
npm test               # Run all Vitest tests
npx vitest run src/path/to/file.test.ts  # Run single test file
```

`NODE_OPTIONS='--require ./node-compat.cjs'` is required for all Next.js commands — the npm scripts include it automatically.

Set `ANTHROPIC_API_KEY` in `.env.local` to use real Claude. Without it, the app falls back to a `MockLanguageModel` that returns static component code.

## Architecture

**UIGen** is an AI-powerd React component generater with live preview. Users describe components in natural language; Claude generates code that is displayed in a sandboxed iframe preview and editable in Monaco Editor. Projects persist to SQLite via Prisma for authenticated users.

### Request Flow

1. User submits chat message → `ChatContext` sends POST to `/api/chat`
2. `/api/chat` streams a response from Claude (claude-haiku-4-5) with tool calls
3. Claude invokes `str_replace_editor` or `file_manager` tool calls to create/edit files
4. `FileSystemContext` processes incoming tool calls and updates the `VirtualFileSystem`
5. The preview iframe re-renders via Babel Standalone JSX transformation + ESM import maps

### Key Abstractions

**`VirtualFileSystem`** (`src/lib/file-system.ts`) — In-memory path-keyed file store. Serializes to/from JSON for database persistence. All file mutations go through this class.

**`FileSystemContext`** (`src/lib/contexts/file-system-context.tsx`) — React context wrapping `VirtualFileSystem`. Handles tool call execution from the AI stream and exposes the active file/file tree to the UI.

**`ChatContext`** (`src/lib/contexts/chat-context.tsx`) — Manages message history, calls `/api/chat`, and wires AI tool-call results back to `FileSystemContext`.

**AI Tools** (`src/lib/tools/`) — Two tools Claude can invoke:
- `str_replace_editor`: view, create, str_replace, insert operations on files
- `file_manager`: rename and delete operations

**JSX Transformer** (`src/lib/transform/jsx-transformer.ts`) — Transpiles each virtual file with Babel Standalone, creates Blob URLs, builds an import map, and injects everything into the preview iframe.

**Provider** (`src/lib/provider.ts`) — Returns an Anthropic language model if `ANTHROPIC_API_KEY` is set, otherwise returns `MockLanguageModel`.

### Layout

`MainContent` (`src/app/main-content.tsx`) renders a three-panel layout (resizable):
- **Left**: Chat interface (`ChatContext` provider wraps it)
- **Right top**: Live preview iframe or Monaco code editor
- **Right bottom**: File tree (when in code view)

Provider nesting order: `FileSystemProvider` → `ChatProvider` → UI components.

### Auth

JWT sessions in HTTP-only cookies. `src/middleware.ts` guards `/api/*` routes. Server actions in `src/actions/` handle sign-up/sign-in/sign-out and project CRUD. Passwords hashed with bcrypt.

### Database

SQLite via Prisma. Two models: `User` (email + hashed password) and `Project` (stores chat `messages` and virtual file system `data` as serialized JSON strings). Schema at `prisma/schema.prisma`.

### Path Alias

`@/*` maps to `src/*` (configured in `tsconfig.json`).
