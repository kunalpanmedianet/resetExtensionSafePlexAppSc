var url = new URL(window.location.href);
var riskyurl = url.searchParams.get('riskyUrl') || 'Nothing';
// document.body.innerHTML = riskyurl + ' has been blocked';

document.addEventListener('DOMContentLoaded', function () {
    getBlockedWebsiteName();


    var proceedButton = document.getElementById('');

    if (!!proceedButton) {
        proceedButton.addEventListener('click', function () {
            document.dispatchEvent(new CustomEvent('unBlockSite'));
            document.dispatchEvent(
                new CustomEvent('unBlockSite', {
                    detail: {
                        blockedUrl: getBlockedRiskyWebsiteName()
                    }
                })
            );
        });
    }
});


function getBlockedRiskyWebsiteName() {
    var blockedUrl = getBlockedUrl();
    var urlDomain=getDomain(blockedUrl);
    var riskySiteNameElement = document.getElementById('riskySiteName');
    if (riskySiteNameElement) {
        if (blockedUrl) riskySiteNameElement.textContent = urlDomain;
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