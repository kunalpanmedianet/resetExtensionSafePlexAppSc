const handleFilterSearch = (function () {
	const toggleOption = 'filter-toggle-option';

	function isTogglerChecked(elem) {
		const ID = elem.attr(toggleOption);
		const isChecked = elem.prop('checked');

		if (isChecked) {
			htmlUtil('#' + ID).slideDown();
		} else {
			htmlUtil('#' + ID).slideUp();
		}
	}
	function toggler() {
		htmlUtil('[' + toggleOption + ']').on('change', function () {
			isTogglerChecked(htmlUtil(this));
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
			const blockRiskySitesRendering = Object.assign({}, customEvent);

			blockRiskySitesRendering.detail.status = htmlUtil(this).prop('checked')
				? 'yes'
				: 'no';
			Utils.dispatchEvent('blockRiskySitesRendering', blockRiskySitesRendering);
		});
		/* Block Risky Sites Opted */

		/* Block Tracker  */
		htmlUtil('#blockTrackers').on('change', function () {
			const trackSiteStatus = Object.assign({}, customEvent);

			trackSiteStatus.detail.status = htmlUtil(this).prop('checked')
				? 'yes'
				: 'no';
			Utils.dispatchEvent('trackSiteStatus', trackSiteStatus);
		});
		/* Block Tracker  */

		/* Block Websites */
		htmlUtil('#blockWebsites').on('change', function () {
			const blockSiteStatus = Object.assign({}, customEvent);

			blockSiteStatus.detail.status = htmlUtil(this).prop('checked')
				? 'yes'
				: 'no';
			Utils.dispatchEvent('blockSiteStatus', blockSiteStatus);
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
				htmlUtil('#filterSearchInput').val("");
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
			Utils.getStorageItem(STORAGE_KEYS.BLOCK_RISKY_SITE) == 'yes'
				? true
				: false;

		const blockTrackerStorageStatus =
			Utils.getStorageItem(STORAGE_KEYS.BLOCK_TRACKERS) == 'yes' ? true : false;

		const blockWebSitesStorageStatus =
			Utils.getStorageItem(STORAGE_KEYS.BLOCKED_WEBSITES) == 'yes'
				? true
				: false;

		htmlUtil('#blockRiskSites').prop('checked', blockRiskySiteStorageStatus);
		htmlUtil('#blockTrackers').prop('checked', blockTrackerStorageStatus);
		htmlUtil('#blockWebsites').prop('checked', blockWebSitesStorageStatus);
		isTogglerChecked(htmlUtil('#blockWebsites'));
	}

	function load() {
		listenOnLoad();
		searchBarToggle();
		handleCustomEvents();
		setViewList();
		toggler();
	}

	return {
		load
	};
})();

htmlUtil(document).ready(function () {
	handleFilterSearch.load();
});
