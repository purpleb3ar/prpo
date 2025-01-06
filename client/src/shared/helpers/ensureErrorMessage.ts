export const ensureErrorMessage = (errorResponse: any) => {
  if (errorResponse.message) {
    return Array.isArray(errorResponse.message)
      ? errorResponse.message[0]
      : errorResponse.message;
  }

  return "Something went wrong";
};
