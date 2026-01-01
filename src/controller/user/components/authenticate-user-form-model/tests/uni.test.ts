import { getAuthenticateUserFormModel } from "@controller/user/components/authenticate-user-form-model";
import { getMockReq } from "@jest-mock/express";
import { mockRequestSuccess } from "@test-helpers/mocks/mock-request-success";

describe("Controller - User -> Retrieving the user authentication form model", () => {
  const mockHttpRequest = getMockReq();

  it("Should return the user authentication form model", () => {
    getAuthenticateUserFormModel(mockHttpRequest);

    expect(mockRequestSuccess).toHaveBeenCalled();
    expect(mockRequestSuccess).toHaveBeenCalledWith(mockHttpRequest, {
      title: "Login",
      inputs: expect.any(Array),
    });
  });
});
