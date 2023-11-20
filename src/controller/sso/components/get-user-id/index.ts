import { ExpressRequestAndUser } from "@app-types/authorization";
import { requestIsAuthorized } from "@middleware/authorization";
import { RequestSuccess } from "@middleware/request-success";

export const getUserId = async (req: ExpressRequestAndUser) => {
  if (requestIsAuthorized(req)) {
    RequestSuccess(req, req.user.id);
  }
};
