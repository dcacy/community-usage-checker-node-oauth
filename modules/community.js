var debug = require('debug');
const log = debug('community-usage-checker-node-oauth-community');
var parseString = require('xml2js').parseString;
var rp = require('request-promise');
var dateMath = require('date-arithmetic');


/**
 * 
 */
exports.getUserIdentity = (accessToken) => {
	return new Promise((resolve, reject) => {
		const options = {
			method: 'GET',
			uri: `https://${process.env.CONNECTIONS_HOST}/manage/oauth/getUserIdentity`,
			headers: {
				'Authorization': `bearer ${accessToken}`
			},
			json: true // parse the result to JSON
		};
		rp(options)
			.then(result => {
				resolve(result);
			})
			.catch(err => {
				reject(err);
			});
	});
}


/**
* this call will get the list of Communities from Connections
* @param {object} json containing credentials
* @returns {object} json containing the data from Connections 
*/
exports.getAllCommunities = function (accessToken, showAll) {

	return new Promise(function (resolve, reject) {
		let nbrOfCommunities = 50;
		if (showAll == 'true') {
			nbrOfCommunities = 500;
		}
		var ALL_COMMUNITIES_URI = '/communities/service/atom/communities/all?ps=' + nbrOfCommunities;

		var options = {
			method: 'GET',
			uri: `https://${process.env.CONNECTIONS_HOST}${ALL_COMMUNITIES_URI}`,
			headers: {
				'Authorization': `bearer ${accessToken}`
			},
			json: false // do not parse the result to JSON
		};
		rp(options)
			.then(function (resultXML) {
				// parse the XML to JSON
				parseString(resultXML, { explicitArray: false }, function (err, parsedXml) {
					if (err === null) {
						var communityInfo = [];
						for (var i = 0; i < parsedXml.feed.entry.length; i++) {
							// just return the data we want
							var entry = {
								title: parsedXml.feed.entry[i].title._,
								id: parsedXml.feed.entry[i]['snx:communityUuid'],
								updated: parsedXml.feed.entry[i].updated,
								owner: parsedXml.feed.entry[i].author.name,
								created: parsedXml.feed.entry[i].published,
								membercount: parsedXml.feed.entry[i]["snx:membercount"],
								type: parsedXml.feed.entry[i]['snx:communityType']
							};
							communityInfo.push(entry);
						}
						resolve(communityInfo);
					} else {
						// handle error condition in parse
						log('error parsing getting all communities!!', err);
						reject('error parsing all communities: ' + err.message);
					}
				});
			})
			.catch(function (err) {
				// handle error condition in request
				log('error getting all communities:', err.statusCode);
				reject(err);
			});
	});
};

/**
 * Get the list of members of a community
 * @param {object} json containing credentials
 * @param {string} community Uuid
 * @returns {Promise} a Promise which resolves to json containing the member list
*/
exports.getCommunityMembers = function (id, accessToken) {

	// log('in .getCommunityMembers, id is [', id, ']');

	return new Promise(function (resolve, reject) {

		var COMM_MEMBERS_URI = '/communities/service/atom/community/members?ps=1000&communityUuid=';

		var options = {
			method: 'GET',
			uri: `https://${process.env.CONNECTIONS_HOST}${COMM_MEMBERS_URI}${id}`,
			headers: {
				'Authorization': `bearer ${accessToken}`
			},
			json: false // do not parse the result to JSON
		};

		rp(options)
			.then(function (resultXML) {
				// set explicitArray to true to force an array so we can iterate through it, even if there is only one result
				parseString(resultXML, { explicitArray: true }, function (err, parsedXml) {
					if (err === null) {
						var members = [];
						for (var i = 0; i < parsedXml.feed.entry.length; i++) {
							// if a user is inactive, there is no email address...so check for one
							var member = {
								name: parsedXml.feed.entry[i].contributor[0].name[0],
								email: parsedXml.feed.entry[i].contributor[0].email ? parsedXml.feed.entry[i].contributor[0].email[0] : '',
								state: parsedXml.feed.entry[i].contributor[0]["snx:userState"][0]._
							};
							members.push(member);
						}
						resolve({ "type": "members", "data": members });
					}
					else {
						log('error parsing members:', err);
						reject('error parsing members: ' + err.message);
					}
				});
			})
			.catch(function (err) {
				log('error getting community members', err.message);
				reject('error getting community members: ' + err.message);
			});
	});


};


