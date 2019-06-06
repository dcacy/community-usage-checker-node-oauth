# community-usage-checker-node-oauth

Instructions:

This sample application lists all the Connections Cloud Communities which can be viewed by the ID you provide (including restricted ones!), and also shows various metrics for each Community.

For a Java version of the same application, see [here](https://github.com/dcacy/community-usage-checker-java-oauth).


## Getting started

1. Create an **Internal Application** entry in your Connections Cloud environment. See [here](https://www-10.lotus.com/ldd/appdevwiki.nsf/xpAPIViewer.xsp?lookupName=API+Reference#action=openDocument&res_title=Step_1_Register_the_application_sbt&content=apicontent&sa=true) for info.

  - The Auth Type should be `OAuth 2.0`.

  - The callback URL should be your hostname plus `/oauthback`, ex. `https://server.com/oauthback`.

2. Provide the following environment variables to your application:

  ```
  DEBUG: community-usage-checker-node-auth-* (optional)
  CLIENT_ID: <client id from the above step>
  CLIENT_SECRET: <secret from the above step>
  CONNECTIONS_HOST: <host name, such as apps.na.collabserv.com>
  VCAP_APPLICATION={"application_uris":["<your uri, such as 6c689800.ngrok.io>"]} 
  ```

3. Download `date.format.js` from [https://gist.github.com/eralston/968809](https://gist.github.com/eralston/968809) and copy it to the `public/js` directory.


4. Install the dependencies the application needs:

  ```none
  npm install
  ```

5. Start the application locally:

  ```
  npm start
  ```

6. Load the application in your browser. When you click `Log In`, you'll be taken to Connections Cloud. Once you authenticate, you'll be prompted to allow this application to access your Connections Cloud data. If you approve, you'll be directed back to the app, where it will attempt to retrieve the Communities to which you have access.

7. Click on a Community row to see its details!

Please read the LICENSE file for copyright and license information!
