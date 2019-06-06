/**
 *
 *@author Darren Cacy dcacy@us.ibm.com
 */

require('dotenv').config({ silent: true, path: 'local.env' });
var debug = require('debug');
const log = debug('community-usage-checker-node-oauth-app');

var express = require('express');
var cfenv = require('cfenv');
var app = express();
// var rp = require('request-promise');
var url = require('url');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const cookieParser = require('cookie-parser');


app.use(cookieParser());

// Creates user session cookies that allows users to navigate between protected routes without
// having to log in every time
app.use(session({
	store: new MemoryStore({
		checkPeriod: 86400000 // prune expired entries every 24h
	}),
	secret: 'a somewhat random secret',
	saveUninitialized: false,
	resave: true
}));

var appEnv = cfenv.getAppEnv();


// this module knows how to get Community content
const community = require('./modules/community');
// this module knows how to authenticate via oauth
const authentication = require('./modules/authentication');
authentication(app);

/**
* Get the list of Communities from Connections
* @returns {object} json containing the data from Connections
*/
app.get('/getAllCommunities', function (req, res) {
	log('in /getAllCommunities');
	var qs = url.parse(req.url, true).query;
	community.getAllCommunities(req.session.accessToken, qs.showAll)  // it's a promise
	.then(communityInfo => {
		const payload = {
			communityInfo: communityInfo
		};
		community.getUserIdentity(req.session.accessToken)
			.then(userInfo => {
				payload.name = userInfo.name;
				payload.email = userInfo.email;
				res.json(payload);
			})
			.catch(err => {
				res.json(payload);
			});
	})
	.catch(err => {
		log('getAllCommunities returned error', err.statusCode);
		res.status(err.statusCode).json({ error: 'get all communities returned error:' + err });
	});
});

/**
 * Get the members, files, and recent activity for a community
 * @param {string} the community Uuid
 * @returns {object} json array containing the members, files, and recent activity
 */
app.get('/getCommunityDetails', function (req, res) {
	var qs = url.parse(req.url, true).query;
	if (qs.id) {
		var promises = [];
		promises.push(community.getCommunityMembers(qs.id, req.session.accessToken));
		promises.push(community.getCommunityFiles(qs.id, req.session.accessToken));
		promises.push(community.getRecentActivity(qs.id, req.session.accessToken));
		promises.push(community.getSubcommunities(qs.id, req.session.accessToken));
		Promise.all(promises) // process all promises once they've all returned
			.then(allData => {
				res.json(allData);
			})
			.catch(err => {
				console.log('error in one of the promises:', err);
				res.status(500).json(err);
			});
	} else {
		res.status(400).end('no Community ID provided');
	}
});

// serve static files from /public directory
app.use(express.static(__dirname + '/public'));

//start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function () {
	log(`server starting on ${appEnv.url}:${appEnv.port}`);
});