/**
 * Get the list of files of a community
 * @param {object} json containing credentials
 * @param {string} community Uuid
 * @returns {Promise} a Promise which resolves to json containing the files list
*/
exports.getCommunityFiles = function (id, accessToken) {

	// log('in .getCommunityFiles, id is [', id, ']');

	return new Promise(function (resolve, reject) {

		var COMM_FILES_URI = '/files/basic/api/communitycollection/'
			+ id
			+ '/feed?sC=document&pageSize=500&sortBy=title&type=communityFiles';

		var options = {
			method: 'GET',
			uri: `https://${process.env.CONNECTIONS_HOST}${COMM_FILES_URI}`,
			headers: {
				'Authorization': `bearer ${accessToken}`
			},
			json: false // don't parse the result to JSON
		};

		rp(options)
			.then(function (result) {
				parseString(result, { explicitArray: true }, function (err, parsedXml) {
					if (err === null) {
						var files = [];
						if (parsedXml.feed['opensearch:totalResults'][0] > 0) {
							for (var i = 0; i < parsedXml.feed.entry.length; i++) {
								var sizeLink = parsedXml.feed.entry[i].link.find(function (item) {
									return typeof item.$.length !== 'undefined';
								});
								var file = {
									title: parsedXml.feed.entry[i].title[0]._,
									size: sizeLink.$.length
								};
								files.push(file);
							}
						}
						resolve({ "type": "files", "data": files });
					} else {
						log('error parsing files:', err);
						reject('error parsing files: ' + err.message);
					}
				});
			})
			.catch(function (err) {
				log('error getting community files', err);
				reject(err);
			});
	});
};

/**
 * Get the list of subcommunities of a community
 * @param {object} json containing credentials
 * @param {string} community Uuid
 * @returns {Promise} a Promise which resolves to json containing the subcommunities list
*/
exports.getSubcommunities = function (id, accessToken) {

	// log('in .getSubcommunities, id is [', id, ']');

	return new Promise(function (resolve, reject) {

		var SUBCOMMUNITIES_URI = '/communities/service/atom/community/subcommunities?communityUuid='
			+ id;

		var options = {
			method: 'GET',
			uri: 'https://' + process.env.CONNECTIONS_HOST + SUBCOMMUNITIES_URI,
			headers: {
				'Authorization': `bearer ${accessToken}`
			},
			json: false // don't parse the result to JSON
		};

		rp(options)
			.then(function (result) {
				parseString(result, { explicitArray: true }, function (err, parsedXml) {
					if (err === null) {
						var subcommunities = [];
						if (parsedXml.feed['opensearch:totalResults'][0] > 0) {
							for (var i = 0; i < parsedXml.feed.entry.length; i++) {
								var subcommunity = {
									title: parsedXml.feed.entry[i].title[0]._,
									type: parsedXml.feed.entry[i]['snx:communityType'][0] 
								};
								subcommunities.push(subcommunity);
							}
						}
						resolve({ type: "subcommunities", data: subcommunities });
					} else {
						log('error parsing subcommunities:', err);
						reject('error parsing subcommunities: ' + err.message);
					}
				});
			})
			.catch(function (err) {
				log('error getting subcommunities', err);
				reject(err);
			});
	});
};


/**
 * Get the list of recent activity (last 30 days) of a community
 * @param {object} json containing credentials
 * @param {string} community Uuid
 * @returns {Promise} a Promise which resolves to json containing the activity list
*/
exports.getRecentActivity = function (id, accessToken) {

	// log('in .getRecentActivity, id is [', id, ']');

	return new Promise(function (resolve, reject) {

		var oneMonthAgo = dateMath.subtract(new Date(), 30, 'day').toISOString();

		var COMM_ACTIVITY_URI = '/connections/opensocial/basic/rest/activitystreams/urn:lsid:lconn.ibm.com:communities.community:'
			+ id
			+ '/@all/@all?rollup=true&shortStrings=true&format=json&updatedSince' + oneMonthAgo;

		var options = {
			method: 'GET',
			uri: `https://${process.env.CONNECTIONS_HOST }${COMM_ACTIVITY_URI}`,
			headers: {
				'Authorization': `bearer ${accessToken}`
			},
			json: true // parse the body to JSON!
		};

		rp(options)
			.then(function (result) {
				var activity = [];
				for (var i = 0; i < result.list.length; i++) {
					var details = {
						name: result.list[i].connections.containerName,
						title: result.list[i].connections.plainTitle,
						author: result.list[i].actor.displayName,
						publishedDate: result.list[i].published,
						shortTitle: result.list[i].connections.shortTitle,
						itemUrl: result.list[i].openSocial.embed.context.itemUrl
					};
					activity.push(details);
				}
				resolve({ type: "activity", data: activity });

			})
			.catch(function (err) {
				log('error getting recent activity', err.statusCode);
				reject(err.statusCode);
			});
	});
};
