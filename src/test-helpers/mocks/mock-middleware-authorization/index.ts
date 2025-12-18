import * as moduleMiddlewareAuthorization from "@middleware/authorization";

export const mockMiddlewareAuthorization: Record<
  keyof typeof moduleMiddlewareAuthorization,
  jest.SpyInstance
> = {
  getRequestUserData: jest
    .spyOn(moduleMiddlewareAuthorization, "getRequestUserData")
    .mockImplementation(),
  requestAuthenticationChecked: jest
    .spyOn(moduleMiddlewareAuthorization, "requestAuthenticationChecked")
    .mockImplementation(),
  requestIsAuthorized: jest
    .spyOn(moduleMiddlewareAuthorization, "requestIsAuthorized")
    .mockImplementation(),
  validateRequestAuthorization: jest
    .spyOn(moduleMiddlewareAuthorization, "validateRequestAuthorization")
    .mockImplementation(),
  validateSSOReqAuthorization: jest
    .spyOn(moduleMiddlewareAuthorization, "validateSSOReqAuthorization")
    .mockImplementation(),
};
