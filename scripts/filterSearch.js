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

			riskySiteStatus.detail.status = htmlUtil(this).prop('checked')
				? 'yes'
				: 'no';
			Utils.dispatchEvent('blockRiskySitesRendering', riskySitesOpted);
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

			// try {
			// 	url = new URL(url);
			// } catch (e) {
			// 	url = null;
			// }

			// new URL(url).origin
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

	function load() {
		toggler();
		searchBarToggle();
		handleCustomEvents();
		setViewList();
	}

	return {
		load
	};
})();

htmlUtil(document).ready(function () {
	handleFilterSearch.load();
});
