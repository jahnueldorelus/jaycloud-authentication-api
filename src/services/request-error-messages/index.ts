/**
 * All the error messages that can occur while handling
 * a user's request
 */
export const reqErrorMessages = {
  loginFailed: "Invalid username/email or password.",
  nonExistentUser: "The user doesn't exists.",
  serverError: "An error occured with server.",
  invalidToken: "Invalid token.",
  noToken: "No token provided.",
  forbiddenUser: "Access denied.",
  unavailable: "The data requested is unavailable",
  authFailed:
    "Authorization failed. An invalid email or password was provided.",
  validationFail: "Validation failed.",
  badRequest: "Bad request.",
};
