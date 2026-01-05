# Saltman

A reusable GitHub Action that analyzes pull request content and posts results as a comment.

## Features

- Triggers on PR creation and when new commits are pushed to a PR
- **AI-powered code review** using OpenAI's LLM
- Optionally posts analysis results as a GitHub comment (configurable)
- **File ignore patterns** - Exclude files from analysis using glob patterns (similar to `.eslintignore` or `.gitignore`)
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
          post-comment-when-no-issues: true  # Optional: set to true to post analysis as PR comment when no issues are detected (defaults to false)
          ignore-patterns: |  # Optional: exclude files from analysis using glob patterns
            **/*.test.ts
            **/*.spec.ts
            **/node_modules/**
            examples/**
```

**Note:** Replace `adriangohjw/saltman@main` with your own repository path. Using `@main` will always use the latest commit on the main branch.

### Inputs

- `github-token` (required): GitHub token for API access. Use `${{ secrets.GITHUB_TOKEN }}` for automatic token.
- `openai-api-key` (required): OpenAI API key for LLM-powered code review. Store this as a secret in your repository settings (e.g., `OPENAI_API_KEY`).
- `post-comment-when-no-issues` (optional): Whether to post the analysis as a comment on the PR when no issues are detected. Must be `true` or `false` if specified. Defaults to `false` if not provided (no comment will be posted).
- `ignore-patterns` (optional): Newline-separated list of glob patterns to exclude files from PR analysis. Similar to `.eslintignore` or `.gitignore` patterns. Files matching any pattern will be skipped during analysis. Examples:
  - `**/*.test.ts` - Ignore all test files
  - `**/node_modules/**` - Ignore node_modules directory
  - `examples/**` - Ignore entire examples directory
  - `*.md` - Ignore all markdown files

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
