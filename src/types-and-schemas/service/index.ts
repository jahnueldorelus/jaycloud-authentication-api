import { JoiValidationResults } from "@app-types/joi-validation";

export type ServiceId = string;

export type ValidServiceId = JoiValidationResults<ServiceId>;
