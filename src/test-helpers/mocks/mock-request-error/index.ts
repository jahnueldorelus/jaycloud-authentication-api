import { RequestErrorMethods } from "@app-types/request-error";
import * as moduleRequestError from "@middleware/request-error";

/**
 * Retrieves the request error mock.
 * @param errorMethods An object that contains the functions that will be invoked
 *                     when a request error method is called
 * @returns The request error's mock
 */
export function getMockRequestError(
  errorMethods: Partial<Record<keyof RequestErrorMethods, jest.Mock>>
) {
  return jest
    .spyOn(moduleRequestError, "RequestError")
    .mockImplementation(() => ({
      badRequest: jest.fn(),
      forbidden: jest.fn(),
      notAuthorized: jest.fn(),
      server: jest.fn(),
      validation: jest.fn(),
      ...errorMethods,
    }));
}
