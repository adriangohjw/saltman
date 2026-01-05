import { minimatch } from "minimatch";
import * as core from "@actions/core";
import type { FileChange } from "./types";

interface FilterIgnoredFilesProps {
  files: FileChange[];
  ignorePatterns?: string[];
}

export const filterIgnoredFiles = ({
  files,
  ignorePatterns,
}: FilterIgnoredFilesProps): FileChange[] => {
  // If no ignore patterns provided, return all files
  if (!ignorePatterns || ignorePatterns.length === 0) {
    core.info(`No ignore patterns configured. Analyzing all ${files.length} file(s).`);
    return files;
  }

  core.info(`Ignore patterns configured: ${ignorePatterns.length} pattern(s)`);
  core.info(`Patterns: ${ignorePatterns.map((p) => `"${p}"`).join(", ")}`);

  const ignoredFiles: { filename: string; pattern: string }[] = [];
  const keptFiles: string[] = [];

  const filteredFiles = files.filter((file) => {
    // Check if the file matches any ignore pattern
    let matchedPattern: string | null = null;
    const shouldIgnore = ignorePatterns.some((pattern) => {
      try {
        const matches = minimatch(file.filename, pattern);
        if (matches) {
          matchedPattern = pattern;
        }
        return matches;
      } catch (error) {
        // If pattern is invalid, log warning but don't fail
        core.warning(
          `Invalid ignore pattern "${pattern}": ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        return false;
      }
    });

    if (shouldIgnore && matchedPattern) {
      ignoredFiles.push({ filename: file.filename, pattern: matchedPattern });
      return false; // Exclude this file
    }

    keptFiles.push(file.filename);
    return true; // Keep this file
  });

  // Log summary
  if (ignoredFiles.length > 0) {
    core.info(`\n📋 Ignored ${ignoredFiles.length} file(s) based on ignore patterns:`);
    for (const { filename, pattern } of ignoredFiles) {
      core.info(`  - ${filename} (matched pattern: "${pattern}")`);
    }
  }

  core.info(`\n✅ Analyzing ${keptFiles.length} file(s) after filtering:`);
  for (const filename of keptFiles) {
    core.info(`  - ${filename}`);
  }

  return filteredFiles;
};
