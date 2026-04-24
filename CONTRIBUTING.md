# Contributing to Canopy

Thanks for your interest in contributing! There are several ways to help:

- [Contributing to Canopy](#contributing-to-canopy)
  - [Reporting Bugs](#reporting-bugs)
  - [Contributing Code](#contributing-code)
    - [Setup](#setup)
    - [Code Style](#code-style)
    - [Tests](#tests)
    - [Submitting a PR](#submitting-a-pr)
  - [Contributing Translations](#contributing-translations)

## Reporting Bugs

Found a bug? Open an [issue](https://github.com/ForestOfLight/Canopy/issues) with clear steps to reproduce it.

## Contributing Code

### Setup

1. [Fork the repository](https://github.com/ForestOfLight/Canopy/fork) and clone your fork locally.
2. Install dependencies:
   ```bash
   npm install
   ```

### Code Style

Canopy uses ESLint to enforce consistent style. Before submitting, run:

```bash
npm run lint
```

Fix all errors before opening a PR. Key style rules:

- **Object-oriented** — follow the existing class-per-file pattern; extend base classes where applicable (see `Canopy[BP]/scripts/src/` for examples)
- **`const` by default** — use `let` only when reassignment is necessary; never use `var`
- **`camelCase` naming** — for variables, functions, and class members
- **One class per file** — keep files focused and single-purpose
- **No explanatory comments in code** — describe your changes in the PR description, not in the source

### Tests

All code contributions must include tests. Tests live in `__tests__/` and mirror the structure of `Canopy[BP]/scripts/`. Run the full suite with:

```bash
npm test
```

All tests must pass before submitting.

### Submitting a PR

- Target the **`dev` branch**
- Keep PRs focused — one concern per PR
- Describe what your changes do and why in the PR description

## Contributing Translations

See [docs/TRANSLATING.md](docs/TRANSLATING.md) for the full translation guide.
