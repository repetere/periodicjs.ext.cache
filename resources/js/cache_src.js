// 'use strict';

// var componentTab1,
// 	tabelement,
// 	replicationstatuscontainer,
// 	replicationstatustextarea,
// 	ComponentTabs = require('periodicjs.component.tabs');


// var tabEvents = function () {
// 	componentTab1.on('tabsShowIndex', function ( /*index*/ ) {
// 		// codemirrortab(index);
// 	});
// };


// window.showReplicationStatusResult = function () {
// 	replicationstatuscontainer.style.display = 'block';
// 	replicationstatustextarea.innerHTML = 'Replicating Application...';
// };

// window.displayReplicationStatus = function (ajaxFormResponse) {
// 	// console.log(ajaxFormResponse);
// 	replicationstatustextarea.innerHTML = JSON.stringify(ajaxFormResponse, null, 2);
// };

// window.handleAjaxError = function (errormessage) {
// 	//console.log('errormessage', errormessage);
// 	if (errormessage === 'Origin is not allowed by Access-Control-Allow-Origin') {
// 		window.location.reload();
// 	}
// };

// window.addEventListener('load', function () {
// 	tabelement = document.getElementById('tabs');
// 	replicationstatuscontainer = document.getElementById('replicationstatuscontainer');
// 	replicationstatustextarea = document.getElementById('replicationstatustextarea');
// 	window.ajaxFormEventListers('._pea-ajax-form');
// 	if (tabelement) {
// 		componentTab1 = new ComponentTabs(tabelement);
// 	}
// 	tabEvents();
// });
