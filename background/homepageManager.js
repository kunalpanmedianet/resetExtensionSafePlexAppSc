
function ParamCreater() {
    var engineDefaultValue = "https://search.yahoo.com/search?p=";
    var searchResetConsts = {};
    searchResetConsts.spectatorRepresentative = {
        edge: "edge",
        edgeChromium: "edg",
        chrome: "chrome"
    };
    searchResetConsts.spectatorName = {
        edge: "edge",
        edgeChromium: "EdgeChromium",
        chrome: "Chrome",
        other: "other"
    };

    var searchEngineParamProperties = {
        spectatorIdentity: "browserName",
        spectatorGenre: "browserVersion",
        appIdentity: "extName",
        appGenre: "extVersion",
        chromeMarketKey: "chromeStoreId",
        domain: "domain",
        provider: "clickSrc",
        hfew: "hfew",
        customerRepresentative : "UA",
        selTheme:"selTheme",
        orSrc: "orSrc",
        campaignParam2: "t2",
    };

    function fetchUserRepresentative() {
        var customerRepresentative = navigator.userAgent;
        if(!!customerRepresentative){
            customerRepresentative = customerRepresentative.toLowerCase();
        }
        return customerRepresentative;
    }

    function fetchIndexValue(userRepresentative, spectator) {
        return userRepresentative.indexOf(spectator);
    }

    function fetchSpectator(){
        var customerRepresentative = fetchUserRepresentative();

        var indexValueEdge = fetchIndexValue(customerRepresentative,searchResetConsts.spectatorRepresentative.edge);

        var indexValueEdgeChromium = fetchIndexValue(customerRepresentative,searchResetConsts.spectatorRepresentative.edgeChromium);

        var indexValueChrome = fetchIndexValue(customerRepresentative,searchResetConsts.spectatorRepresentative.chrome);

        if(indexValueEdge > -1){
            return searchResetConsts.spectatorName.edge;
        }
        else if(indexValueEdgeChromium > -1){
            return searchResetConsts.spectatorName.edgeChromium;
        }
        else if(indexValueChrome > -1 && !!window.chrome){
            return searchResetConsts.spectatorName.chrome;
        }

        return searchResetConsts.spectatorName.other;

    }

    function getSimilarExpressions(customerRepresentative) {
        return customerRepresentative.match(
            /(chrome|safari|opera|firefox|msie|trident(?=\/))\/?\s*(\.?\d+(\.\d+)*)/i
        );
    }

    function isSpectatorIE(similarStatements) {
        var pattern= /trident/i;
        if (!!similarStatements[1])
            if (pattern.test(similarStatements[0])) {
                return true;
            }
        return false;
    }

    function fetchIEGenre(customerRepresentative) {
        var arraytem = /\brv[ :]+(\d+)/g.exec(customerRepresentative) || [];
        return {name: 'IE', version: arraytem[1] || ''};
    }
    function fetchOperaGenre(arraytem) {
        return {
            name: arraytem[1].replace('OPR', 'Opera'),
            version: arraytem[2]
        };
    }

    function isSpectatorChrome(similarStatements) {
        if (similarStatements[1] === 'Chrome') {
            return true;
        }
        return false;
    }


    function fetchGenericSpectatorGenre() {
        var navAppName = navigator.appName;
        var navAppGenre = navigator.appVersion;
        var genreNotFoundDefault = '0.0.0';
        try {
            var customerRepresentative = navigator.userAgent;
            var similarStatements = getSimilarExpressions(customerRepresentative);
            var arraytem;
            if(isSpectatorIE(similarStatements)){
                return fetchIEGenre(customerRepresentative);
            }

            if(isSpectatorChrome(similarStatements)){
                arraytem = customerRepresentative.match(/\b(OPR|Edge)\/(\d+)/);
                if (arraytem != null)
                    return fetchOperaGenre(arraytem);
            }

            similarStatements = similarStatements[2] ? [similarStatements[1], similarStatements[2]] : [navAppName, navAppGenre, '-?'];

            if ((arraytem = customerRepresentative.match(/version\/(\d+)/i)) != null)
                similarStatements.splice(1, 1, arraytem[1]);

            var genre = similarStatements[1];

            return genre;

        } catch (err) {
            console.log('error', err);
        }
        return genreNotFoundDefault;
    }

    function isSpectatorMicrosoftEdge(customerRepresentative) {
        if(fetchIndexValue(customerRepresentative,searchResetConsts.spectatorRepresentative.chrome) !== -1) {
            if(fetchIndexValue(customerRepresentative,searchResetConsts.spectatorRepresentative.edgeChromium) !== -1){
                return true;
            }
            return false;
        }
        return false;
    }

    function fetchSpectatorGenre() {
        var genre = fetchGenericSpectatorGenre();
        var customerRepresentative = fetchUserRepresentative();
        var isSpectatorME = isSpectatorMicrosoftEdge(customerRepresentative);
        var arrayOfMatches = customerRepresentative.match(/edg\/([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)/);
        if (isSpectatorME && arrayOfMatches)
            genre = arrayOfMatches[1];
        return genre;
    }

    function fetchManifest() {
        return chrome.runtime.getManifest();
    }

    function fetchAppTitle() {
        try {
            return fetchManifest().name;
        }catch (err){

        }
        return DEFAULT_DATA.extensionName;
    }

    function fetchAppGenre() {
        try {
            return fetchManifest().version;
        } catch (err) {
        }
        return "0.0";
    }

    function fetchChromeStoreId() {
        return DEFAULT_DATA[defaultConstants.store_id];
    }

    function fetchAppDomain() {
        return DEFAULT_DATA[defaultConstants.domain];
    }

    function fetchRequiredProgSrcParams(useOriginValue) {
        var progSrc = {};
        try {
            progSrc[SOURCE_PARAMS.e_time] = DEFAULT_DATA[defaultConstants.prog_src][SOURCE_PARAMS.e_time];
            progSrc[SOURCE_PARAMS.e_time] = DEFAULT_DATA[defaultConstants.prog_src][SOURCE_PARAMS.e_time];
        }
        catch(e) {
            Logger().error(e);
        }
        if(useOriginValue){
            progSrc[SOURCE_PARAMS.e_time] = "2020-10-30T11:10:03.1003Z";
        }
        return fdim;
    }

    function setKeyValue(json,key,value) {
        json[key] =  value;
        return json;
    }

    function fetchEncodedSecondValue(useOriginValue) {
        var paramProperties = {};
        try {

            paramProperties = setKeyValue(paramProperties,searchEngineParamProperties.spectatorIdentity,fetchSpectator());
            paramProperties = setKeyValue(paramProperties,searchEngineParamProperties.spectatorGenre,fetchSpectatorGenre());
            paramProperties = setKeyValue(paramProperties,searchEngineParamProperties.appIdentity,fetchAppTitle());
            paramProperties = setKeyValue(paramProperties,searchEngineParamProperties.appGenre,fetchAppGenre());
            paramProperties = setKeyValue(paramProperties,searchEngineParamProperties.chromeMarketKey,fetchChromeStoreId());
            paramProperties = setKeyValue(paramProperties,searchEngineParamProperties.domain,fetchAppDomain());
            paramProperties = setKeyValue(paramProperties,searchEngineParamProperties.provider,DEFAULT_DATA[defaultConstants.provider]);
            paramProperties = setKeyValue(paramProperties,searchEngineParamProperties.orSrc,"omnibox");

            if (fetchUserRepresentative())
                paramProperties = setKeyValue(paramProperties,searchEngineParamProperties.customerRepresentative,fetchUserRepresentative());
            if (useOriginValue)
                paramProperties = setKeyValue(paramProperties,searchEngineParamProperties.campaignParam2,"creationOrganic");

            var sourceDimensions = fetchRequiredProgSrcParams(useOriginValue);
            Object.assign(paramProperties, sourceDimensions)
        }
        catch (e) {
            captureFrame("Param2Failure","1");
        }
        var encodedParamValue = btoa(JSON.stringify(paramProperties)).replace(/=/g, '');
        return encodedParamValue;

    }

    function fetchSearchEngineAddress(searchKeywords){

        if(SEARCHVALUE == null || SEARCHVALUE =="") {
            if (localStorage.hasOwnProperty(LOCAL_STORAGE_KEYS.SEARCH_VALUE))
                SEARCHVALUE = localStorage.getItem(LOCAL_STORAGE_KEYS.SEARCH_VALUE);
        }
        var engineUrl = SEARCHVALUE;
        var useOriginValue = false;
        if(engineUrl == null || engineUrl ==""){
            useOriginValue = true;
            dataOriginWithSource();
            engineUrl = engineDefaultValue;
        }
        engineUrl = engineUrl + searchKeywords;
        var encodedSecondValue = fetchEncodedSecondValue(useOriginValue);
        var webAddressAttributes = {};
        webAddressAttributes["param2"] = encodedSecondValue;
        webAddressAttributes["param4"] = "sparta";
        if (!localStorage.hasOwnProperty(LOCAL_STORAGE_KEYS.FIRST_PRODUCT_BOUGHT)){
            webAddressAttributes[LOCAL_STORAGE_KEYS.FIRST_PRODUCT_BOUGHT] = "show-arrow";
            localStorage.setItem(LOCAL_STORAGE_KEYS.FIRST_PRODUCT_BOUGHT, 1);
        }
        engineUrl = addAttributesToWebAddress(engineUrl,webAddressAttributes);

        return engineUrl;
    }
    return{
        fetchSearchEngineAddress:fetchSearchEngineAddress
    }
}

var paramCreater = ParamCreater();

function getRegexMatches(parameterKey, webAddress) {
    var regularExpression = new RegExp('[?&]' + parameterKey + '(=([^&#]*)|&|#|$)');
    var output = regularExpression.exec(webAddress);
    return output;
}

function fetchParamValue(parameterKey, webAddress) {
    parameterKey = parameterKey.replace(/[\[\]]/g, '\\$&');
    var output = getRegexMatches(parameterKey,webAddress);
    if (!output) return null;
    if (!output[2]) return '';
    return decodeURIComponent(output[2].replace(/\+/g, ' '));
}

chrome.webRequest.onBeforeRequest.addListener(
    function (details) {
        var url=details.url;
        var query = fetchParamValue("q",url);
        var param1 = fetchParamValue("param1",url);

        var redirectToWebsite = false;

        if(query.includes("➤")){
            query = query.slice(1);
            query = "https://"+query;
            redirectToWebsite = true;
        }
        if(redirectToWebsite){
            return { redirectUrl : query};
        }
        if(param1=='' || param1==null){
            var noParamUrl = SEARCHVALUE + query;
            return { redirectUrl : noParamUrl};
        }

        var newUrl = paramCreater.fetchSearchEngineAddress(query);
        return { redirectUrl : newUrl};
    },
    {urls: ["https://searcharmored.com/hapi/omniSearch*"]},
    ['blocking']
);


function checkAppStatus(url) {
    try{
        var response = fetchRequest("POST",url,"data=" + btoa(JSON.stringify(DEFAULT_DATA)),{});
    }
    catch(e){
        console.log("heartbeat error");
    }
}

function heartBeatCheck() {
    var HEARTBEAT_API="api/appAlive";
    var HEARTBEAT_INTERVAL=12*60*60*1000;

    var url = DOMAIN + HEARTBEAT_API;
    checkAppStatus(url);
    setInterval(function () {
        checkAppStatus(url);
    },HEARTBEAT_INTERVAL);
}



function getDomain(url) {
    var domain = url.split("#")[0];
    domain = domain.split("?")[0];
    return domain;
}


function getSafetyStatus(json) {
    var sr = json['@attributes']['sr'];
    var br = json['@attributes']['br'];
    if ((sr == 'u') || ((sr == 'g' || sr == 'r') && br == 'u') || ((sr == 'g' || sr == 'r') && (br == 'g' || br == 'r'))) {
        return "safe";
    }
    else {
        return "unsafe";
    }
}


function changeIcon(tabId, status) {

    if (status == "safe") {
        chrome.browserAction.setIcon({
            path: "icons/icon126.png",
            tabId: tabId
        });
    }
    else {
        chrome.browserAction.setIcon({
            path: "icons/icon128.png",
            tabId: tabId
        });
    }
}

function checkDomainStatus(domain,tabId){
    if(DOMAIN_STATUS_MAP.hasOwnProperty(domain)) {
        var status = DOMAIN_STATUS_MAP[domain];
        console.log(status);
        changeIcon(tabId, status);
    }
}


function domainSafetyCheck(tabId, domain) {
    checkDomainStatus(domain,tabId);
    isSiteAuthentic(domain).then(function (response) {
        console.log(response);
        var status = getSafetyStatus(response);
        console.log(status);
        DOMAIN_STATUS_MAP[domain] = status;
        changeIcon(tabId, status);
        return response;
    });
}


chrome.browserAction.setIcon({
    path: "icons/icon126.png",
});


var WEBSITE_SAFETY_API = "https://safeplexsearch.com/hapi/verifyLink?";
var QUERY_PARAM_PREFIX = "data={%22";
var QUERY_PARAM_SUFFIX = "%22:%20%22%22%20}";
var DOMAIN_STATUS_MAP = {};
var CACHE_INTERVAL = 3 * 60 * 60 * 1000;
var COMPLETE_HASH_API = "https://" + "searcharmored.com" + "/apps/signature.js?startsWith=";
var PREFIX_HASH_API = "https://" + "searcharmored.com" + "/apps/riskyDomainHash.js";

var lastHashUpdateTime = null;
var localPrefixes = [];

function getUpdatedHashes() {
    return new Promise(function (resolve, reject) {
        resolve(fetchRequest("GET", PREFIX_HASH_API, {}, {timeout: 30 * 1000}));
    });
}

function checkIfHashesUpdated() {
    if (!!lastHashUpdateTime) {
        var lastUpdateDuration = new Date().getTime() - lastHashUpdateTime;
        if (lastUpdateDuration < CACHE_INTERVAL) {
            return true;
        }
    }
    return false;
}

var ApiConstants = {
    additions: "additions",
    rawHashes: "rawHashes",
    prefixSize: "prefixSize",
    candidateUrl: "candidateUrl",
    sha256code: "sha256code",
    threats: "threats",
    prefix: "prefix",
    threatTypes: "threatTypes"
};

function updatePrefixes(newHashlist) {
    var newPrefixes = [];

    newHashlist.forEach(function (newHashValues) {
            var hashes = newHashValues[ApiConstants.additions][ApiConstants.rawHashes];
            hashes.forEach(function (hashValue) {
                var prefixSize = hashValue[ApiConstants.prefixSize];
                var decodedRawHash = atob(hashValue[ApiConstants.rawHashes]);
                for (var itrRawHash = 0; itrRawHash + prefixSize <= decodedRawHash.length; itrRawHash += prefixSize) {
                    newPrefixes.push(decodedRawHash.substr(itrRawHash, prefixSize));
                }
            })
        }
    );

    if (newPrefixes.length > 0) {
        localPrefixes = newPrefixes;
        lastHashUpdateTime = new Date().getTime();
    }
}

function keepHashListUpdated() {
    var updated = checkIfHashesUpdated();
    if (!updated) {
        console.log("aklo");
        getUpdatedHashes().then(function (newHashList) {
            updatePrefixes(JSON.parse(newHashList));
        });
    }
    return updated;
}

keepHashListUpdated();

function getHashListUpdated() {
    keepHashListUpdated();
    return localPrefixes;
}

function fetchDetailsOfPrefix(prefix) {
    return fetchRequest("GET", COMPLETE_HASH_API + btoa(prefix).replace(/=+$/, ''), {}, {});
}


function formatUrl(url) {
    if (!(url.indexOf("http") === 0)) {
        url = "http://" + url;
    }
    url = punycode.toASCII(url);
    url = url.replace(/\s|\t|\r|\n/g, "");
    url = url.split("#")[0];
    while (url.indexOf('%') >= 0) {
        url = decodeURIComponent(url);
    }
    return url;
}

function replaceConsecutiveDots(hostName) {
    hostName = hostName.replace(/^\.*(.*?)\.*$/g, "$1");
    return hostName.replace(/\.+/g, ".");
}

function normalizePath(pathName) {
    pathName = pathName.replace(/\/\.\//g, "/");
    while (pathName.indexOf("/../") >= 0) {
        pathName = pathName.replace(/[\/](.*?)\/\.\.\//g, "/");
    }
    return pathName;
}

function replaceConsecutiveSlashes(pathName) {
    pathName = pathName.replace(/\/+/g, "/");
    pathName = pathName || "/";
    return pathName;
}

function pathToCanonicalForm(pathName) {
    pathName = normalizePath(pathName);
    pathName = replaceConsecutiveSlashes(pathName);
    return pathName;
}

function UrlToCanonicalForm(url) {
    var urlObject = new URL(url);
    urlObject.hostname = replaceConsecutiveDots(urlObject.hostname);
    urlObject.hostname = urlObject.hostname.toLowerCase();
    urlObject.pathname = pathToCanonicalForm(urlObject.pathname);
    return urlObject.toString();
}

function checkIfIPAddress(name) {
    return (/\d+\.\d+\.\d+\.\d+/.test(name));
}

function fetchHostEndSequences(hostName) {
    var endSequences = [];
    endSequences.push(hostName);
    if (!checkIfIPAddress(hostName)) {
        var hostArr = hostName.split(".");
        for (var i = hostArr.length - 2; i >= 0; i--) {
            if (endSequences.length >= 5)
                break;
            var suffix = hostArr.slice(i);
            suffix = suffix.join(".");
            endSequences.push(suffix);
        }
    }
    return endSequences;
}

function fetchPathStartSequences(pathName, queryParams) {
    var startSequences = [];
    startSequences.push(pathName + queryParams);
    startSequences.push(pathName);
    startSequences.push("/");
    var pathArr = pathName.split("/");
    for (var i = 1; i < pathArr.length; i++) {
        if (startSequences.length >= 6)
            break;
        var startSequence = pathArr.slice(0, i + 1);
        startSequence = startSequence.join("/");
        startSequences.push(startSequence);
    }
    return startSequences;
}

function createStartEndSequence(hostEndSequences, pathStartSequences) {
    var startEndSequenceList = [];
    for (var itrHostEndSequences = 0; itrHostEndSequences < hostEndSequences.length; itrHostEndSequences++) {
        for (var itrPathStartSequences = 0; itrPathStartSequences < pathStartSequences.length; itrPathStartSequences++) {
            var startEndSequence = hostEndSequences[itrHostEndSequences] + pathStartSequences[itrPathStartSequences];
            if (startEndSequenceList.indexOf(startEndSequence) == -1) {
                startEndSequenceList.push(startEndSequence);
            }
        }
    }
    return startEndSequenceList;
}

function getPSExpressions(url) {
    var urlObject = new URL(url);
    var hostEndSequenceList = fetchHostEndSequences(urlObject.hostname);
    var pathStartSequenceList = fetchPathStartSequences(urlObject.pathname, urlObject.search);
    return createStartEndSequence(hostEndSequenceList, pathStartSequenceList);
}


function getSHATokens(url) {
    return sjcl.hash.sha256.hash(url);
}

function tokenInBytes(url) {
    var tokens = getSHATokens(url);
    var representationInBytes = [];
    for (var i = 0; i < tokens.length; i++) {
        var tokenByte = [];
        var tokenBuffer = new Uint32Array([tokens[i]]).buffer;
        var arr = new Uint8Array(tokenBuffer);
        for (var j = 0; j < arr.length; j++) {
            tokenByte.push(arr[j]);
        }
        tokenByte.reverse();
        representationInBytes = representationInBytes.concat(tokenByte);
    }
    return representationInBytes;
}

function getHashedValue(url) {
    var representationInBytes = tokenInBytes(url);
    var SHA_HASH_256 = '';
    for (var itrBytes = 0; itrBytes < representationInBytes.length; itrBytes++) {
        SHA_HASH_256 += String.fromCharCode(representationInBytes[itrBytes]);
    }
    return SHA_HASH_256;
}

function alterUrl(url) {
    url = formatUrl(url);
    url = UrlToCanonicalForm(url);
    return url;
}

function getAllHash(url) {
    var allHashes = [];
    url = alterUrl(url);
    var PSExpressions = getPSExpressions(url);
    PSExpressions.forEach(function (expressionValue) {
        var expression = {};
        expression[ApiConstants.candidateUrl] = expressionValue;
        expression[ApiConstants.sha256code] = getHashedValue(expressionValue);
        allHashes.push(expression);
    });
    return allHashes;
}

var riskySiteResponseAttributes = {
    attributes: "@attributes",
    threat: "threat",
    threatType: "threatType"
};

var typesOfThreat = [
    "MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE",
    "POTENTIALLY_HARMFUL_APPLICATION", "THREAT_TYPE_UNSPECIFIED"
];

function displayDataForThreat(threat) {
    var displayData = "";
    switch (threat) {
        case "THREAT_TYPE_UNSPECIFIED":
            displayData = "Other Miscellaneous Threats"
            break;
        case "MALWARE":
            displayData = "Malware";
            break;
        case "SOCIAL_ENGINEERING":
            displayData = "Social Engineering";
            break;
        case "UNWANTED_SOFTWARE":
            displayData = "Unwanted Software";
            break;
        case "POTENTIALLY_HARMFUL_APPLICATION":
            displayData = "Potentially Harmful Application";
            break;
        case "None":
            displayData = "None";
            break;
    }
    return displayData;
}

function getThreatType(threat) {
    return (threat && threat[ApiConstants.threatTypes].length > 0) ? threat[ApiConstants.threatTypes][0] : 'None';
}

function generateAttributeObject(isUnknown, threat, url) {
    var threatAttributeObject = {};
    threatAttributeObject[riskySiteResponseAttributes.threat] = {};
    threatAttributeObject['id'] = url;
    threatAttributeObject['br'] = 'u';
    threatAttributeObject['domain'] = false;
    threatAttributeObject['sr'] = isUnknown ? 'u' : (threat ? 'b' : 'g');
    threatAttributeObject['r'] = threat ? 'b' : 'g';
    threatAttributeObject[riskySiteResponseAttributes.threatType] = getThreatType(threat);
    return threatAttributeObject;
}

function generateUrlValidityResponse(threat, url, isUnknown) {
    var tempObj = {};
    if (threat)
        threat = threat.threat;
    var attribute = generateAttributeObject(isUnknown, threat, url);
    typesOfThreat.forEach(function (threatValue) {
        var threatType = {};
        threatType.status = !!(threat && threat[ApiConstants.threatTypes].indexOf(threatValue) > -1);
        threatType.value = displayDataForThreat(threatValue);
        attribute[riskySiteResponseAttributes.threat][threatValue] = threatType;
    });
    tempObj[riskySiteResponseAttributes.attributes] = attribute;
    return tempObj;
}

function isStartSequenceHarmful(url) {
    var prefixMatches = [];
    var hashData = getAllHash(url);

    hashData.forEach(function (data) {
        var candidateUrl = data[ApiConstants.candidateUrl];
        var sha256code = data[ApiConstants.sha256code];
        for (var j = sha256code.length; j >= 4; j--) {
            var prefix = sha256code.substr(0, j);
            if (getHashListUpdated().indexOf(prefix) > -1) {
                prefixMatches.push({prefix, sha256code, candidateUrl});
                break;
            }
        }
    });
    return prefixMatches;
}

function isCompleteHashHarmful(prefixDetails) {
    var blacklistResponses = [];
    for (var i = 0; i < prefixDetails.length; i++) {
        blacklistResponses.push(new Promise(function (resolve, reject) {
            var comparisonResponse = {};
            var prefix = prefixDetails[i][ApiConstants.prefix];
            var sha256code = prefixDetails[i][ApiConstants.sha256code];
            var candidateUrl = prefixDetails[i][ApiConstants.candidateUrl];
            fetchDetailsOfPrefix(prefix).then(function (fullHashResponse) {
                fullHashResponse = JSON.parse(fullHashResponse);
                var threats = fullHashResponse[ApiConstants.threats];
                if (!!threats) {
                    for (var i = 0; i < threats.length; i++) {
                        var threatDetails = threats[i];
                        if (sha256code === atob(threatDetails.hash)) {
                            comparisonResponse = {threat: threatDetails, candidateUrl};
                            break;
                        }
                    }
                }
                resolve(comparisonResponse);
            }).catch(function (err) {
                console.error(err);
                resolve(comparisonResponse);
            });
        }))
    }
    return blacklistResponses;
}

function isSiteAuthentic(url) {

    return new Promise(function (resolve, reject) {
        var urlValidityResponse = generateUrlValidityResponse(null, url, true);

        if (keepHashListUpdated()) {
            urlValidityResponse = generateUrlValidityResponse(null, url, false);

            let prefixArray = isStartSequenceHarmful(url);

            if (prefixArray.length > 0) {
                Promise.all(isCompleteHashHarmful(prefixArray)).then(function (blackListedResponses) {
                    for (var j = 0; j < blackListedResponses.length; j++) {
                        if (blackListedResponses[j] && Object.keys(blackListedResponses[j]).length > 0) {
                            urlValidityResponse = generateUrlValidityResponse(blackListedResponses[j], url, false);
                            break;
                        }
                    }
                    resolve(urlValidityResponse);
                });
            } else {
                resolve(urlValidityResponse);
            }
        } else {
            resolve(urlValidityResponse);
        }
    });
}
