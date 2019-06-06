const debug = require('debug');
const log = debug('community-usage-checker-node-oauth-authentication');


module.exports = function (app) {

	log('setting up authentication');

	var rp = require('request-promise');

	const CC_URL = `https://${process.env.CONNECTIONS_HOST}`;
	const CC_OAUTH_URL = '/manage/oauth2/authorize';
	const AUTHORIZATION_API = "/manage/oauth2/token";
	// const OAUTH_ENDPOINT = "/oauth/authorize";
	const sixtydays = 1000 * 60 * 60 * 24 * 60;
	const CLIENT_ID = process.env.CLIENT_ID;
	const CLIENT_SECRET = process.env.CLIENT_SECRET;

	const vcap_application = JSON.parse(process.env.VCAP_APPLICATION);
	const APP_HOSTNAME = 'https://' + vcap_application.application_uris[0];
	log('APP_HOSTNAME:', APP_HOSTNAME);

	/**
	 * The login link redirects to the OAUTH IdP.
	 */
	app.get('/login', function (req, res) {

		log('in /login');
		var redirectURL = CC_URL + CC_OAUTH_URL
			+ '?response_type=code'
			+ '&client_id=' + CLIENT_ID
			//		+ '&callback_uri=' + encodeURIComponent(APP_HOSTNAME)
			+ '&callback_uri=' + APP_HOSTNAME + '/oauthback'
			// + '&state=' 	+ req.session.id;
			;

		res.redirect(redirectURL);

	});

	/**
	 * The user is redirected to this URI after going through the Connections oauth process.
	 * Attempt to get an access token; if we get one, redirect to the page which will
	 * load the Connections data.
	 */
	app.get('/oauthback', function (req, res) {
		log('in oauthback');
		var redirect_uri = APP_HOSTNAME + '/oauthback';
		// log('query is', req.query);
		if (req.query.error) {
			log('Authorization step returned an error. User probably clicked cancel.');
			res.redirect('/');
			return;
		}

		var code = req.query.code;

		// Get the accessToken
		getAuthFromOAuthToken(CLIENT_ID, CLIENT_SECRET, code, redirect_uri)
		.then(results => {
			// Add the accesstoken to the session
			req.session.accessToken = results.access_token;
			// set userid in cookie
			res.cookie('community-usage-checker', results.id, { maxAge: sixtydays });
			res.redirect("/communities.html");
		})
		.catch(err => {
			// don't know why we are here so just redirect
			res.redirect('/?err=' + err.message);
		});
	});

	/**
	 * We have an oauth code so try to authenticate.
	 * Returns a promise.
	 */
	function getAuthFromOAuthToken(app_id, app_secret, oauth_code, redirect_uri) {

		return new Promise(function (resolve, reject) {

			var options = {
				method: 'POST',
				uri: `${CC_URL}${AUTHORIZATION_API}`,
				form: {
					code: oauth_code,
					grant_type: 'authorization_code',
					client_id: app_id,
					client_secret: app_secret,
					callback_uri: redirect_uri
				},
				headers: {
					'content-type': 'application/x-www-form-urlencoded'
				},
				resolveWithFullResponse: true, // gives us the statusCode
				json: false // don't parse the body to JSON
			};
			log("Issuing Authentication request with grant type 'authorization_code'");
			rp(options)
				.then(function (parsedBody) {
					log('authentication succeeded with status code', parsedBody.statusCode);
					const oauthInfo = parseQuery(parsedBody.body);
					if (parsedBody.statusCode !== 200) {
						// if our app can't authenticate then it must have been
						// disabled.
						log("ERROR: App can't authenticate");
						reject(new Error("App cannot authenticate"));
					}
					resolve(oauthInfo);
				})
				.catch(function (err) {
					log('authentication actually failed:', err.name, err.statusCode, err.message);
					reject(err);
				});

		});
	}

	function parseQuery(queryString) {
		var query = {};
		var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
		for (var i = 0; i < pairs.length; i++) {
			var pair = pairs[i].split('=');
			query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
		}
		return query;
	}
}
