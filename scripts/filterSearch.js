const handleFilterSearch = (function () {
	function toggler() {
		const toggleOption = 'filter-toggle-option';
		htmlUtil('[' + toggleOption + ']').on('change', function () {
			const ID = htmlUtil(this).attr(toggleOption);
			const isChecked = htmlUtil(this).prop('checked');

			if (isChecked) {
				htmlUtil('#' + ID).slideDown();
			} else {
				htmlUtil('#' + ID).slideUp();
			}
		});
	}

	function searchBarToggle() {
		htmlUtil('.closeInput').on('click', function () {
			htmlUtil('.filterSearchInputWrap').hide();
		});

		htmlUtil('.searchButton').on('click', function () {
			htmlUtil('.filterSearchInputWrap').show();
		});
	}

	function handleCustomEvents() {
		const customEvent = {
			detail: {
				status: ''
			}
		};

		/* Block Risky Sites Opted */
		htmlUtil('#blockRiskSites').on('change', function () {
			const riskySiteStatus = Object.assign({}, customEvent);

			riskySiteStatus.detail.status = $(this).prop('checked') ? 'yes' : 'no';
			Utils.dispatchEvent('riskySiteStatus', riskySitesOpted);
		});
		/* Block Risky Sites Opted */

		/* Block Tracker  */
		htmlUtil('#blockTrackers').on('change', function () {
			const trackSiteStatus = Object.assign({}, customEvent);

			trackSiteStatus.detail.status = $(this).prop('checked') ? 'yes' : 'no';
			Utils.dispatchEvent('trackSiteStatus', trackSiteStatus);
		});
		/* Block Tracker  */

		/* Block Websites */
		htmlUtil('#blockWebsites').on('change', function () {
			const blockSiteStatus = Object.assign({}, customEvent);

			blockSiteStatus.detail.status = $(this).prop('checked') ? 'yes' : 'no';
			Utils.dispatchEvent('blockSiteStatus');
		});
		/* Block Websites */

		/* Add this Website */
		htmlUtil('.addThisWebsite').on('click', function () {
			Utils.dispatchEvent('addThisWebsite');
		});
		/* Add this Website */

		/* Input Add url */
		htmlUtil('#blockUrlForm').on('submit', function (e) {
			e.preventDefault();
			let url = htmlUtil('#filterSearchInput').val().trim();

			try {
				url = new URL(url);
			} catch (e) {
				url = null;
			}

			if ((url = !!url && new URL(url).origin)) {
				Utils.dispatchEvent('blockUrl', {
					detail: {
						url
					}
				});
			} else {
				htmlUtil('.filterSearchInputWrap').addClass('error');
			}
		});

		htmlUtil('#filterSearchInput').on('keydown', function () {
			htmlUtil('.filterSearchInputWrap').removeClass('error');
		});
		/* Input Add url */
	}

	function setViewOnLoad() {
		// Set OnLoad View
	}

	function load() {
		toggler();
		searchBarToggle();
		handleCustomEvents();
		setViewOnLoad();
	}

	return {
		load
	};
})();

htmlUtil(document).ready(function () {
	handleFilterSearch.load();
});
