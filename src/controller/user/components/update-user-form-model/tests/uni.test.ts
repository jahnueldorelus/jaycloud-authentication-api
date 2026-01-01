import { getMockReq } from "@jest-mock/express";
import { getUpdateUserFormModel } from "@controller/user/components/update-user-form-model";
import { mockRequestSuccess } from "@test-helpers/mocks/mock-request-success";

describe("Controller - User -> Retrieving the update user form model", () => {
  const mockHttpRequest = getMockReq();

  it("Should return the update user form model", () => {
    getUpdateUserFormModel(mockHttpRequest);

    expect(mockRequestSuccess).toHaveBeenCalled();
    expect(mockRequestSuccess).toHaveBeenCalledWith(mockHttpRequest, {
      title: "Update Profile",
      inputs: expect.any(Array),
    });
  });
});
