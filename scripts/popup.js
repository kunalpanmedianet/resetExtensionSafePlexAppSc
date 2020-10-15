const loadMainEvents = (function () {
	function toggleActions(toggleClickElem, allDisplayElement) {
		htmlUtil(`[${toggleClickElem}]`).on('click', function (e) {
			const allTabs = htmlUtil(`[${toggleClickElem}]`);
			const currentTab = htmlUtil(this);
			const currentTabAttribute = currentTab.attr(toggleClickElem);
			const tabsToDisplay = htmlUtil(`#${currentTabAttribute}`);
			const allDisplay = htmlUtil(`.${allDisplayElement}`);

			allTabs.removeClass('active');
			currentTab.addClass('active');

			allDisplay.addClass('hide');
			tabsToDisplay.removeClass('hide');
		});
	}

	function mainTabs() {
		toggleActions('popup-tab', 'popupMainTabDisplay');
	}

	function subTabs() {
		toggleActions('popup-subtab', 'popupSubTabDisplay');
	}

	return {
		mainTabs,
		subTabs
	};
})();

htmlUtil(document).ready(function () {
	loadMainEvents.mainTabs();
	loadMainEvents.subTabs();
});
