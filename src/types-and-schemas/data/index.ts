import { JoiValidationResults } from "@app-types/joi-validation";

export type DataRequest = {
  serviceId: number;
  apiPath: string;
  apiMethod: "GET" | "PUT" | "POST" | "PATCH" | "DELETE";
};

export type ValidDataRequest = JoiValidationResults<DataRequest>;
