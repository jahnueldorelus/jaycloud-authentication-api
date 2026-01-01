import { getMockReq } from "@jest-mock/express";
import { getNewUserFormModel } from "@controller/user/components/new-user-form-model";
import { mockRequestSuccess } from "@test-helpers/mocks/mock-request-success";

describe("Controller - User -> Retrieving the new user form model", () => {
  const mockHttpRequest = getMockReq();

  it("Should return the new user form model", () => {
    getNewUserFormModel(mockHttpRequest);

    expect(mockRequestSuccess).toHaveBeenCalled();
    expect(mockRequestSuccess).toHaveBeenCalledWith(mockHttpRequest, {
      title: "Create A New Account",
      inputs: expect.any(Array),
    });
  });
});
