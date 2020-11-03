const loadEventForBrowsingData = (function () {
	function isCheckedFn() {
		const flags = [];
		htmlUtil.each(htmlUtil('.browsingDataCheckBox'), function (index, item) {
			const itemEl = $(item);
			const isChecked = itemEl.prop('checked');
			if (isChecked) {
				flags.push(1);
			}
		});

		if (flags.length > 0) {
			htmlUtil('.clearData').removeClass('disabled');
		} else {
			htmlUtil('.clearData').addClass('disabled');
		}
	}

	function loadCheckBoxChangeEvent() {
		htmlUtil('.browsingDataCheckBox').on('change', function () {
			const isChecked = htmlUtil(this).prop('checked');
			if (!isChecked) {
				htmlUtil('#allBrowsingData').prop('checked', false);
			}
			isCheckedFn();
		});

		htmlUtil('#allBrowsingData').on('change', function () {
			const isChecked = htmlUtil(this).prop('checked');
			htmlUtil('.browsingDataCheckBox').prop('checked', isChecked);
			isCheckedFn();
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

			htmlUtil('.clearingDataText').hide();
			htmlUtil('.clearingInProgress').fadeIn();

			clearBrowsingData.detail.deletionTime = htmlUtil(
				'#timeRangeClearBrowsingData'
			).val();

			Utils.dispatchEvent('clearBrowsingData', clearBrowsingData);
		});

		htmlUtil(document).on('browsingDataDeleted', function (e) {
			if (e.detail.status == 'OK') {
				htmlUtil('.clearingDataText').show('slow', function () {
					htmlUtil(this).text('Done');
					setTimeout(function () {
						htmlUtil(this).text('Clear Data');
					}, 1000);
				});
				htmlUtil('.clearingInProgress').fadeOut();
			}
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
