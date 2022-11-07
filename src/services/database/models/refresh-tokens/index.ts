import { ClientSession, model, Schema } from "mongoose";
import { v4 as createUUID } from "uuid";

export const refreshTokensModel = model(
  "refresh-tokens",
  new Schema(
    {
      token: {
        type: String,
        required: true,
        min: 36,
        max: 36,
      },
      expDate: {
        type: Date,
        required: true,
      },
      userId: {
        type: String,
        required: true,
        min: 24,
        max: 24,
      },
    },
    {
      methods: {
        /**
         * Determines if a refresh token has expired.
         */
        isExpired: function () {
          return this.expDate.getTime() < new Date().getTime();
        },

        /**
         * Changes the expire date of the token
         * to set it as expired.
         */
        expireToken: async function () {
          this.expDate = new Date();
          await this.save();
        },
      },

      statics: {
        /**
         * Creates a refresh token for a user.
         * @param userId The id of the user to create a refresh token for
         * @param session The session to attach the token initialization to
         */
        createToken: async function (userId: string, session?: ClientSession) {
          // Creates a new date for the token's expiration
          const expDate = new Date();

          // Sets the date's expiration time
          expDate.setSeconds(
            expDate.getSeconds() + parseInt(<string>process.env["JWT_REF_EXP"])
          );

          // Creates a new token ID
          const token = createUUID();

          const [refreshToken] = await this.create(
            [
              {
                token,
                expDate,
                userId,
              },
            ],
            { session }
          );

          return refreshToken || null;
        },
      },
      timestamps: true,
    }
  ),
  "refresh-tokens"
);
