// Error types and recovery utilities for the file converter

export const ErrorType = {
  VALIDATION: "validation",
  CONVERSION: "conversion",
  NETWORK: "network",
  MEMORY: "memory",
  UNKNOWN: "unknown",
} as const;

export type ErrorType = (typeof ErrorType)[keyof typeof ErrorType];

export interface ErrorInfo {
  type: ErrorType;
  message: string;
  suggestion: string;
  canRetry: boolean;
}

export function categorizeError(error: unknown): ErrorInfo {
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Validation errors
  if (errorMessage.includes("JSON") || errorMessage.includes("invalid JSON")) {
    return {
      type: ErrorType.VALIDATION,
      message: "Invalid JSON format detected.",
      suggestion:
        "Please check your JSON file for syntax errors like missing commas, quotes, or brackets.",
      canRetry: true,
    };
  }

  if (errorMessage.includes("XML") || errorMessage.includes("malformed XML")) {
    return {
      type: ErrorType.VALIDATION,
      message: "Invalid XML format detected.",
      suggestion:
        "Please ensure your XML file is well-formed with proper tags and structure.",
      canRetry: true,
    };
  }

  if (errorMessage.includes("CSV") || errorMessage.includes("malformed CSV")) {
    return {
      type: ErrorType.VALIDATION,
      message: "Invalid CSV format detected.",
      suggestion:
        "Please check your CSV file for proper comma separation and consistent columns.",
      canRetry: true,
    };
  }

  // Conversion errors
  if (errorMessage.includes("empty") || errorMessage.includes("size === 0")) {
    return {
      type: ErrorType.CONVERSION,
      message: "Conversion resulted in an empty file.",
      suggestion:
        "The input file may be corrupted or in an unsupported format. Try a different file.",
      canRetry: true,
    };
  }

  if (
    errorMessage.includes("not supported") ||
    errorMessage.includes("unsupported")
  ) {
    return {
      type: ErrorType.CONVERSION,
      message: "Conversion format not supported.",
      suggestion:
        "This conversion combination is not currently supported. Try a different output format.",
      canRetry: false,
    };
  }

  // Memory errors
  if (
    errorMessage.includes("memory") ||
    errorMessage.includes("out of memory")
  ) {
    return {
      type: ErrorType.MEMORY,
      message: "Insufficient memory for conversion.",
      suggestion:
        "The file is too large. Try with a smaller file or different format.",
      canRetry: false,
    };
  }

  // Network errors (for future PWA features)
  if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
    return {
      type: ErrorType.NETWORK,
      message: "Network error occurred.",
      suggestion: "Please check your internet connection and try again.",
      canRetry: true,
    };
  }

  // Default unknown error
  return {
    type: ErrorType.UNKNOWN,
    message: errorMessage || "An unexpected error occurred.",
    suggestion:
      "Please try again. If the problem persists, try a different file or format.",
    canRetry: true,
  };
}
