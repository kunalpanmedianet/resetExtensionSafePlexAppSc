const loadEventForThreats = (function () {
	function onChangeHandle() {
		const enable = 'enable';
		const disable = 'disable';
		htmlUtil('#threatDetectionToggle').on('change', function () {
			const isChecked = $(this).prop('checked');
			if (isChecked) {
				htmlUtil('[p-threat]').addClass('hide');
				htmlUtil('[p-threat="' + enable + '"]').removeClass('hide');
			} else {
				htmlUtil('[p-threat]').addClass('hide');
				htmlUtil('[p-threat="' + disable + '"]').removeClass('hide');
			}

			// Utils.dispatchEvent("");
		});
	}

	function handleEvents() {
		htmlUtil(document).on('currentTabRiskyStatus', function (e) {
			console.log(e.detail.threatData);
		});
	}

	function load() {
		onChangeHandle();
		handleEvents();
	}

	return {
		load
	};
})();

htmlUtil(document).ready(function () {
	loadEventForThreats.load();
});
