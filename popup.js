
function updateSafetyStatus(status){
    document.getElementById("safetyStatus").innerHTML=status;
};


chrome.runtime.sendMessage( {type : "popupHandshake"},function () {
    chrome.runtime.onMessage.addListener(function (request, sender,sendResponse) {

        if(request.type == "updateSafetyStatus"){
            updateSafetyStatus(request.status);
        }
        sendResponse();
    });
});
let storageKeys = {};

storageKeys = {
    trackSiteOpted: "trackSiteOpted",
    riskySitesOpted: "riskySitesOpted",
    blockSitesOpted: "blockSitesOpted",
    trackSiteCount: "trackSiteCount",
    riskySitesCount: "riskySitesCount",
    blockedUrls: "blockedUrls",
    setTabActive: "setTabActive",
    threat:"threat",
    trackSitesData:"trackSitesData",
    riskySitesData:"riskySitesData"
};

document.addEventListener('clearBrowsingData', function (e) {
    clearBrowsingData(e);
});

function clearBrowsingData(e) {
    let details = (e || {})["detail"] || {};
    var deletionTime = parseInt(details["deletionTime"]);
    var storageType = details["storageType"];
    var storageDeleteDuration = new Date().getTime() - deletionTime * 60 * 60 * 1000;
    if (deletionTime === 0) storageDeleteDuration = 0;
    var browsingStorageObject = {};
    storageType.forEach(storage => {
        browsingStorageObject[storage] = true;
        if (storage === 'cache') {
            browsingStorageObject['appcache'] = true;
            browsingStorageObject['cacheStorage'] = true;
        }
    });
    var callback = function () {
    };
    chrome.browsingData.remove(
        {
            since: storageDeleteDuration
        },
        browsingStorageObject,
        callback
    );

}



document.addEventListener('trackSiteStatus', function (e) {
    setTrackSiteStatus(e);
});

function setTrackSiteStatus(e) {
    let details = (e || {})["detail"] || {};
    localStorage.setItem(storageKeys.trackSiteOpted, details['status']);
}



document.addEventListener('riskySiteStatus', function (e) {
    setRiskySiteStatus(e);
});

function setRiskySiteStatus(e) {
    let details = (e || {})["detail"] || {};
    localStorage.setItem(storageKeys.riskySitesOpted, details['status']);
}




document.addEventListener('blockSites', function (e) {
    setBlockSiteStatus(e);
});

function setBlockSiteStatus(e) {
    let details = (e || {})["detail"] || {};
    localStorage.setItem(storageKeys.blockSitesOpted, details['status']);
}


document.addEventListener('blockUrl', function (e) {
    blockUrl(e);
});

function blockUrl(e) {
    let details = (e || {})["detail"] || {};
    let url = details['url'];
    let blockedUrls = JSON.parse(localStorage.getItem(storageKeys.blockedUrls));
    if (blockedUrls == null)
        blockedUrls = [];
    if (!!url && !(blockedUrls.indexOf(url) > -1)) {
        blockedUrls.push(url);
        localStorage.setItem(storageKeys.blockedUrls, JSON.stringify(blockedUrls));
    }
};


document.addEventListener('deleteUrl', function (e) {
    deleteUrlFromBlackList(e);
});

function deleteUrlFromBlackList(url) {
    let blackListedDomain = JSON.parse(localStorage.getItem(storageKeys.blockedUrls));
    if (!!blackListedDomain && blackListedDomain.indexOf(url) > -1) {
        blackListedDomain.splice(blackListedDomain.indexOf(url), 1);
    }
    localStorage.setItem(storageKeys.blockedUrls, JSON.stringify(blackListedDomain));
}

document.addEventListener('blackListCurrentUrl', function (e) {
    blackListCurrentTabUrl(e);
});

function getDomainFromURL(url) {
    var element = document.createElement("a");
    element.href = url;
    return element.host;
}

function blackListCurrentTabUrl() {
    chrome.tabs.getCurrent(function (tab) {
        document.dispatchEvent(
            new CustomEvent('blockUrl', {
                detail: {
                    url: getDomainFromURL(tab.url)
                }
            })
        );
    });

}

