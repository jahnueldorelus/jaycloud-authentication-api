import { envNames } from "@startup/config";

type DeepPartialEnvVariables<T> = {
  [K in keyof Partial<T>]: DeepPartialEnvVariables<T[K]>;
};

export type CustomEnvVariablesValues = DeepPartialEnvVariables<typeof envNames>;
