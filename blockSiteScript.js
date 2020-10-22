document.addEventListener('DOMContentLoaded', function () {
	getBlockedWebsiteName();

	var siteUnblockBtn = document.getElementById('siteUnblockBtn');
	var editSiteListBtn = document.getElementById('editSiteListBtn');

	if (!!siteUnblockBtn) {
		siteUnblockBtn.addEventListener('click', function () {
			document.dispatchEvent(new CustomEvent('unBlockSite'));
		});
	}

	if (!!editSiteListBtn) {
		editSiteListBtn.addEventListener('click', function () {
			document.dispatchEvent(new CustomEvent('editBlockedSiteList'));
		});
	}
});

function getBlockedWebsiteName() {
	var url = new URL(window.location.href);
	var blockedUrl = url.searchParams.get('blockedurl');
	var blockedSiteNameElement = document.getElementById('blockedSiteName');
	if (blockedSiteNameElement) {
		if (blockedUrl) blockedSiteNameElement.textContent = blockedUrl;
		else blockedSiteNameElement.textContent = 'This website';
	}
}
