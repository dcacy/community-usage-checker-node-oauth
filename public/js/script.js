/**
 *
 *@author Darren Cacy dcacy@us.ibm.com
 */


/**
 * call the /getAllCommunities API and create a datatable from the results
 * @params {String} "true" means "show all communities"
 * @returns {Object}
 */
function getAllCommunities(showAll) {
	$('#hamster_loader_wrapper').show();
	$('#bodyWrapper').hide();
	if ( $.fn.dataTable.isDataTable( '#communitiesTable' ) ) {
		$('#communitiesTable').DataTable().destroy();
	  }
  $.get('/getAllCommunities?showAll=' + showAll, 

     function (data, status, jq) {
		  $('#userInfo').html(`Communities available to user ${data.name} (${data.email})`);
      var communitiesTable = $('#communitiesTable').DataTable( {
        data: data.communityInfo,
        autoWidth: false,
        columns: [
          { data: "title" },
          { data: "owner" },
          { data: "created"},
          { data: "updated"},
          { data: "membercount"}            
        ],
        columnDefs : [
			{ className: 'chosen', targets: [1,2,3,4]},
        	{ className : "chosen communityName", targets: 0},
        	{ className : "dt-body-right", targets: 4},
         { title: "Name", targets: 0 , render: function(name, type, row) {
			  if ((type === 'display' || type === 'filter') && row.type === 'private') {
				  return '<span class="asterisks">***</span>' + name;
			  } else {
				  return name;
			  }
		  }},
          { title: "Owner", targets: 1 },
          { title: "Created", targets: 2, render: function(created, type) {
		      		// if type is display or filter then format the date
		      		if ( type === 'display' || type === 'filter') {
		      			return dateFormat(new Date(created), 'dd mmm yyyy h:MM:sstt');
		      		} else {
		      			// otherwise it must be for sorting so return the raw value
		      			return created;
		      		}    			
		      	} 
		      },
          { title: "Last Updated", targets: 3, render: function(updated, type) {
	        		// if type is display or filter then format the date
	        		if ( type === 'display' || type === 'filter') {
	        			return dateFormat(new Date(updated), 'dd mmm yyyy h:MM:sstt');
	        		} else {
	        			// otherwise it must be for sorting so return the raw value
	        			return updated;
	        		}    			
	        	} 
          },
          { title: "Nbr of Members", targets: 4 }
        ],
        "fnCreatedRow": function( nRow, aData, iDataIndex ) {
        	// create an attribute for the community ID so we can retrieve it later when we click on this message
        	nRow.getElementsByTagName('td')[0].setAttribute('community-id', aData.id); 
        }
      });
      
      communitiesTable.on('click', 'td', function(){
      	// un-highlight all communities
			$('.chosen').toggleClass('chosenCommunity', false);
			// now highlight selected one (gotta do every cell for some reason)
			var allCells = this.parentNode.getElementsByTagName('td');
			for (var i = 0; i < allCells.length; i++) {
				$(allCells[i]).toggleClass('chosenCommunity');
			}

    		// cleanup details area and any error messages
    		$('#tabs').remove();
    		$('#error').html('');
    		
			$('#communityDetailsWrapper').show();
			$('#hamster_details_loader_wrapper').show();
		  	// we set the community-id attribute earlier so that it would be here now
		  	// go through these steps so we get the community-id no matter where the user clicks in the row
		  	var communityId = this.parentNode.getElementsByClassName('communityName')[0].getAttribute('community-id');
    		$.get('/getCommunityDetails', { id : communityId}, processCommunityDetails, 'json')
    		.fail(function(err) {
    			console.log('an error occurred getting message details:', err);
    			$('#error').html(err.responseText);
    		})
    		.always(function() {
				$('#hamster_details_loader_wrapper').hide();
			});
		});
		$('#bodyWrapper').show();
    },
    'json')
    .fail(function(error) {
		 console.log('error getting all communities', error);
		 if (error.status === 401) {
			$('#error').html('It looks like you are not authenticated. Click <a href="/login">here</a> to log in.');
		 } else {
		 	$('#error').html('error getting all communities: ' + error.responseJSON.error);
		 }
    })
	  .always(function() {
		$('#hamster_loader_wrapper').hide();
		if (showAll) {
			$('#moreCommunities').hide();
		}
	  });
}

/**
 * Build datatables for files, members, and activity
 * @param {object} json array containing details for a Community
 * @returns n/a
 */
