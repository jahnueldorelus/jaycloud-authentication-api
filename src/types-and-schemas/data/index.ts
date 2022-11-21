import { JoiValidationResults } from "@app-types/joi-validation";

export type DataRequest = {
  app: string;
  appApiUrl: string;
};

export interface ValidDataRequest extends JoiValidationResults<DataRequest> {}
