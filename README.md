# Saltman

A reusable GitHub Action that analyzes code changes and posts security and quality findings. Supports both pull request reviews (via PR comments) and direct branch pushes (via GitHub issues).

## Features

- **PR Mode**: Triggers on PR creation and when new commits are pushed to a PR
  - Posts inline comments for critical/high severity issues
  - Posts aggregated comments for medium/low/info issues
- **Push Mode**: Triggers on direct pushes to a specific branch
  - Creates GitHub issues with all findings when security issues are detected
- **AI-powered code review** using OpenAI or Anthropic Claude Opus (provider is automatically inferred from which API key you provide)
- **File ignore patterns** - Exclude files from analysis using glob patterns (similar to `.eslintignore` or `.gitignore`)
- Written in TypeScript

## Usage

### Publishing Your Action

Before others can use your action, you need to:

1. **Push your repository to GitHub** (make it public or ensure users have access)
2. **Ensure your main branch is up to date** - users will reference `@main` to get the latest version

### PR Mode (Default)

Analyze pull requests and post comments directly on the PR:

```yaml
name: 'Analyze PR'

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  analyze:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
      contents: read
      issues: write
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run Saltman
        uses: adriangohjw/saltman@main
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          # Provide either openai-api-key OR anthropic-api-key (not both)
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}  # For OpenAI
          # anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}  # For Claude Opus
          post-comment-when-no-issues: true  # Optional: set to true to post analysis as PR comment when no issues are detected (defaults to false)
          ignore-patterns: |  # Optional: exclude files from analysis using glob patterns
            **/*.test.ts
            **/*.spec.ts
            **/node_modules/**
            examples/**
```

### Push Mode (Create Issues)

Monitor direct pushes to a specific branch and create GitHub issues:

```yaml
name: 'Security Review on Push to Main'

on:
  push:
    branches: [main]

jobs:
  security-review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      issues: write
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run Saltman
        uses: adriangohjw/saltman@main
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          # Provide either openai-api-key OR anthropic-api-key (not both)
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}  # For OpenAI
          # anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}  # For Claude Opus
          target-branch: main  # Required for push mode: branch to monitor
          ignore-patterns: |  # Optional: exclude files from analysis using glob patterns
            **/*.md
            package.json
            bun.lockb
```

**Note:** Replace `adriangohjw/saltman@main` with your own repository path. Using `@main` will always use the latest commit on the main branch.

### Inputs

- `github-token` (required): GitHub token for API access. Use `${{ secrets.GITHUB_TOKEN }}` for automatic token.
- `openai-api-key` (required if using OpenAI): OpenAI API key for LLM-powered code review. Store this as a secret in your repository settings (e.g., `OPENAI_API_KEY`). **Provide either this or `anthropic-api-key` (not both)**.
- `anthropic-api-key` (required if using Claude): Anthropic API key for Claude Opus code review. Store this as a secret in your repository settings (e.g., `ANTHROPIC_API_KEY`). **Provide either this or `openai-api-key` (not both)**. The provider is automatically inferred from which API key you provide.
- `post-comment-when-no-issues` (optional, PR mode only): Whether to post the analysis as a comment on the PR when no issues are detected. Must be `true` or `false` if specified. Defaults to `false` if not provided (no comment will be posted). **Mutually exclusive with `target-branch`**.
- `target-branch` (optional, Push mode only): Branch name to monitor for direct pushes. When set and action is triggered on a push event, creates a GitHub issue instead of PR comments. The action will only run when someone pushes directly to this branch. **Mutually exclusive with `post-comment-when-no-issues`**.
- `ignore-patterns` (optional): Newline-separated list of glob patterns to exclude files from analysis. Similar to `.eslintignore` or `.gitignore` patterns. Files matching any pattern will be skipped during analysis. Examples:
  - `**/*.test.ts` - Ignore all test files
  - `**/node_modules/**` - Ignore node_modules directory
  - `examples/**` - Ignore entire examples directory
  - `*.md` - Ignore all markdown files

**Mode Selection:**
- **PR Mode**: Use `post-comment-when-no-issues` (or omit both). Creates PR comments.
- **Push Mode**: Use `target-branch`. Creates GitHub issues.
- These two inputs are mutually exclusive - you cannot use both in the same workflow.

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
