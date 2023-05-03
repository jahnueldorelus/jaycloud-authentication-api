import { IService } from "@app-types/database/models/services";
import { JoiValidationResults } from "@app-types/joi-validation";

export type ServiceId = string;

export type ValidServiceId = JoiValidationResults<ServiceId>;

// Makes some properties of the service's data private
export type PrivateServiceData = Pick<
  IService,
  "available" | "description" | "name"
> & { _id: string; uiUrl: string };
