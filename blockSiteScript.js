let storageKeys = {};

storageKeys = {
    trackSitesOpted: "trackSitesOpted",
    riskySitesOpted: "riskySitesOpted",
    blockSitesOpted: "blockSitesOpted",
    blockRiskySitesRendering:"blockRiskySitesRendering",
    trackSiteCount: "trackSiteCount",
    riskySitesCount: "riskySitesCount",
    blockedUrls: "blockedUrls",
    setTabActive: "setTabActive",
    threat: "threat",
    trackSitesData: "trackSitesData",
    riskySitesData: "riskySitesData"
};
document.addEventListener('DOMContentLoaded', function () {
    getBlockedWebsiteName();


    var siteUnblockBtn = document.getElementById('siteUnblockBtn');
    var editSiteListBtn = document.getElementById('editSiteListBtn');

    if (!!siteUnblockBtn) {
        siteUnblockBtn.addEventListener('click', function () {
            console.log("unblock button is clicked ");
            var blockedUrl = getBlockedUrl()
            deleteUrlFromBlackList(getDomainName(blockedUrl));
            window.location.href = blockedUrl;
        });
    }

    if (!!editSiteListBtn) {
        editSiteListBtn.addEventListener('click', function () {
            document.dispatchEvent(new CustomEvent('editBlockedSiteList'));
        });
    }
});

function getBlockedUrl() {
    var url = new URL(window.location.href);
    return url.searchParams.get('blockedurl');
}

function getBlockedWebsiteName() {
    var blockedUrl = getBlockedUrl();
    var urlDomain = getDomainName(blockedUrl);
    var blockedSiteNameElement = document.getElementById('blockedSiteName');
    if (blockedSiteNameElement) {
        if (blockedUrl) blockedSiteNameElement.textContent = urlDomain;
        else blockedSiteNameElement.textContent = 'This website';
    }
}

function getDomainName(url) {
    var element = document.createElement("a");
    element.href = url;
    return element.host;
}


function deleteUrlFromBlackList(url) {
    let blackListedDomain = JSON.parse(localStorage.getItem(storageKeys.blockedUrls));
    if (!!blackListedDomain && blackListedDomain.indexOf(url) > -1) {
        blackListedDomain.splice(blackListedDomain.indexOf(url), 1);
    }
    localStorage.setItem(storageKeys.blockedUrls, JSON.stringify(blackListedDomain));
}
