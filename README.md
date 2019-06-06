# dpc-community-usage-checker-oauth

Instructions:

This sample application lists all the Connections Cloud Communities which can be viewed by the ID you provide, and also shows various metrics for each Community.

For a Java version of the same application, see [here](https://github.com/dcacy/dpc-community-usage-checker-liberty).


## Getting started

1. Create an **Internal Application** entry in your Connections Cloud environment. See [here](https://www-10.lotus.com/ldd/appdevwiki.nsf/xpAPIViewer.xsp?lookupName=API+Reference#action=openDocument&res_title=Step_1_Register_the_application_sbt&content=apicontent&sa=true) for info.

  - The Auth Type should be `OAuth 2.0`.

  - The callback URL should be your hostname plus `/oauthback`, ex. `https://server.com/oauthback`.

1. Provide the following environment variables to your application:

  ```
  DEBUG: dpc-community-usage-checker-* (optional)
  CLIENT_ID: <client id from the above step>
  CLIENT_SECRET: <secret from the above step>
  CONNECTIONS_HOST: <host name, such as apps.na.collabserv.com>
  ```

1. Download `date.format.js` from [https://gist.github.com/jhbsk/4690754](https://gist.github.com/jhbsk/4690754) and copy it to the `public/js` directory.


1. Install the dependencies the application needs:

  ```none
  npm install
  ```

1. Start the application locally:

  ```
  npm start
  ```

1. Load the application in your browser. When you click `Log In`, you'll be taken to Connections Cloud. Once you authenticate, you'll be prompted to allow this application to access your Connections Cloud data. If you approve, you'll be directed back to the app, where it will attempt to retrieve the Communities to which you have access.

1. Click on a Community row to see its details!

Please read the LICENSE file for copyright and license information!
