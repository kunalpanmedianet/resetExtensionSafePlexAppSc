const handleFilterSearch = (function () {
	function handleDispatch() {
		const event = {
			detail: {
				status: ''
			}
		};

		htmlUtil();
		// Utils.dispatchEvent();
	}

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
			htmlUtil('.filterSearchInputWrap').fadeOut();
		});

		htmlUtil('.searchButton').on('click', function () {
			htmlUtil('.filterSearchInputWrap').fadeIn();
		});
	}

	function blockToggleHandler() {
		const customEvent = {
			detail: {
				status: ''
			}
		};

		htmlUtil('#blockRiskSites').on('change', function () {
			const blockSiteStatus = Object.assign({}, customEvent);

			blockSiteStatus.detail.status = $(this).prop('checked') ? 'yes' : 'no';
			Utils.dispatchEvent('blockSiteStatus', blockSiteStatus);
		});

		htmlUtil('#blockTrackers').on('change', function () {
			const trackSiteStatus = Object.assign({}, customEvent);

			trackSiteStatus.detail.status = $(this).prop('checked') ? 'yes' : 'no';
			Utils.dispatchEvent('trackSiteStatus', trackSiteStatus);
		});
	}

	function load() {
		toggler();
		searchBarToggle();
		blockToggleHandler();
	}

	return {
		load
	};
})();

htmlUtil(document).ready(function () {
	handleFilterSearch.load();
});
