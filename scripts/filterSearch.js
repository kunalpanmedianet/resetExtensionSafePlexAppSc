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

		htmlUtil('#blockRiskSites').on('change', function () {
			const riskySitesOpted = Object.assign({}, customEvent);

			riskySitesOpted.detail.status = $(this).prop('checked') ? 'yes' : 'no';
			Utils.dispatchEvent('riskySitesOpted', riskySitesOpted);
		});

		htmlUtil('#blockTrackers').on('change', function () {
			const trackSitesOpted = Object.assign({}, customEvent);

			trackSitesOpted.detail.status = $(this).prop('checked') ? 'yes' : 'no';
			Utils.dispatchEvent('trackSitesOpted', trackSitesOpted);
		});

		htmlUtil('#blockWebsites').on('change', function () {
			Utils.dispatchEvent('blackListCurrentUrl');
		});

		htmlUtil('.addThisWebsite').on('click', function () {
			Utils.dispatchEvent('addThisWebsite');
		});

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
