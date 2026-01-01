import { getMockReq } from "@jest-mock/express";
import { getPasswordResetFormModel } from "@controller/user/components/password-reset-form-model";
import { mockRequestSuccess } from "@test-helpers/mocks/mock-request-success";

describe("Controller - User -> Retrieving the password reset form model", () => {
  const mockHttpRequest = getMockReq();

  it("Should return the password reset form model", () => {
    getPasswordResetFormModel(mockHttpRequest);

    expect(mockRequestSuccess).toHaveBeenCalled();
    expect(mockRequestSuccess).toHaveBeenCalledWith(mockHttpRequest, {
      title: "Forgot Password",
      inputs: expect.any(Array),
    });
  });
});
