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
			const blockRiskySitesToggleStatus = Object.assign({}, customEvent);

			blockRiskySitesToggleStatus.detail.status = htmlUtil(this).prop('checked')
				? 'yes'
				: 'no';
			Utils.dispatchEvent(
				'blockRiskySitesToggleStatus',
				blockRiskySitesToggleStatus
			);
		});
		/* Block Risky Sites Opted */

		/* Block Tracker  */
		htmlUtil('#blockTrackers').on('change', function () {
			const blockTrackerToggleStatus = Object.assign({}, customEvent);

			blockTrackerToggleStatus.detail.status = htmlUtil(this).prop('checked')
				? 'yes'
				: 'no';
			Utils.dispatchEvent('blockTrackerToggleStatus', blockTrackerToggleStatus);
		});
		/* Block Tracker  */

		/* Block Websites */
		htmlUtil('#blockWebsites').on('change', function () {
			const blockedWebSitesToggleStatus = Object.assign({}, customEvent);

			blockedWebSitesToggleStatus.detail.status = htmlUtil(this).prop('checked')
				? 'yes'
				: 'no';
			Utils.dispatchEvent(
				'blockedWebSitesToggleStatus',
				blockedWebSitesToggleStatus
			);
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

			if (!!url) {
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

		htmlUtil(window).on('storage', function () {
			setViewList();
		});
		/* Input Add url */

		htmlUtil(document).on('click', '.removeBlockedWebsite', function () {
			const item = htmlUtil(this).data('item');
			deleteUrl(item);
		});

		htmlUtil(window).on('storage', listenOnLoad);
	}

	function deleteUrl(url) {
		Utils.dispatchEvent('deleteUrl', { detail: { url } });
		setViewList();
	}

	function setViewList() {
		const list = Utils.getStorageItem(STORAGE_KEYS.blockedUrls) || [];
		htmlUtil('#blockedWebsites').empty().parent().hide();
		if (list.length) {
			list.forEach(function (item) {
				const li = `<li> 
					<span class="shrink0"><img></span>
					<span class="flex1">${item}</span>
					<span data-item="${item}" class="removeBlockedWebsite shrink0">Remove</span>
				</li>`;
				htmlUtil('#blockedWebsites').append(li);
			});
			htmlUtil('#blockedWebsites').parent().show();
			htmlUtil('.blockedWebsitesListMessage').hide();
		} else {
			htmlUtil('.blockedWebsitesListMessage').show();
		}
	}

	function listenOnLoad() {
		const blockRiskySiteStorageStatus =
			Utils.getStorageItem('blockRiskySiteStorageStatus') == 'yes'
				? true
				: false;

		const blockTrackerStorageStatus =
			Utils.getStorageItem('blockTrackerStorageStatus') == 'yes' ? true : false;

		const blockWebSitesStorageStatus =
			Utils.getStorageItem('blockWebSitesStorageStatus') == 'yes'
				? true
				: false;

		htmlUtil('#blockRiskSites').prop('checked', blockRiskySiteStorageStatus);
		htmlUtil('#blockTrackers').prop('checked', blockTrackerStorageStatus);
		htmlUtil('#blockWebsites').prop('checked', blockWebSitesStorageStatus);
	}

	function load() {
		toggler();
		searchBarToggle();
		handleCustomEvents();
		setViewList();
		listenOnLoad();
	}

	return {
		load
	};
})();

htmlUtil(document).ready(function () {
	handleFilterSearch.load();
});
