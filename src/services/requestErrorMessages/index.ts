/**
 * All the error messages that can occur while handling
 * a user's request
 */
export const reqErrorMessages = {
  loginFailed: "Invalid username/email or password.",
  nonExistentUser: "The user doesn't exists.",
  serverError: "An error occured with server.",
  invalidToken: "Invalid token.",
  expToken: "Access token is expired.",
  noToken: "Access denied. No token provided.",
  forbiddenUser: "Access denied.",
  authFailed: "Authorization failed.",
  validationFail: "Validation failed.",
  badRequest: "Bad request.",
};
