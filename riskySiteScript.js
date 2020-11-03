document.addEventListener('DOMContentLoaded', function () {
	var proceedButton = document.querySelector('.rsProceedAnyway');
	var domainPlaceholder = document.querySelector('#rsDomain');

	if (!!getBlockedUrl())
		domainPlaceholder.textContent = new URL(getBlockedUrl()).hostname;
	else domainPlaceholder.textContent = 'This website';

	if (!!proceedButton) {
		proceedButton.addEventListener('click', function () {
			var blockedUrl = getBlockedUrl();
			chrome.runtime.sendMessage(
				{ type: 'unBlockRiskySite', blockedUrl: blockedUrl },
				function () {}
			);
		});
	}
});

function getBlockedUrl() {
	var url = new URL(window.location.href);
	return url.searchParams.get('riskyUrl');
}
