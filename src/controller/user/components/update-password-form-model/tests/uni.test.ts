import { getMockReq } from "@jest-mock/express";
import { getUpdatePasswordFormModel } from "@controller/user/components/update-password-form-model";
import { mockRequestSuccess } from "@test-helpers/mocks/mock-request-success";

describe("Controller - User -> Retrieving the update password form model", () => {
  const mockHttpRequest = getMockReq();

  it("Should return the update paswword form model", () => {
    getUpdatePasswordFormModel(mockHttpRequest);

    expect(mockRequestSuccess).toHaveBeenCalled();
    expect(mockRequestSuccess).toHaveBeenCalledWith(mockHttpRequest, {
      title: "Update Password",
      inputs: expect.any(Array),
    });
  });
});
