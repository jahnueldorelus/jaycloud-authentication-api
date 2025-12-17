import * as moduleRequestSuccess from "@middleware/request-success";

// The the Request Success middleware as a mock.
export const mockRequestSuccess = jest
  .spyOn(moduleRequestSuccess, "RequestSuccess")
  .mockImplementation();
