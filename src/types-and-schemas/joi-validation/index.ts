export type JoiValidationResults<T> = {
  isValid: boolean;
  errorMessage: string | null;
  validatedValue: T;
};
