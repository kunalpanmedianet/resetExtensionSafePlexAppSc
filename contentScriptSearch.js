
var SEARCH_CLASSES=".ac-algo, .ov-a h4 a, .b_algo, .td-u:not(.ac-1st)";

function getQueries(){
    return new Promise(function (resolve,reject) {
        var queries=document.querySelectorAll(SEARCH_CLASSES);
        resolve(queries);
    });
}

function fetchLinks() {
    return new Promise(function (resolve,reject) {
        getQueries().then(function (queries) {
            console.log("queries");
            console.log(queries);
            var links=[];
            var cnt=0;
            for (var i=0; i<queries.length; i++){

                links.push(queries[i].href);

                cnt++;
                if(cnt==(queries.length-1)){
                    resolve(links);
                }
            }
        });
    });
}

var statusType = {
    "untested": {
        "cssClass": "question_safe",
        "name": "UnTested",
        "typeId": "safe"
    },
    "safe": {
        "cssClass": "nt_green_safe",
        "name": "Secure",
        "typeId": "safe"
    },
    "warning": {
        "cssClass": "red_safe",
        "name": "Not Secure",
        "typeId": "unsafe"
    },
    "caution": {
        "cssClass": "orange_safe",
        "name": "Caution",
        "typeId": "unsafe"
    },
    "safe_b_s": {
        "cssClass": "nt_green_safe",
        "name": "Safe",
        "typeId": "safe"
    },
    "warning_s": {
        "cssClass": "orange_safe",
        "name": "Warning",
        "typeId": "unsafe"
    },
    "danger_s_b": {
        "cssClass": "red_safe",
        "name": "not Safe",
        "typeId": "unsafe"
    }
};

function getDomain(url) {
    var domain = url.split("#")[0];
    domain=domain.split("?")[0];
    return domain;
}

function classifyStatus(sr, br) {
    if(sr == 'u') {
        return statusType.untested;
    }
    else if((sr == 'g' || sr == 'r') && br == 'u') {
        return statusType.safe;
    }
    else if(sr == 'b' && (br == 'u' || br == 'g' || br == 'r')) {
        return statusType.warning;
    }
    else if(sr == 'w' && (br == 'u' || br == 'g' || br == 'r')) {
        return statusType.caution;
    }
    else if((sr == 'g' || sr == 'r') && (br == 'g' || br == 'r')) {
        return statusType.safe_b_s;
    }
    else if((sr == 'g' || sr == 'r' || sr == 'w') && br == 'w') {
        return statusType.warning_s;
    }
    else if(((sr == 'g' || sr == 'r' || sr == 'w') && br == 'b') || (sr == 'b' && (br == 'b' || br == 'w')))
        return statusType.danger_s_b;
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
        chrome.runtime.sendMessage({type:"links" ,links: links});
    });
    chrome.runtime.onMessage.addListener(function(request, sender) {


        if(request.task == 'urlMap'){
            var urlMap = request.data;
            console.log(urlMap);
            getQueries().then(function (queries) {
                for (var i=0; i<queries.length; i++){
                    console.log(queries[i].href);
                    var status = classifyStatus(urlMap[getDomain(queries[i].href)]["@attributes"]['sr'], urlMap[getDomain(queries[i].href)]["@attributes"]['br']);
                    queries[i].appendChild(getIcon(status["cssClass"]));
                }
            });
        }

    });
}
init();