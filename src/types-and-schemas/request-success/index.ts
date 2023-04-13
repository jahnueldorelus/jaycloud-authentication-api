import { Request as ExpressRequest } from "express";

// Successful data return type
export type RequestSuccessData = string | number | object | boolean | undefined;

// Successful file return type
export type RequestSuccessFile = string;

// Express success response headers
export type ExtraHeaders = Array<{ headerName: string; headerValue: string }>;

// Express success cookie info
export type CookieInfo = {
  key: string;
  value: string;
  expDate?: Date;
  sameSite: "strict" | "lax";
};

// Express success cookie info update
export type CookieInfoUpdate = Pick<CookieInfo, "key" | "value"> &
  Partial<CookieInfo>;

// Express success cookie removal
export type CookieRemoval = {
  key: string;
};

// Express success response
type SuccessResponse = {
  headers?: ExtraHeaders | null;
  data: RequestSuccessData | null;
  file?: RequestSuccessFile | null;
  cookies?: CookieInfo[] | null;
  removeCookies?: CookieRemoval[] | null;
};

// Express request with a success property
export interface ExpressRequestSuccess extends ExpressRequest {
  success?: SuccessResponse;
}
