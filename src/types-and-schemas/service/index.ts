import { JoiValidationResults } from "@app-types/joi-validation";

export type ServiceId = { serviceId: string };

export type ValidServiceId = JoiValidationResults<ServiceId>;
