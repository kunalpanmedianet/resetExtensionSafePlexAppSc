const loadEventForBrowsingData = (function () {
	function loadCheckBoxChangeEvent() {
		htmlUtil('.browsingDataCheckBox').on('change', function () {
			const isChecked = htmlUtil(this).prop('checked');
			if (!isChecked) {
				htmlUtil('#allBrowsingData').prop('checked', false);
			}
		});

		htmlUtil('#allBrowsingData').on('change', function () {
			const isChecked = htmlUtil(this).prop('checked');

			htmlUtil('.browsingDataCheckBox').prop('checked', isChecked);
		});
	}

	function loadClearDataClickEvent() {
		const clearBrowsingData = {
			detail: {
				deletionTime: 0,
				storageType: []
			}
		};
		htmlUtil('.clearData').on('click', function () {
			clearBrowsingData.detail.storageType = []; //Clearing all the data for each click;

			htmlUtil.each(htmlUtil('.browsingDataCheckBox'), function (index, item) {
				const itemEl = $(item);
				const isChecked = itemEl.prop('checked');
				if (isChecked) {
					clearBrowsingData.detail.storageType.push(itemEl.attr('data-type'));
				}
			});

			clearBrowsingData.detail.deletionTime = htmlUtil(
				'#timeRangeClearBrowsingData'
			).val();

			Utils.dispatchEvent('clearBrowsingData', clearBrowsingData);
		});
	}

	return {
		loadCheckBoxChangeEvent,
		loadClearDataClickEvent
	};
})();

htmlUtil(document).ready(function () {
	loadEventForBrowsingData.loadCheckBoxChangeEvent();
	loadEventForBrowsingData.loadClearDataClickEvent();
});