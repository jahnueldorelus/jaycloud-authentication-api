// Determines what validating with Joi should return
export type JoiValidationParam = {
  returnError: boolean;
  message?: string;
  value?: any;
};
