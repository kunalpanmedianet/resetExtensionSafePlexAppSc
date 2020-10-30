var url = new URL(window.location.href);
var riskyurl = url.searchParams.get('riskyUrl') || 'Nothing';

document.addEventListener('DOMContentLoaded', function () {
    var proceedButton = document.querySelector('.rsProceedAnyway');

    if (!!proceedButton) {
        proceedButton.addEventListener('click', function () {
            var blockedUrl =getBlockedUrl();
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

