import * as moduleAuthorization from "@middleware/authorization";
import { DataController } from "@controller/data";
import { getMockReq } from "@jest-mock/express";
import { Request as ExpressRequest } from "express";

// Mocks the Authorization
const mockRequestAuthenticationChecked = jest
  .spyOn(moduleAuthorization, "requestAuthenticationChecked")
  .mockImplementation();

describe("Route - Data", () => {
  let mockHttpRequest: ExpressRequest;

  beforeEach(() => {
    mockHttpRequest = getMockReq();
  });

  afterEach(() => {
    mockHttpRequest.destroy();
    mockRequestAuthenticationChecked.mockClear();
  });

  it("Should fail request due to authentication error", async () => {
    await DataController.transferRoute(mockHttpRequest);

    expect(mockRequestAuthenticationChecked).toHaveBeenCalledTimes(2);
  });

  describe("Requests with no validation error", () => {
    beforeEach(() => {});

    it("Should fail request due to a bad request", async () => {});

    describe("Failed requests due to server error", () => {
      it("Should fail due to error retrieving the list of services available from the database", async () => {});

      it("Should fail due to error thrown while retrieving the user's data from the request", async () => {});

      it("Should fail due to request service being unavailable", async () => {});

      it("Should fail due to error thrown while retrieving data from destined server", async () => {});
    });

    it("Should pass the request succuessfully", async () => {});
  });
});
