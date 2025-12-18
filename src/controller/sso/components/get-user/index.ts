import { ExpressRequestAndUser } from "@app-types/authorization";
import { requestIsAuthorized } from "@middleware/authorization";
import { RequestError } from "@middleware/request-error";
import { RequestSuccess } from "@middleware/request-success";

export function getUser(req: ExpressRequestAndUser): void {
  if (requestIsAuthorized(req)) {
    RequestSuccess(req, req.user.getSsoInfoJson());
  } else {
    RequestError(req, Error("This request is invalid")).notAuthorized();
  }
}
