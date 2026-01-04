import { SALTMAN_FOOTER } from "./shared";

interface FormatReviewResponseProps {
  review: string;
}

export const formatReviewResponse = ({ review }: FormatReviewResponseProps): string => {
  return `## Code Review

${review}

${SALTMAN_FOOTER}`;
};

interface FormatErrorResponseProps {
  errorMessage: string;
}

export const formatErrorResponse = ({ errorMessage }: FormatErrorResponseProps): string => {
  return `## ⚠️ Code Review Error

Failed to generate LLM code review: ${errorMessage}

${SALTMAN_FOOTER}`;
};
