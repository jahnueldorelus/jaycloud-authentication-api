import { ExpressRequestAndUser } from "@app-types/authorization";
import { requestIsAuthorized } from "@middleware/authorization";
import { RequestSuccess } from "@middleware/request-success";

export const getUser = (req: ExpressRequestAndUser) => {
  if (requestIsAuthorized(req)) {
    RequestSuccess(req, req.user.toPrivateSSOJSON());
  }
};