function processCommunityDetails(json) {

	var tabsHeader = '';
	var tabsDetail = '';
	var tabsCounter = 0;
	var filesFound = false;
	var membersFound = false;
	var activitiesFound = false;
	var subcommunitiesFound = false;
	
	// find members
	var members = json.find( function(item) {
    return item.type === 'members';
	});
	if (members.data.length > 0) {
		tabsHeader += '<li><a href="#tabs-' + tabsCounter + '">Members (' + members.data.length + ')</a></li>';
		tabsDetail += '<div id="tabs-' + tabsCounter + '">';
		tabsDetail += '<table id="membersTable"></table>';
		tabsDetail += '</div>';
		membersFound = true;
		tabsCounter++;
	}
	
	// find files
	var files = json.find( function(item) {
    return item.type === 'files';
	});
	if (files.data.length > 0) {
		tabsHeader += '<li><a href="#tabs-' + tabsCounter + '">Files (' + files.data.length + ')</a></li>';
		var fileSize = 0;
		$.each(files.data, function(index,file) {
			fileSize += file.size*1;
		});
		tabsDetail += '<div id="tabs-' + tabsCounter + '">';
		tabsDetail += '<div class="fileSizeDiv">Total files size:&nbsp;&nbsp;<span class="fileSize">' + fileSize.toLocaleString() + '</span></div>';
		tabsDetail += '<table id="filesTable"></table>';
		tabsDetail += '</div>';		
		filesFound = true;
		tabsCounter++;
	}
	
	// find activity
	var activities = json.find( function(item) {
    return item.type === 'activity';
	});
	if (activities.data.length > 0) {
		tabsHeader += '<li><a href="#tabs-' + tabsCounter + '">Recent Updates (' + activities.data.length + ')</a></li>';
		tabsDetail += '<div id="tabs-' + tabsCounter + '">';
		tabsDetail += '<table id="activitiesTable"></table>';
		tabsDetail += '</div>';
		activitiesFound = true;
		tabsCounter++;
	}
	
	// find subcommunities
	var subcommunities = json.find( function(item) {
    return item.type === 'subcommunities';
	});
	if (subcommunities.data.length > 0) {
		tabsHeader += '<li><a href="#tabs-' + tabsCounter + '">Subcommunities (' + subcommunities.data.length + ')</a></li>';
		tabsDetail += '<div id="tabs-' + tabsCounter + '">';
		tabsDetail += '<table id="subcommunitiesTable"></table>';
		tabsDetail += '</div>';
		subcommunitiesFound = true;
		tabsCounter++;
	}
	
	// now build tabs markup
	var tabsText = '<div id="tabs" class="tabs">'
		+ '<ul>' + tabsHeader + '</ul>'
		+ tabsDetail
		+ '</div>';
	$('#communityDetails').html(tabsText);
	
	// now create datatables for the above markup
	if (filesFound) {
	var filesTable = $('#filesTable').DataTable( {
    data: files.data,
    autoWidth: false,
    searching: false,
    paging: determinePaging(files.data),
    columns: [
      { data: "title" },
      { data: "size" }
    ],
    columnDefs : [
    	{ className: "dt-body-right", targets: 1},
      { title: "Name", targets: 0 },
	 	{ title: "Size", targets: 1, render: function(size, type) {
	    		// if type is display or filter then format the date
	    		if ( type === 'display' || type === 'filter') {
	    			return (size*1).toLocaleString();
	    		} else {
	    			// otherwise it must be for sorting so return the raw value
	    			return size;
	    		}    			
	    	} 
      }    
    ]
  });
	}
	if ( membersFound ) {
		var membersTable = $('#membersTable').DataTable( {
      data: members.data,
      autoWidth: false,
      searching: false,
      paging: determinePaging(members.data),
      columns: [
        { data: "name" },
        { data: "email" }
      ],
      columnDefs : [
        { title: "Name", targets: 0 },
        { title: "email", targets: 1 },       
      ]
    });
	}
	if ( activitiesFound ) {
		var activitiesTable = $('#activitiesTable').DataTable( {
      data: activities.data,
      autoWidth: false,
      searching: false,
      paging: determinePaging(activities.data),
      columns: [
        { data: "author" },
        { data: "title" },
        { data: "publishedDate"}
      ],
      columnDefs : [
        { title: "Name", targets: 0 },
        { title: "title", targets: 1 },
        { title: "Date", targets: 2, render: function(publishedDate, type) {
      		// if type is display or filter then format the date
	      		if ( type === 'display' || type === 'filter') {
	      			return dateFormat(new Date(publishedDate), 'dd mmm yyyy h:MM:sstt');
	      		} else {
	      			// otherwise it must be for sorting so return the raw value
	      			return publishedDate;
	      		}    			
	      	} 
	      },
      ]
    });
	}		
	if ( subcommunitiesFound ) {
		var subcommunitiesTable = $('#subcommunitiesTable').DataTable( {
      data: subcommunities.data,
      autoWidth: false,
      searching: false,
      paging: determinePaging(subcommunities.data),
      columns: [
        { data: 'title' }
      ],
      columnDefs : [
		  { title: 'Name', targets: 0 , render: function(name, type, row) {
			if ((type === 'display' || type === 'filter') && row.type === 'private') {
				return '<span class="asterisks">***</span>' + name;
			} else {
				return name;
			}
		}},

      ]
    });
	}	
	$('#tabs').tabs();

}

/**
 * Determines whether the array is long enough to require pagination
 * @param someArray
 * @returns {boolean} true if the array needs paging, false if it does not
 */
function determinePaging(someArray) {
	if (someArray.length > 10) {
		return true;
	} else {
		return false;
	}
}

$( document ).ready(function() {
	getAllCommunities(false); // start with only 50 communities for faster loading
});