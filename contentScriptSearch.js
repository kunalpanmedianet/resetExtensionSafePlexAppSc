
var SEARCH_CLASSES = ".ac-algo, .ov-a h4 a, .b_algo, .td-u:not(.ac-1st)";

function getQueries() {
    return new Promise(function (resolve, reject) {
        var queries = document.querySelectorAll(SEARCH_CLASSES);
        resolve(queries);
    });
}

function fetchLinks() {
    return new Promise(function (resolve, reject) {
        getQueries().then(function (queries) {
            console.log("queries");
            console.log(queries);
            var links = [];
            var cnt = 0;
            for (var i = 0; i < queries.length; i++) {

                links.push(queries[i].href);

                cnt++;
                if (cnt == (queries.length - 1)) {
                    resolve(links);
                }
            }
        });
    });
}

function getDomain(url) {
    var domain = url.split("#")[0];
    domain = domain.split("?")[0];
    return domain;
}

function getIcon(cssClass) {
    var statusElem = document.createElement("A");
    statusElem.setAttribute('target', '_blank');
    statusElem.classList.add("statusLogo");
    statusElem.classList.add(cssClass);
    return statusElem;
}


function init() {

    fetchLinks().then(function (links) {
        console.log("LLL");
        console.log(links);
        chrome.runtime.sendMessage({type: "links", links: links});
    });
    chrome.runtime.onMessage.addListener(function (request, sender) {
        if (request.msg == 'addLinkStatusIcon') {
            var urlMap = request.linkSafetyMap;
            console.log(urlMap);
            getQueries().then(function (queries) {
                for (var i = 0; i < queries.length; i++) {
                    console.log(queries[i].href);
                    var status = urlMap[queries[i]];
                    queries[i].appendChild(getIcon(status["cssClass"]));
                }
            });
        }

    });
}

init();