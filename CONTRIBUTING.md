# Contributing to Culinary Quest

First off, thanks for taking the time to contribute! 🍽️

Culinary Quest is a small, friendly project and contributions are welcome. This guide covers setup, how to make changes, and the conventions to follow so your pull request goes smoothly.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Workflow](#development-workflow)
- [Conventions](#conventions)
- [Submitting Changes](#submitting-changes)
- [Reporting Bugs & Ideas](#reporting-bugs--ideas)

---

## Code of Conduct

Be respectful and constructive. This is a learning-friendly project. Assume good intent and keep feedback focused on the code, not the person.

## Getting Started

1. **Fork** the repository and clone it locally.
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Run the dev server:**
   ```bash
   npm run dev
   ```
   Open the printed URL (typically `http://localhost:5173`).

## How to Contribute

Anything that moves the project forward is welcome:

- Fixing bugs
- Improving the UI / theme polish
- Expanding the country → cuisine mapping accuracy
- Adding planned features: **Quest Log**, **Favorites**, **Map Selector**, or the advertised **Dark Mode toggle**
- Improving documentation
- Adding tests (none exist yet — a test setup would be a great contribution)

> Have an idea that isn't listed? Open an issue to discuss it before writing a lot of code.

## Development Workflow

1. Create a branch off `main`:
   ```bash
   git checkout -b your-branch-name
   ```
2. Make your changes.
3. Run lint and confirm the build passes:
   ```bash
   npm run lint
   npm run build
   ```
4. Test manually in the running dev server (there are no automated tests yet).
5. Commit with a clear, concise message. Examples:
   - `feat: add dark mode toggle`
   - `fix: handle missing recipes for a cuisine`
   - `docs: expand cuisine mapping`
6. Push and open a pull request against `main`.

## Conventions

Follow the existing code style — see [AGENTS.md](./AGENTS.md) for the full picture. Key points:

- **Components:** functional `.jsx` components using hooks; `export default`.
- **Composition:** build cards from `CQCard`; buttons from `CQButton`.
- **Styling:** Tailwind utilities; use the custom `cq-` theme tokens; always add a `dark:` variant alongside a light color.
- **Data:** keep API calls in `src/api.js`. Do not add stray `fetch` calls inside components.
- **Fail soft:** API helpers log errors and return safe empty values rather than throwing.

## Submitting Changes

- Keep pull requests focused on a single concern.
- Mention what you changed and why in the PR description.
- Confirm `npm run lint` and `npm run build` pass before requesting review.
- If your change touches API behavior or the cuisine mapping, call it out so it can be reviewed carefully.

## Reporting Bugs & Ideas

Open a GitHub issue with:

- **For bugs:** what you did, what you expected, what happened, and (if possible) the browser/console output.
- **For ideas:** a short description of the feature and why it fits the project's "one country at a time" journey.
