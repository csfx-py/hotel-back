# Backend for hotel management project that manages api for auth and serve hotel menu using express/mongoose

## Clone app

clone the repo using `git clone https://github.com/csfx-py/hotel-back.git` and cd over to the folder

## Install dependencies

You install dependencies with `yarn` or `npm i` 

## Prep for needed sensitive data

add a .env file in root of the app using `touch .env`

add `MONGO_URI` for connecting mongo db,

`ADMIN_PASS` for logging in as admin,

`ACCESS_TOKEN_SEC` for jwt secret

`SMS_API_KEY` for fast2sms api key to sent password reset OTP

## Deployment changes

Add the domain for frontend in the src/index.js file cors section