# Saltman

A reusable GitHub Action that analyzes pull request content and posts results as a comment.

## Features

- Triggers on PR creation and when new commits are pushed to a PR
- **AI-powered code review** using OpenAI's LLM
- Optionally posts analysis results as a GitHub comment (configurable)
- Written in TypeScript

## Usage

### Publishing Your Action

Before others can use your action, you need to:

1. **Push your repository to GitHub** (make it public or ensure users have access)
2. **Ensure your main branch is up to date** - users will reference `@main` to get the latest version

### Basic Usage

```yaml
name: 'Analyze PR'

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - name: Run Saltman
        uses: adriangohjw/saltman@main
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
          post-comment: true  # Optional: set to true to post analysis as PR comment (defaults to false)
```

**Note:** Replace `adriangohjw/saltman@main` with your own repository path. Using `@main` will always use the latest commit on the main branch.

### Inputs

- `github-token` (required): GitHub token for API access. Use `${{ secrets.GITHUB_TOKEN }}` for automatic token.
- `openai-api-key` (required): OpenAI API key for LLM-powered code review. Store this as a secret in your repository settings (e.g., `OPENAI_API_KEY`).
- `post-comment` (optional): Whether to post the analysis as a comment on the PR. Must be `true` or `false` if specified. Defaults to `false` if not provided (no comment will be posted).

### Outputs

- `result`: The analysis result as a string

## Development

### Setup

```bash
bun install
```

### Build

```bash
bun run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

### Testing

The action includes a test workflow (`.github/workflows/test.yml`) that you can use to test the action in your repository.
