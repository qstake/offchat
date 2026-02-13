import { toast } from "@/hooks/use-toast";

export type ErrorType = 
  | 'AUTH_ERROR' 
  | 'NETWORK_ERROR' 
  | 'VALIDATION_ERROR' 
  | 'UPLOAD_ERROR' 
  | 'PERMISSION_ERROR' 
  | 'UNKNOWN_ERROR';

export interface AppError {
  type: ErrorType;
  message: string;
  code?: string | number;
  details?: any;
}

const ERROR_MESSAGES = {
  AUTH_ERROR: {
    title: "Authentication Error",
    defaultMessage: "Authentication failed. Please try again.",
  },
  NETWORK_ERROR: {
    title: "Connection Error", 
    defaultMessage: "Network connection failed. Please check your internet and try again.",
  },
  VALIDATION_ERROR: {
    title: "Invalid Input",
    defaultMessage: "Please check your input and try again.",
  },
  UPLOAD_ERROR: {
    title: "Upload Failed",
    defaultMessage: "File upload failed. Please try again.",
  },
  PERMISSION_ERROR: {
    title: "Access Denied",
    defaultMessage: "You don't have permission to perform this action.",
  },
  UNKNOWN_ERROR: {
    title: "Error",
    defaultMessage: "Something went wrong. Please try again.",
  },
};

export function createError(type: ErrorType, message?: string, code?: string | number, details?: any): AppError {
  return {
    type,
    message: message || ERROR_MESSAGES[type].defaultMessage,
    code,
    details,
  };
}

export function handleError(error: AppError | Error | any, customMessage?: string) {
  let errorToShow: AppError;

  if (error instanceof Error) {
    // Convert regular Error to AppError
    errorToShow = createError('UNKNOWN_ERROR', error.message);
  } else if (error.type && ERROR_MESSAGES[error.type as ErrorType]) {
    // It's already an AppError
    errorToShow = error as AppError;
  } else if (typeof error === 'string') {
    // String error
    errorToShow = createError('UNKNOWN_ERROR', error);
  } else {
    // Unknown error format
    errorToShow = createError('UNKNOWN_ERROR', customMessage);
  }

  // Show toast with consistent styling
  const errorConfig = ERROR_MESSAGES[errorToShow.type];
  toast({
    title: errorConfig.title,
    description: customMessage || errorToShow.message,
    variant: "destructive",
  });

  return errorToShow;
}

export function handleNetworkError(error: any, customMessage?: string) {
  let errorType: ErrorType = 'NETWORK_ERROR';
  let message = customMessage || ERROR_MESSAGES.NETWORK_ERROR.defaultMessage;

  // Parse HTTP errors
  if (error.status || error.statusCode) {
    const status = error.status || error.statusCode;
    
    switch (status) {
      case 401:
        errorType = 'AUTH_ERROR';
        message = "You need to sign in to continue.";
        break;
      case 403:
        errorType = 'PERMISSION_ERROR';
        message = "Access denied. You don't have permission for this action.";
        break;
      case 404:
        message = "The requested resource was not found.";
        break;
      case 429:
        message = "Too many requests. Please wait a moment and try again.";
        break;
      case 500:
      case 502:
      case 503:
        message = "Server error. Please try again in a few moments.";
        break;
    }
  }

  return handleError(createError(errorType, message));
}

export function handleValidationError(message: string) {
  return handleError(createError('VALIDATION_ERROR', message));
}

export function handleUploadError(message?: string) {
  return handleError(createError('UPLOAD_ERROR', message));
}

export function handleAuthError(message?: string) {
  return handleError(createError('AUTH_ERROR', message));
}

export function showSuccessMessage(title: string, description?: string) {
  toast({
    title,
    description,
    variant: "default", // Success variant
  });
}