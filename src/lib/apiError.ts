
import axios from "axios";

export const getApiError = (error: unknown): string => {
  if (!axios.isAxiosError(error)) {
    return "An unexpected error occurred.";
  }

  if (!error.response) {
    return "Unable to connect to the server. Check your internet connection.";
  }

  const { status, data } = error.response;

  if (status === 400 && data && typeof data === "object") {
    const messages = Object.entries(data)
      .flatMap(([field, value]) => {
        const values = Array.isArray(value) ? value : [value];

        return values
          .filter((item): item is string => typeof item === "string")
          .map((message) =>
            field === "detail" || field === "non_field_errors"
              ? message
              : `${field}: ${message}`
          );
      });

    if (messages.length) {
      return messages.join(" ");
    }

    return "Please check the information you entered.";
  }

  if (status === 401) {
    return "Invalid credentials or your session has expired.";
  }

  if (status === 403) {
    return "You do not have permission to perform this action.";
  }

  if (status === 404) {
    return "The requested resource was not found.";
  }

  if (status === 429) {
    return "Too many requests. Please try again later.";
  }

  if (status >= 500) {
    return "Server error. Please try again later.";
  }

  return "Something went wrong. Please try again.";
};
