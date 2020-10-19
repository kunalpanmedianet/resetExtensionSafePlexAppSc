function updateSafetyStatus(status) {
    document.getElementById("safetyStatus").innerHTML = status;
};


chrome.runtime.sendMessage({type: "popupHandshake"}, function () {
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {

        if (request.type == "updateSafetyStatus") {
            updateSafetyStatus(request.status);
        }
        sendResponse();
    });
});
let storageKeys = {};

storageKeys = {
    trackSitesOpted: "trackSitesOpted",
    riskySitesOpted: "riskySitesOpted",
    blockSitesOpted: "blockSitesOpted",
    trackSiteCount: "trackSiteCount",
    riskySitesCount: "riskySitesCount",
    blockedUrls: "blockedUrls",
    setTabActive: "setTabActive",
    threat: "threat",
    trackSitesData: "trackSitesData",
    riskySitesData: "riskySitesData"
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
    localStorage.setItem(storageKeys.trackSitesOpted, details['status']);
}


document.addEventListener('riskySiteStatus', function (e) {
    setRiskySiteStatus(e);
});

function setRiskySiteStatus(e) {
    let details = (e || {})["detail"] || {};
    localStorage.setItem(storageKeys.riskySitesOpted, details['status']);
}


document.addEventListener('blockSiteStatus', function (e) {
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
    chrome.runtime.sendMessage({type: 'blackListUrl', url: url},
        function (response) {
            console.log('Response: ', response);
        });
};


document.addEventListener('deleteUrl', function (e) {
    deleteUrlFromBlackList(e);
});

function deleteUrlFromBlackList(e) {
    let details = (e || {})["detail"] || {};
    let url = details['url'];
    let blackListedDomain = JSON.parse(localStorage.getItem(storageKeys.blockedUrls));
    if (!!blackListedDomain && blackListedDomain.indexOf(url) > -1) {
        blackListedDomain.splice(blackListedDomain.indexOf(url), 1);
    }
    localStorage.setItem(storageKeys.blockedUrls, JSON.stringify(blackListedDomain));
}

document.addEventListener('addThisWebsite', function (e) {
    blackListCurrentTabUrl(e);
});

function getDomainFromURL(url) {
    var element = document.createElement("a");
    element.href = url;
    return element.host;
}

function blackListCurrentTabUrl() {
    chrome.runtime.sendMessage({type: 'blackListCurrentTabDomain'},
        function (response) {
            console.log('Response: ', response);
        });
}

chrome.runtime.sendMessage({type: 'currentTabRiskyStatus'}, function (response) {
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.type === 'sendRiskStatusToPopup') {
        console.log("response for threat change red:", message.threatStatus);
        document.dispatchEvent(
            new CustomEvent('currentDomainStatus', {
                detail: {
                    threatData: message.threatStatus
                }
            })
        );
    }
});

document.addEventListener('currentDomainStatus', function (e) {
    let details = (e || {})["detail"] || {};
    let status = details['threatData'];
    console.log("domain status :***********",status);
});

document.addEventListener('getStatisticsData', function (e) {
    getStatisticsData(e);
});


function getStatisticsData(e) {
    let details = (e || {})["detail"] || {};
    let type = details['type'];
    let duration = parseInt(details['duration']);
    let statisticsData = {};
    switch (type) {
        case "all":
            statisticsData["track"] = getStatisticsDataForDuration(duration, storageKeys.trackSitesData);
            statisticsData["risky"] = getStatisticsDataForDuration(duration, storageKeys.riskySitesData);
            break;
        case "risky":
            statisticsData["risky"] = getStatisticsDataForDuration(duration, storageKeys.riskySitesData);
            break;
        case "track":
            statisticsData["track"] = getStatisticsDataForDuration(duration, storageKeys.trackSitesData);
            break;
        default:
            break;
    }
    document.dispatchEvent(
        new CustomEvent('statisticsData', {
            detail: {
                statisticsData: statisticsData
            }
        })
    );
}

function getStatisticsDataForDuration(duration, storageKeyValue) {
    var statsData = [0,0,0,0,0,0,0];
    if (localStorage.getItem(storageKeyValue) !== null) {
        var totalStatsDuration = duration * 24 * 60 * 60 * 1000;
        var currentTimeInMilliSec = (new Date()).getTime();
        var siteData = JSON.parse(localStorage.getItem(storageKeyValue));
        for (var i = 0; i < siteData.length; i++) {
            var timeStampValue = new Date(siteData[i]["timestamp"]);
            var timeInMilliSec = timeStampValue.getTime();
            if (timeInMilliSec >= (currentTimeInMilliSec - totalStatsDuration)) {
                const day = timeStampValue.getDay();
                statsData[day]++;
            } else
                break;
        }
        return statsData;
    } else {
        return statsData;
    }

}






