import { JoiValidationResults } from "@app-types/joi-validation";

export type DataRequest = {
  serviceId: string;
  apiPath: string;
  apiMethod: "GET" | "PUT" | "POST" | "PATCH" | "DELETE";
};

export interface ValidDataRequest extends JoiValidationResults<DataRequest> {}
