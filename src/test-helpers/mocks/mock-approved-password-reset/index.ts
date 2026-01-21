import { LoadedApprovedPasswordReset } from "@services/database/table-models/loaded-approved-password-reset";

/**
 * Retrieves a loaded approved password reset object as a mock.
 * @returns A loaded approved password reset object
 */
export function getMockApprovedPasswordReset(): LoadedApprovedPasswordReset {
  // 15 minute expiration date
  const expDate = new Date();
  expDate.setMinutes(expDate.getMinutes() + 15);

  return new LoadedApprovedPasswordReset({
    expiration_date: expDate,
    id: 1111,
    token: "weqjhi-dshjhks-eruewiro-fdskfh",
    user_id: 42,
  });
}
