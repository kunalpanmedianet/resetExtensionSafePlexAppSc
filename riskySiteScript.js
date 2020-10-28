var url = new URL(window.location.href);
var riskyurl = url.searchParams.get('riskyUrl') || 'Nothing';
// document.body.innerHTML = riskyurl + ' has been blocked';

document.addEventListener('DOMContentLoaded', function () {
    var proceedButton = document.getElementById('rsProceedAnyway');

    if (!!proceedButton) {
        proceedButton.addEventListener('click', function () {
            console.log("button is clicked");
            var blockedUrl="https://"+getBlockedUrl();
            console.log("blocked url in risky site:",blockedUrl);
            chrome.runtime.sendMessage({type: "unBlockRiskySite", blockedUrl: blockedUrl}, function () {
            });
        });
    }
});


function getBlockedRiskyWebsiteName() {
    var blockedUrl = getBlockedUrl();
    // var urlDomain=getDomain(blockedUrl);
    var riskySiteNameElement = document.getElementById('riskySiteName');
    if (riskySiteNameElement) {
        if (blockedUrl) riskySiteNameElement.textContent = blockedUrl;
        else riskySiteNameElement.textContent = 'This website';
    }
}

function getBlockedUrl(){
    var url = new URL(window.location.href);
    return url.searchParams.get('riskyUrl');
}

function getDomain(url) {
    var domain = url.split("#")[0];
    domain = domain.split("?")[0];
    return domain;
}