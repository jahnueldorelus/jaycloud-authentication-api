export type JoiValidationResults<T> =
  | {
      isValid: true;
      errorMessage: null;
      validatedValue: T;
    }
  | {
      isValid: false;
      errorMessage: string;
      validatedValue: undefined;
    };
