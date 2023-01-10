# <img src="./src/assets/images/jaycloud.png" alt="JayCloud Logo" height="40" style="margin-right: 1rem;"> JayCloud Authentication API
The Express server for handling authentication with JayCloud services. Runs in conjuction with
the [JayCloud Authentication UI](https://github.com/jahnueldorelus/jaycloud-authentication-ui).

<br />
<br />

## Run Locally

Clone the project

```bash
  git clone https://github.com/jahnueldorelus/jaycloud-authentication-api.git
```

Go to the project directory

```bash
  cd jaycloud-authentication-api
```

Install dependencies

```bash
  npm install
```

Start the server

```bash
  npm start
```

<br />
<br />

## Running Tests

Tests have been created using Jest. To run tests, run the following command.

```bash
  npm test
```

<br />
<br />

## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

#### Database Variables

- `DATABASE_NAME` - The database name
- `DATABASE_HOST` - The database server address
- `DATABASE_USERNAME` - The database server username
- `DATABASE_PASSWORD` - The database server password

#### Json Web Token Variables

- `JWT_ALGORITHM` - The algorithm to sign tokens
- `JWT_KEY` - The private key to sign and verify tokens
- `JWT_ACC_REQ_HEADER` - The request header name for access tokens
- `JWT_REF_REQ_HEADER` - The request header name for refresh tokens
- `JWT_ACC_EXP` - The amount of time before an access token expires from its instantiation
- `JWT_REF_EXP_DAYS` - The amount of time before a refresh token expires from its instantiation

#### Crypting Variables

- `CRYPTO_KEY` - The private key to hash values
- `CRYPTO_TEMP_TOKEN_EXP_MINUTES` - The amount of time in minutes before an approved password reset expires

#### Request Origin Variables

- `ORIGIN_LOCAL_HOST_ADDR` - The accepted local host address
- `ORIGIN_LAN_ADDR` - The accepted LAN address

#### Email Variables

- `EMAIL_USERNAME` - The username for JayCloud's email
- `EMAIL_PASSWORD` - The password for JayCloud's email
- `EMAIL_USER_SUPPORT` - The support email for JayCloud

#### UI Variables

- `UI_BASE_URL_DEV` - The local address of JayCloud's Authentication UI
- `UI_BASE_URL_PROD` - The remote address of JayCloud's Authentication

#### Node Environment Variable

- `NODE_ENV` - The environment the server should run in (either "development" or "production")

<br />
<br />

## API Reference

1. Gets new user form models

```http
  GET /api/users/form-models
```

<br />

2. Creates a new user

```http
  POST /api/users/new
```

- **Parameter type** - JSON Request Body

  | Parameter   | Type     | Required | Min Length | Max Length | Description           |
  | :---------- | :------- | :------- | :--------- | :--------- | :-------------------- |
  | `firstName` | `string` | `true`   | 2          | 255        | The user's first name |
  | `lastName`  | `string` | `true`   | 2          | 255        | The user's last name  |
  | `email`     | `string` | `true`   | 5          | 100        | The user's email      |
  | `password`  | `string` | `true`   | 5          | 100        | The user's password   |

  <br />

3. Authenticates a user

```http
  POST /api/users/
```

- **Parameter type** - JSON Request Body

  | Parameter  | Type     | Required | Description         |
  | :--------- | :------- | :------- | :------------------ |
  | `email`    | `string` | `true`   | The user's email    |
  | `password` | `string` | `true`   | The user's password |

  <br />

4. Creates a new refresh token

```http
  POST /api/users/refreshToken
```

- **Parameter type** - JSON Request Body

  | Parameter | Type     | Required | Description                       |
  | :-------- | :------- | :------- | :-------------------------------- |
  | `token`   | `string` | `true`   | The user's previous refresh token |

  <br />

5. Sends data to a JayCloud service API with the user's authorization

```http
  ALL /api/data
```

- **Parameter type** - JSON Request Body

  | Parameter    | Type     | Required | Description                                                 |
  | :----------- | :------- | :------- | :---------------------------------------------------------- |
  | `app`        | `string` | `true`   | The name of the JayCloud service to send the request to     |
  | `appApiPath` | `string` | `true`   | The API path of the JayCloud service to send the request to |

  <br />

6. Resets a user's password

```http
  POST /api/users/password-reset
```

- **Parameter type** - JSON Request Body

  | Parameter | Type     | Required | Description      |
  | :-------- | :------- | :------- | :--------------- |
  | `email`   | `string` | `true`   | The user's email |

  <br />

7. Updates a user's password

```http
  POST /api/users/
```

- **Parameter type** - JSON Request Body

  | Parameter  | Type     | Required | Description                              |
  | :--------- | :------- | :------- | :--------------------------------------- |
  | `email`    | `string` | `true`   | The user's email                         |
  | `password` | `string` | `true`   | The user's new password                  |
  | `token`    | `string` | `true`   | The user's approved password reset token |
