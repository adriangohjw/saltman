import { minimatch } from "minimatch";
import * as core from "@actions/core";
import type { FileChange } from "./types";

interface FilterIgnoredFilesProps {
  files: FileChange[];
  ignorePatterns?: string[];
}

// Common non-text file extensions that should be excluded from analysis
const NON_TEXT_EXTENSIONS = new Set([
  // Images
  "png",
  "jpg",
  "jpeg",
  "gif",
  "svg",
  "webp",
  "ico",
  "bmp",
  "tiff",
  "tif",
  "heic",
  "heif",
  "avif",
  "raw",
  "psd",
  "ai",
  "eps",
  // Binaries
  "exe",
  "dll",
  "so",
  "dylib",
  "bin",
  "o",
  "obj",
  "class",
  "jar",
  "war",
  "ear",
  // Archives
  "zip",
  "tar",
  "gz",
  "bz2",
  "xz",
  "7z",
  "rar",
  "cab",
  "deb",
  "rpm",
  "dmg",
  "iso",
  // Documents (binary formats)
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "odt",
  "ods",
  "odp",
  // Media
  "mp3",
  "mp4",
  "avi",
  "mov",
  "wmv",
  "flv",
  "mkv",
  "webm",
  "ogg",
  "wav",
  "flac",
  "aac",
  // Fonts
  "ttf",
  "otf",
  "woff",
  "woff2",
  "eot",
  // Other
  "db",
  "sqlite",
  "sqlite3",
  "lockb", // binary lock files
]);

/**
 * Check if a file is a text file using hybrid approach:
 * 1. Check if GitHub provided a patch (binary files don't have patches)
 * 2. Check file extension against known non-text file types
 * @returns Object with isText flag and reason (if not a text file)
 */
const isTextFile = (file: FileChange): { isText: boolean; reason?: string } => {
  // First check: GitHub doesn't provide patches for binary files
  // This is the most reliable indicator from GitHub's API
  if (!file.patch || file.patch.length === 0) {
    return {
      isText: false,
      reason: "binary file (no patch provided by GitHub)",
    };
  }

  // Second check: extension-based filtering for known non-text types
  // This catches files early and handles edge cases
  const extension = file.filename.split(".").pop()?.toLowerCase();
  if (extension && NON_TEXT_EXTENSIONS.has(extension)) {
    return {
      isText: false,
      reason: `non-text file extension (.${extension})`,
    };
  }

  // Files without extensions are assumed to be text files (e.g., README, Dockerfile)
  return { isText: true };
};

export const filterIgnoredFiles = ({
  files,
  ignorePatterns,
}: FilterIgnoredFilesProps): FileChange[] => {
  const ignoredFiles: { filename: string; reason: string }[] = [];
  const keptFiles: string[] = [];

  const filteredFiles = files.filter((file) => {
    // First, check if file is a text file (using patch + extension checks)
    const textFileCheck = isTextFile(file);
    if (!textFileCheck.isText) {
      ignoredFiles.push({
        filename: file.filename,
        reason: textFileCheck.reason || "non-text file",
      });
      return false; // Exclude non-text files
    }

    // Then, check if the file matches any ignore pattern
    if (ignorePatterns && ignorePatterns.length > 0) {
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
        ignoredFiles.push({
          filename: file.filename,
          reason: `matched pattern: "${matchedPattern}"`,
        });
        return false; // Exclude this file
      }
    }

    keptFiles.push(file.filename);
    return true; // Keep this file
  });

  // Log summary
  if (ignoredFiles.length > 0) {
    core.info(`\n📋 Ignored ${ignoredFiles.length} file(s):`);
    for (const { filename, reason } of ignoredFiles) {
      core.info(`  - ${filename} (${reason})`);
    }
  }

  if (ignorePatterns && ignorePatterns.length > 0) {
    core.info(`Ignore patterns configured: ${ignorePatterns.length} pattern(s)`);
    core.info(`Patterns: ${ignorePatterns.map((p) => `"${p}"`).join(", ")}`);
  }

  core.info(`\n✅ Analyzing ${keptFiles.length} file(s) after filtering:`);
  for (const filename of keptFiles) {
    core.info(`  - ${filename}`);
  }

  return filteredFiles;
};
