import { FormModelInputOptionWithJoi } from "@app-types/form-model";
import { newUserAttributes } from "@app-types/user/new-user";
import {
  configureAuthenticateUserFormModel,
  getAuthenticateUserFormModel,
} from "@controller/user/components/authenticate-user-form-model";
import { getMockReq } from "@jest-mock/express";
import { RequestSuccess } from "@middleware/request-success";
import { Request as ExpressRequest } from "express";

// Mocks the Request Success handler
jest.mock("@middleware/request-success", () => ({
  RequestSuccess: jest.fn(),
}));

describe("Route users - Authenticate User Form Model", () => {
  let mockRequestSuccess: jest.Mock;
  let mockRequest: ExpressRequest;

  beforeEach(() => {
    mockRequestSuccess = <jest.Mock>RequestSuccess;
    mockRequest = getMockReq();
  });

  afterEach(() => {
    mockRequestSuccess.mockClear();
    mockRequest.destroy();
  });

  it("Should create the final authenticate user form model input options", () => {
    const formModelInputOptions = <FormModelInputOptionWithJoi[]>(
      configureAuthenticateUserFormModel(newUserAttributes)
    );
    const containsJoiSchema = formModelInputOptions.reduce((prev, curr) => {
      return prev || !!curr.joiSchema;
    }, false);

    expect(formModelInputOptions).toBeTruthy();
    expect(containsJoiSchema).toBeFalsy();
  });

  it("Should retrieve the final authenticate user form model input options", async () => {
    await getAuthenticateUserFormModel(mockRequest);

    expect(mockRequestSuccess).toHaveBeenCalledTimes(1);
  });
});
