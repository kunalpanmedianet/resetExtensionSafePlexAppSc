document.addEventListener('unBlockSite', function (e) {
    unblockUrl(e);
});

function unblockUrl(e) {
    let details = (e || {})["detail"] || {};
    let url = details['url']
    console.log("got url in cs ****",url);
    chrome.runtime.sendMessage({type: "deleteBlockUrlAndRenderSite",url:url}, function (response) {
        console.log(response);
    });
}