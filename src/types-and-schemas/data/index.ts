import { JoiValidationResults } from "@app-types/joi-validation";

export type DataRequest = {
  serviceId: string;
  apiPath: string;
};

export interface ValidDataRequest extends JoiValidationResults<DataRequest> {}
