const loadEventForThreats = (function () {
	function isThreatEnabled(threat) {
		const isEnabled = threat ? 'enabled' : 'disabled';
		htmlUtil('[p-threat="' + isEnabled + '"]')
			.removeClass('hide')
			.siblings('[p-threat]')
			.addClass('hide');
		htmlUtil('.threatActions').text(isEnabled);
	}

	function onChangeHandle() {
		htmlUtil('#threatDetectionToggle').on('change', function () {
			const isChecked = htmlUtil(this).prop('checked');

			Utils.dispatchEvent('riskySiteStatus', {
				detail: {
					status: isChecked ? 'yes' : 'no'
				}
			});

			isThreatEnabled(isChecked);
		});
	}

	function handleEvents() {
		htmlUtil(document).on('currentDomainStatus', function (e) {
			var threatData = e.detail.threatData;
			htmlUtil('[threat-name] .numberOfThreats').text(0);
			if (
				threatData &&
				threatData.hasOwnProperty('count') &&
				threatData.count > 0
			) {
				var count = threatData.count;
				htmlUtil('[n-notifwrap]').addClass('error');
				switch (threatData.threatType) {
					// soft eng
					case 'SOCIAL_ENGINEERING':
					case 'UNWANTED_SOFTWARE':
					case 'POTENTIALLY_HARMFUL_APPLICATION':
						htmlUtil('[threat-name="se"]').addClass('threatActive');
						htmlUtil('[threat-name="se"] .numberOfThreats').text(count);
						break;

					// malware
					case 'MALWARE':
						htmlUtil('[threat-name="malware"]').addClass('threatActive');
						htmlUtil('[threat-name="malware"] .numberOfThreats').text(count);
						break;

					// adware
					case 'ADWARE':
						htmlUtil('[threat-name="adware"]').addClass('threatActive');
						htmlUtil('[threat-name="adware"] .numberOfThreats').text(count);
						break;

					// others
					case 'THREAT_TYPE_UNSPECIFIED':
						htmlUtil('[threat-name="v"]').addClass('threatActive');
						htmlUtil('[threat-name="others"] .numberOfThreats').text(count);
						break;

					case 'None':
						htmlUtil('[threat-name]').removeClass('threatActive');
						htmlUtil('[threat-name] .numberOfThreats').text(0);
						break;
					default:
						break;
				}
			} else {
				htmlUtil('[threat-name="malware"]').removeClass('threatActive');
				htmlUtil('[n-notifwrap]').removeClass('error');
				htmlUtil('[threat-name] .numberOfThreats').text(0);
			}
		});

		htmlUtil(window).on('storage', listenOnLoad);
	}

	function listenOnLoad() {
		const isThreat =
			Utils.getStorageItem(STORAGE_KEYS.riskySitesOpted) == 'yes'
				? true
				: false;
		htmlUtil('#threatDetectionToggle').prop('checked', isThreat);
		isThreatEnabled(isThreat);
	}

	function load() {
		onChangeHandle();
		handleEvents();
		listenOnLoad();
	}

	return {
		load
	};
})();

htmlUtil(document).ready(function () {
	loadEventForThreats.load();
});
