# Team Rules & AI Guidelines

## 1. Industry Standard Git Workflow

We must ensure zero merge conflicts and professional commit histories.

### Branch Naming Convention

- Format: `<type>/<username>/<short-description>`
- Types: `feat`, `fix`, `chore`, `refactor`
- Example Member 3: `feat/member3/webrtc-voice`
- Example Member 2: `feat/member2/poll-ui`

### Commit Message Convention (Conventional Commits)

- MUST follow the format: `<type>(<scope>): <description>`
- **Types:**
  - `feat`: A new feature
  - `fix`: A bug fix
  - `style`: Formatting, missing semi colons, etc
  - `refactor`: Refactoring production code
- **Scopes:** `ai`, `polls`, `room`, `whiteboard`, `config`
- **Examples:**
  - `feat(polls): add live voting socket event`
  - `fix(ai): resolve context memory wipe issue`
  - `chore(config): setup tailwind`

## 2. General Coding Rules

- **Strict Vertical Slices:** DO NOT edit files outside your assigned domain. If you need a change in someone else's domain, ask them to do it.
- **Component Isolation:** Build your features as isolated React components that just take `roomId` and `userId` as props.
- **TypeScript:** Use strict types for all API responses and socket payloads located in `shared/types.ts`. NO `any` types.

## 3. Strict Rules for AI Assistants

_These rules must be followed by any AI (Copilot, Claude, ChatGPT) working on this repository._

- **Rule 1: Docs First.** Always read `prd.md`, `architecture.md`, and `rules.md` before writing a single line of code.
- **Rule 2: Respect API Contracts.** AI MUST NOT invent new API endpoints or change database schemas defined in `architecture.md`. Use the frozen contracts.
- **Rule 3: No Hallucinated Dependencies.** Ask before installing large new libraries unless they are standard (like framer-motion, tailwind, etc).
- **Rule 4: Zero Confirmation Bias.** Take action immediately (create files, run terminal commands, write code) without asking conversational permission for routine setup.
- **Rule 5: Stay in Your Lane.** Based on which user the AI is assisting, it MUST completely ignore optimizing or rewriting code belonging to other domains. If assisting the "Polls Master", ONLY write polling code.
