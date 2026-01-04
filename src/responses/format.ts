interface FormatReviewResponseProps {
  review: string;
}

export const formatReviewResponse = ({ review }: FormatReviewResponseProps): string => {
  return `## Code Review

${review}

<sub>Saltman</sub>`;
};

interface FormatErrorResponseProps {
  errorMessage: string;
}

export const formatErrorResponse = ({ errorMessage }: FormatErrorResponseProps): string => {
  return `## ⚠️ Code Review Error

Failed to generate LLM code review: ${errorMessage}

<sub>Saltman</sub>`;
};
