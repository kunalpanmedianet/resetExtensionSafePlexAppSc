document.addEventListener('DOMContentLoaded', function () {
	getBlockedWebsiteName();


	var siteUnblockBtn = document.getElementById('siteUnblockBtn');
	var editSiteListBtn = document.getElementById('editSiteListBtn');

	if (!!siteUnblockBtn) {
		siteUnblockBtn.addEventListener('click', function () {
			console.log("unblock button is clicked ");
			document.dispatchEvent(new CustomEvent('unBlockSite'));
			window.location.href
			document.dispatchEvent(
				new CustomEvent('unBlockSite', {
					detail: {
						blockedUrl: getBlockedUrl()
					}
				})
			);
		});
	}

	if (!!editSiteListBtn) {
		editSiteListBtn.addEventListener('click', function () {
			document.dispatchEvent(new CustomEvent('editBlockedSiteList'));
		});
	}
});

function getBlockedUrl(){
	var url = new URL(window.location.href);
	return url.searchParams.get('blockedurl');
}

function getBlockedWebsiteName() {
	var blockedUrl = getBlockedUrl();
	var urlDomain=getDomain(blockedUrl);
	var blockedSiteNameElement = document.getElementById('blockedSiteName');
	if (blockedSiteNameElement) {
		if (blockedUrl) blockedSiteNameElement.textContent = urlDomain;
		else blockedSiteNameElement.textContent = 'This website';
	}
}

function getDomain(url) {
	var domain = url.split("#")[0];
	domain = domain.split("?")[0];
	return domain;
}
