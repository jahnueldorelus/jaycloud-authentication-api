import { JoiValidationResults } from "@app-types/joi-validation";

export type DataRequest = {
  app: string;
  appApiPath: string;
};

export interface ValidDataRequest extends JoiValidationResults<DataRequest> {}
