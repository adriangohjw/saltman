# Saltman

A reusable GitHub Action that analyzes code changes and posts security and quality findings. Supports both pull request reviews (via PR comments) and direct branch pushes (via GitHub issues).

## Features

- **PR Mode**: Triggers on PR creation and when new commits are pushed to a PR
  - Posts inline comments for critical/high severity issues
  - Posts aggregated comments for medium/low/info issues
- **Push Mode**: Triggers on direct pushes to a specific branch
  - Creates GitHub issues with all findings when security issues are detected
  - Automatically pings the commit pusher
  - Supports configurable additional pings via `ping-users` input
- **AI-powered code review** using OpenAI (recommended), Anthropic Claude Opus, or any OpenAI-compatible API provider
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
          provider: openai  # Must be either "openai", "anthropic", or "openai-compatible". OpenAI is recommended.
          api-key: ${{ secrets.OPENAI_API_KEY }}  # API key for the specified provider
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
          provider: openai  # Must be either "openai", "anthropic", or "openai-compatible". OpenAI is recommended.
          api-key: ${{ secrets.OPENAI_API_KEY }}  # API key for the specified provider
          target-branch: main  # Required for push mode: branch to monitor
          ping-users: "@team/security @security-leads"  # Optional: additional users/teams to ping in push mode
          ignore-patterns: |  # Optional: exclude files from analysis using glob patterns
            **/*.md
            package.json
            bun.lockb
```

**Note:** Replace `adriangohjw/saltman@main` with your own repository path. Using `@main` will always use the latest commit on the main branch.

### OpenAI-Compatible Provider

You can use any OpenAI-compatible API provider (e.g., local models, self-hosted solutions, or other cloud providers):

```yaml
name: 'Analyze PR with OpenAI-Compatible Provider'

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
          provider: openai-compatible  # Use OpenAI-compatible provider
          api-key: ${{ secrets.OPENAI_COMPATIBLE_API_KEY }}  # API key for your provider
          base-url: https://api.example.com/v1  # Base URL for your OpenAI-compatible API
          model: gpt-4  # Model name to use (e.g., "gpt-4", "gpt-3.5-turbo", or your custom model name)
```

**Note:** When using `provider: openai-compatible`, both `base-url` and `model` are required.

### Inputs

- `github-token` (required): GitHub token for API access. Use `${{ secrets.GITHUB_TOKEN }}` for automatic token.
- `provider` (required): LLM provider to use for code review. Must be either `"openai"`, `"anthropic"`, or `"openai-compatible"`. **OpenAI is recommended** for better performance and reliability.
- `api-key` (required): API key for the specified LLM provider. Store this as a secret in your repository settings (e.g., `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, or your custom provider's API key).
- `base-url` (required when `provider` is `"openai-compatible"`): Base URL for your OpenAI-compatible API endpoint. For example: `https://api.example.com/v1` or `http://localhost:1234/v1`.
- `model` (required when `provider` is `"openai-compatible"`): Model name to use with your OpenAI-compatible provider. This should match the model identifier your API expects (e.g., `"gpt-4"`, `"gpt-3.5-turbo"`, or your custom model name).
- `post-comment-when-no-issues` (optional, PR mode only): Whether to post the analysis as a comment on the PR when no issues are detected. Must be `true` or `false` if specified. Defaults to `false` if not provided (no comment will be posted). **Mutually exclusive with `target-branch`**.
- `target-branch` (optional, Push mode only): Branch name to monitor for direct pushes. When set and action is triggered on a push event, creates a GitHub issue instead of PR comments. The action will only run when someone pushes directly to this branch. **Mutually exclusive with `post-comment-when-no-issues`**.
- `ping-users` (optional, Push mode only): Space or newline-separated list of GitHub usernames or teams to ping in push mode when creating issues. All items must start with `@` (e.g., `"@user1 @team/security"` or use newlines). These will be added to the issue footer along with the commit pusher. All mentions are automatically deduplicated. Examples:
  - `"@team/security @security-leads"` - Ping security team and leads
  - `"@user1 @user2"` - Ping specific users
  - Multi-line format:
    ```yaml
    ping-users: |
      @team/security
      @security-leads
      @user1
    ```
- `ignore-patterns` (optional): Newline-separated list of glob patterns to exclude files from analysis. Similar to `.eslintignore` or `.gitignore` patterns. Files matching any pattern will be skipped during analysis. Examples:
  - `**/*.test.ts` - Ignore all test files
  - `**/node_modules/**` - Ignore node_modules directory
  - `examples/**` - Ignore entire examples directory
  - `*.md` - Ignore all markdown files

**Mode Selection:**
- **PR Mode**: Use `post-comment-when-no-issues` (or omit both). Creates PR comments.
- **Push Mode**: Use `target-branch`. Creates GitHub issues. In push mode, the action automatically:
  - Pings the person who pushed the commit
  - Pings any additional users/teams specified in `ping-users`
  - All mentions are automatically deduplicated
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
