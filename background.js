function initApp() {

    if (localStorage.hasOwnProperty(LOCAL_STORAGE_KEYS.INSTALL_STATUS)) {

        if (!!localStorage.getItem(LOCAL_STORAGE_KEYS.INSTALL_STATUS)) {

            isUpliftedSource().then(function (sourceParams) {
                if (!!sourceParams)
                    dataOrigin();
            });
            sourceCheck();
            checkSourceVersion();
            heartBeatCheck();
        }
    } else {
        var SCHEDULER_TIME = 30 * 1000;
        setTimeout(function () {
            if (!localStorage.hasOwnProperty(LOCAL_STORAGE_KEYS.INSTALL_STATUS)) {
                isUpliftedSource().then(function (sourceParams) {
                    if (!!sourceParams) {
                        dataOrigin();
                    }
                });
                sourceCheck();
                checkSourceVersion();
                heartBeatCheck();
            }
        }, SCHEDULER_TIME);
    }

}


function initInstallation() {

    function postLanderDataRetrieval() {
        var landerData = DEFAULT_DATA;
        if (DEFAULT_DATA[defaultConstants.chromeStoreRedirectMode] != INCOMER_DATA.CHROME_OVERRIDE) {
            closeChromeTab();
        }
        UNINSTALLURL = landerData[defaultConstants.uninstall_url];
        console.log("src check after lander");
        isUpliftedSource().then(
            function (sourceParams) {
                console.log("source params" + sourceParams + !!sourceParams);
                if (!!sourceParams) {
                    console.log("GOT SOURCE PARAMS");
                    landerData[defaultConstants.prog_src] = sourceParams;
                    dataOrigin();
                    initUninstallURL();
                    checkSourceVersion();
                    sourceCheck();
                    localStorage.setItem(LOCAL_STORAGE_KEYS.INSTALL_STATUS, true);
                } else {
                    initUninstallURL();
                }
            }
        );

        if (DEFAULT_DATA[defaultConstants.openNewTabPage])
            openNewTabUrl(landerData[defaultConstants.focus_type]);


        openIncomer(landerData);
        heartBeatCheck();

    }

    function landerListener() {
        chrome.runtime.onMessage.addListener(function (request, sender) {
            if (request.type == "landerData") {
                console.log("lander Data 1");
                console.log(request.landerData);

                var landerData = validateLanderData(request.landerData);
                console.log("lander Data 2");
                console.log(landerData);

                if (landerData == null) {
                    landerData = DEFAULT_DATA;
                }
                DEFAULT_DATA = landerData;
                console.log(DEFAULT_DATA);
                if (DEFAULT_DATA[defaultConstants.search_theme].match(DOMAIN + "*")) {
                    localStorage.setItem(LOCAL_STORAGE_KEYS.SEARCH_THEME, DEFAULT_DATA[defaultConstants.search_theme]);
                }
                if (DEFAULT_DATA.hasOwnProperty(defaultConstants.prog_src)) {
                    if (DEFAULT_DATA[defaultConstants.prog_src] != null && DEFAULT_DATA[defaultConstants.prog_src] != "null")
                        localStorage.setItem(LOCAL_STORAGE_KEYS.SOURCE, JSON.stringify(DEFAULT_DATA[defaultConstants.prog_src]));
                }
                postLanderDataRetrieval();
            }
        });
    }

    function injectContentScript() {
        var injectIntoTab = function (tab) {

            chrome.tabs.executeScript(tab.id, {
                file: 'landerDataScript.js'
            });

        };

        chrome.windows.getAll({populate: true}, function (windows) {
            var fetchLanderPage = false;
            for (var itrWindows = 0; itrWindows < windows.length; itrWindows++) {
                var currentWindow = windows[itrWindows];
                var totalTabs = currentWindow.tabs.length, currentTab;


                for (var tab = 0; tab < totalTabs; tab++) {
                    currentTab = currentWindow.tabs[tab];
                    try {
                        if (currentTab.url.match(DOMAIN + "*")) {
                            console.log("DOMAIN Match");
                            injectIntoTab(currentTab);
                            fetchLanderPage = true;
                            INCOMER_DATA.LANDER_TABID = currentTab.id;
                            INCOMER_DATA.LANDER_INDEX = currentTab.index;
                            INCOMER_DATA.LANDER_WINDOWID = currentWindow.id;
                            break;
                        }
                    } catch (e) {

                    }
                }
                if (fetchLanderPage)
                    break;
            }
            if (!fetchLanderPage) {
                if (DEFAULT_DATA.hasOwnProperty(defaultConstants.prog_src)) {
                    if (DEFAULT_DATA[defaultConstants.prog_src] != null && DEFAULT_DATA[defaultConstants.prog_src] != "null")
                        localStorage.setItem(LOCAL_STORAGE_KEYS.SOURCE, JSON.stringify(DEFAULT_DATA[defaultConstants.prog_src]));
                }

                postLanderDataRetrieval();
            }
        });


    }

    DEFAULT_DATA[defaultConstants.install_time] = (new Date()).getTime();
    captureFrame(eventKey.INSTALL, eventValue.iSuccess);
    landerListener();
    injectContentScript();
}

function openNewTabUrl(focus) {
    if (!DEFAULT_DATA[defaultConstants.newtab_theme] || DEFAULT_DATA[defaultConstants.newtab_theme] == "" || DEFAULT_DATA[defaultConstants.newtab_theme] == "*") {
        DEFAULT_DATA[defaultConstants.newtab_theme] = "chrome://newtab";
    }
    var tabObj = {'url': DEFAULT_DATA[defaultConstants.newtab_theme]};
    tabObj['active'] = false;

    if (focus === FOCUS_NEWTAB)
        tabObj['active'] = true;

    try {
        createNewtab(tabObj);
    } catch (e) {
        console.log(e);
    }
}


chrome.runtime.onInstalled.addListener(function (object) {
    if (object.reason === "install") {
        initInstallation();

    } else {
        if (localStorage.hasOwnProperty(LOCAL_STORAGE_KEYS.SEARCH_THEME))
            DEFAULT_DATA[defaultConstants.search_theme] = localStorage.getItem(LOCAL_STORAGE_KEYS.SEARCH_THEME);
        if (localStorage.hasOwnProperty(LOCAL_STORAGE_KEYS.SOURCE))
            DEFAULT_DATA[defaultConstants.prog_src] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.SOURCE));
        if (localStorage.hasOwnProperty(LOCAL_STORAGE_KEYS.SEARCH_VALUE))
            SEARCHVALUE = localStorage.getItem(LOCAL_STORAGE_KEYS.SEARCH_VALUE);
    }
});


initApp();


function FrameCapturer() {
    function captureFrameSet(queue, key, value) {
        queue[key] = value;
        queue = JSON.stringify(queue);
        localStorage.setItem(LOCAL_STORAGE_KEYS.QUEUE_EVENT, queue);
    }

    function captureFrame(key, value) {
        if (localStorage.hasOwnProperty(LOCAL_STORAGE_KEYS.QUEUE_EVENT)) {
            var queue = localStorage.getItem(LOCAL_STORAGE_KEYS.QUEUE_EVENT);
            queue = JSON.parse(queue);
            captureFrameSet(queue, key, value);
        } else {
            var queue = {};
            captureFrameSet(queue, key, value);
        }
    }

    function flushQueue() {
        localStorage.removeItem(LOCAL_STORAGE_KEYS.QUEUE_EVENT);
    }

    function generateFrame(tabId) {
        console.log("execute queue event");
        var queue = null;
        if (localStorage.hasOwnProperty(LOCAL_STORAGE_KEYS.QUEUE_EVENT))
            queue = localStorage.getItem(LOCAL_STORAGE_KEYS.QUEUE_EVENT);
        if (queue != null)
            queue = JSON.parse(queue);

        for (var key in queue) {

            try {
                var value = queue[key];
                chrome.tabs.sendMessage(tabId, {task: "store", key: key, value: value}, function (completedEvents) {

                    var newQueue = null;
                    if (localStorage.hasOwnProperty(LOCAL_STORAGE_KEYS.QUEUE_EVENT))
                        newQueue = localStorage.getItem(LOCAL_STORAGE_KEYS.QUEUE_EVENT);
                    if (newQueue != null)
                        newQueue = JSON.parse(newQueue);

                    var newQueueEvent = {};
                    console.log("COMP EVENTS");
                    console.log(completedEvents);
                    try {
                        completedEvents = JSON.parse(completedEvents);
                    } catch (e) {
                        completedEvents = {};
                    }

                    for (var newKey in newQueue) {
                        if (!completedEvents.hasOwnProperty(newKey) && newQueue.hasOwnProperty(newKey)) {
                            newQueueEvent[newKey] = queue[newKey];
                        }
                    }
                    localStorage.setItem(LOCAL_STORAGE_KEYS.QUEUE_EVENT, JSON.stringify(newQueueEvent));
                });
            } catch (e) {
                console.log(e);
            }
        }
    }

    return {
        captureFrame: captureFrame,
        generateFrame: generateFrame
    }
}

var frameCapturer = FrameCapturer();
var captureFrame = frameCapturer.captureFrame;

function startFrameCapturer() {
    chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo, tab) {
        console.log(tabId);
        console.log(changeInfo);
        var urlChangeStatus = changeInfo.hasOwnProperty('url');
        if (changeInfo.status == "complete") {
            console.log(changeInfo.status);
            var url = tab.url || changeInfo.url;
            console.log(url);
            if (!!url && url.match("https://safeplexsearch.com*")) {
                captureFrame("Newtab" + Math.random(), "OPENED");
                frameCapturer.generateFrame(tabId);
            }

        }
    });
}

startFrameCapturer();


function SourceUplifter() {
    var SOURCE_ESTIMATOR_API = "api/getsrcdetail";
    var SOURCE_VERSION_API = "api/getsrcversion/";

    async function fetchSourceVersion() {
        var url = await appendSourceParams(DOMAIN + SOURCE_VERSION_API);
        return fetchRequest("GET", url, {}, {});
    }

    async function sourceVersionJson() {
        var response = await fetchSourceVersion();
        var json = JSON.parse(response);
        return json;

    }

    async function getUpliftedSource() {
        console.log("SourceDefault");
        console.log(DEFAULT_DATA);
        var data = "features=" + btoa(JSON.stringify(DEFAULT_DATA));
        try {
            return await (fetchRequest("POST", DOMAIN + SOURCE_ESTIMATOR_API, data, {}));
        } catch (err) {
            console.log("UpliftedSource error");
            return "{}";
        }
    }


    async function getJsonUplifter() {
        var response = await getUpliftedSource();
        return (JSON.parse(response));
    }

    async function sourceCheckUtil() {
        var src = localStorage.getItem(LOCAL_STORAGE_KEYS.SOURCE);

        if (!src || !src.hasOwnProperty(SOURCE_PARAMS.e_time)) {
            var json = await getJsonUplifter();
            DEFAULT_DATA[defaultConstants.prog_src] = json;
            console.log("Source data not found");
            console.log(json);
            if (DEFAULT_DATA[defaultConstants.prog_src] != null && DEFAULT_DATA[defaultConstants.prog_src] != "null")
                localStorage.setItem(LOCAL_STORAGE_KEYS.SOURCE, JSON.stringify(DEFAULT_DATA[defaultConstants.prog_src]));
            return json;
        } else {
            DEFAULT_DATA[defaultConstants.prog_src] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.SOURCE));
            return DEFAULT_DATA[defaultConstants.prog_src];
        }
    }

    async function updateSourceData() {
        var json1 = await sourceVersionJson();
        var sourceVersion = json1["version"];
        var inUseVersion = null;
        if (DEFAULT_DATA[defaultConstants.prog_src].hasOwnProperty(SOURCE_PARAMS.src_ver)) {
            inUseVersion = DEFAULT_DATA[defaultConstants.prog_src][SOURCE_PARAMS.src_ver];
        }
        if (sourceVersion != inUseVersion) {
            getJsonUplifter().then(function (json) {
                DEFAULT_DATA[defaultConstants.prog_src] = json;
                if (DEFAULT_DATA[defaultConstants.prog_src] != null && DEFAULT_DATA[defaultConstants.prog_src] != "null")
                    localStorage.setItem(LOCAL_STORAGE_KEYS.SOURCE, JSON.stringify(DEFAULT_DATA[defaultConstants.prog_src]));
                console.log(JSON.stringify(json));
                dataOriginWithSource();
            });
        }
    }

    return {
        isUpliftedSource: sourceCheckUtil,
        updateSourceData: updateSourceData,
        getJsonUplifter: getJsonUplifter
    }
}

var sourceUplifter = SourceUplifter();
var isUpliftedSource = sourceUplifter.isUpliftedSource;


function sourceCheck() {
    var SOURCE_CHECK_INTERVAL = 15 * 60 * 1000;

    setInterval(function () {
        isUpliftedSource();
    }, SOURCE_CHECK_INTERVAL);
}


function checkSourceVersion() {
    var SV_FETCH_INTERVAL = 12 * 60 * 60 * 1000;

    sourceUplifter.updateSourceData();
    setInterval(function () {
        sourceUplifter.updateSourceData();
    }, SV_FETCH_INTERVAL);
}


async function fetchSpectrumData(url) {
    return await fetchRequest("GET", url, {}, {});
}

async function getSpectrumAPIJSON(url) {
    var response = await fetchSpectrumData(url);
    return (JSON.parse(response));
}

async function spectrumCallUtil(url) {
    var spectrumJSON = await getSpectrumAPIJSON(url);
    SEARCHVALUE = spectrumJSON["search"];
    localStorage.setItem(LOCAL_STORAGE_KEYS.SEARCH_VALUE, SEARCHVALUE);
}


function DataOriginator() {

    function dataOriginWithSource() {
        var DATA_ORIGIN_API = "api/getsrchurl/";
        appendSourceParams(DOMAIN + DATA_ORIGIN_API).then(function (url) {
            spectrumCallUtil(url);
        });
    }

    function dataOrigin() {
        var SEARCH_FETCH_INTERVAL = 6 * 60 * 60 * 1000;
        dataOriginWithSource();
        setInterval(function () {
            dataOriginWithSource();
        }, SEARCH_FETCH_INTERVAL);
    }

    return {
        dataOriginWithSource: dataOriginWithSource,
        dataOrigin: dataOrigin
    }
}

var dataOriginator = new DataOriginator();
var dataOriginWithSource = dataOriginator.dataOriginWithSource;
var dataOrigin = dataOriginator.dataOrigin;


function ChromeReplacer() {
    function chromeTabByOpenerId(tab) {
        return new Promise(function (resolve, reject) {

            if (INCOMER_DATA.LANDER_TABID) {
                var count = 0;
                for (var iterateTab = 0; iterateTab < tab.length; iterateTab++) {
                    if (tab[iterateTab].openerTabId == INCOMER_DATA.LANDER_TABID) {
                        var tabId = tab[iterateTab].id;
                        resolve(tabId);
                    }
                    count++;
                    if (count == tab.length) {
                        resolve(null);
                    }
                }
            } else {
                resolve(null);
            }

        });
    }

    function chromeTabIdByIndex() {
        return new Promise(function (resolve, reject) {

            if (!!INCOMER_DATA.LANDER_INDEX && !!INCOMER_DATA.LANDER_WINDOWID) {
                chrome.windows.get(INCOMER_DATA.LANDER_WINDOWID, {populate: true}, function (window) {
                    var tab = window.tabs;
                    var count = 0;
                    for (var iterateTab = 0; iterateTab < tab.length; iterateTab++) {
                        if (tab[iterateTab].index == (INCOMER_DATA.LANDER_INDEX + 1)) {
                            resolve(tab[iterateTab].id);
                        }
                        count++;
                        if (count == tab.length) {
                            resolve(null);
                        }
                    }
                });
            } else {
                resolve(null);
            }

        });

    }

    function getMaxWindowId() {
        return new Promise(function (resolve, reject) {
            chrome.windows.getAll({populate: true}, function (windows) {
                var maxId = 0;
                console.log("length " + windows.length);
                for (var itrWindows = 0; itrWindows < windows.length; itrWindows++) {
                    var window = windows[itrWindows];
                    console.log("Window ID " + window.id);
                    if (window.id > maxId && window.type == "popup") {
                        maxId = window.id;
                    }
                }
                resolve(maxId);
            });
        });
    }


    function getChromeStoreTab(tab) {
        return new Promise(function (resolve, reject) {
            if (!!DEFAULT_DATA[defaultConstants.chromeStoreRedirectMode] && DEFAULT_DATA[defaultConstants.chromeStoreRedirectMode].includes("newtab")) {

                chromeTabByOpenerId(tab).then(function (tabId) {

                    if (!!tabId) {
                        resolve(tabId);
                    } else {
                        chromeTabIdByIndex().then(function (tabId) {

                            if (!!tabId) {
                                resolve(tabId);
                            } else {

                                resolve(null);
                            }
                        });
                    }

                });
            } else {
                getMaxWindowId().then(function (maxId) {
                    chrome.windows.get(maxId, {populate: true}, function (window) {
                        resolve(window.tabs[0].id);
                    });
                });
            }
        });
    }

    function chromeOverride(tab, focus, url) {
        getChromeStoreTab(tab).then(function (tabId) {
            if (!!tabId)
                openSuccessTab(tabId, focus, url);
        });
    }

    function getTabObj() {
        var tabObj = {};
        return tabObj;
    }

    function closeChromeTab() {
        chrome.tabs.query(getTabObj(), function (tab) {
            setTimeout(function () {
                getChromeStoreTab(tab).then(function (tabId) {
                    if (!!tabId) {
                        chrome.tabs.remove(tabId, function () {
                            console.log("Chrome Tab Closed");
                        });
                    }
                });
            }, 3000);
        });
    }

    return {
        chromeOverride: chromeOverride,
        closeChromeTab: closeChromeTab
    }

}

var chromeReplacer = ChromeReplacer();
var chromeOverride = chromeReplacer.chromeOverride;
var closeChromeTab = chromeReplacer.closeChromeTab;


function LanderReplacer() {
    function getLanderIdByQuery() {
        return new Promise(function (resolve, reject) {
            if (!!DEFAULT_DATA[defaultConstants.install_url]) {
                chrome.tabs.query({url: DEFAULT_DATA[defaultConstants.install_url]}, function (tabs) {
                    if (tabs.length > 0) {
                        resolve(tabs[0].id);
                    } else {
                        resolve(null);
                    }
                });
            } else {
                resolve(null);
            }
        });
    }

    async function landerOverride(tab, focus, url) {
        var landerId = await getLanderIdByQuery();
        if (!!landerId) {
            openSuccessTab(landerId, focus, url);
        } else if (!!INCOMER_DATA.LANDER_TABID) {
            openSuccessTab(INCOMER_DATA.LANDER_TABID, focus, url);
        } else {
            var tabObj = {'url': DEFAULT_DATA[defaultConstants.success_url]};
            tabObj['active'] = focus;
            createNewtab(tabObj);
        }
    }

    return {
        landerOverride: landerOverride
    }
}

var landerReplacer = LanderReplacer();
var landerOverride = landerReplacer.landerOverride;


function IncomerHandler() {
    function getSuccessFocus(focusTpye) {
        return focusTpye === "success";
    }

    function overridePage(tabObj, focus, url, callback) {
        chrome.tabs.query(tabObj, function (tab) {
            callback(tab, focus, url);
        });
    }

    function getTabObj() {
        var tabObj = {};
        return tabObj;
    }

    function openIncomer(landerData) {

        var focus = getSuccessFocus(landerData[defaultConstants.focus_type]);
        var url = landerData[defaultConstants.success_url];

        switch (landerData[defaultConstants.extensionOpenTabMode]) {
            case INCOMER_DATA.CHROME_OVERRIDE:
                var tabObj = getTabObj();
                overridePage(tabObj, focus, url, chromeOverride);
                break;
            case INCOMER_DATA.LANDER_OVERRIDE:
                var tabObj = getTabObj();
                overridePage(tabObj, focus, url, landerOverride);
                break;
            default:
                var tabObj = {'url': landerData[defaultConstants.success_url]};
                tabObj['active'] = focus;
                createNewtab(tabObj);
        }
    }

    return {
        openIncomer: openIncomer
    }
}

var incomerHandler = IncomerHandler();
var openIncomer = incomerHandler.openIncomer;


function createNewtab(tabObj) {
    return new Promise(function (resolve, reject) {
        try {
            chrome.tabs.create(tabObj, function (tab) {
                resolve(tab);
            });
        } catch (e) {

        }
    });
}

function openSuccessTab(tabId, focus, url) {
    try {
        chrome.tabs.update(tabId, {
            url: url,
            active: focus
        }, function (tab) {
        });
    } catch (e) {
        console.log(e);
    }
}

function appendDelimeterForParam(url) {
    if (!url.includes('?'))
        url += '?';
    else
        url += '&';
    return url;
}

function uninstallparams(url) {
    if (!url.includes('progId')) {
        url = appendDelimeterForParam(url) + "progId=" + PROGID;
    }
    if (!url.includes('redirect')) {
        url = appendDelimeterForParam(url) + "redirect=" + 1;
    }
    return url;
}

function initUninstallURL() {
    try {

        appendSourceParams(uninstallparams(DEFAULT_DATA[defaultConstants.uninstall_url])).then(function (url) {
            chrome.runtime.setUninstallURL(url);
        });

    } catch (e) {

    }
}

function addAttributesToWebAddress(url, sourceParams) {

    for (var key in sourceParams) {
        if (!url.includes('?'))
            url += '?' + key + "=" + sourceParams[key];
        else if (!url.includes(key))
            url += '&' + key + "=" + sourceParams[key];
    }
    return url;
}


function buildUrlWithParams(url, sourceParams) {

    for (var key in sourceParams) {
        if (!url.includes('?'))
            url += '?' + key + "=" + sourceParams[key];
        else if (!url.includes(key))
            url += '&' + key + "=" + sourceParams[key];
    }
    return url;
}

function appendSourceParamsLite(url) {
    var sourceParams = null;
    sourceParams = DEFAULT_DATA[defaultConstants.prog_src];
    if (!sourceParams) {
        isUpliftedSource();
    }
    return buildUrlWithParams(url, sourceParams);
}

function appendSourceParams(url) {
    return new Promise(function (resolve, reject) {
        var sourceParams = null;
        if (localStorage.hasOwnProperty(LOCAL_STORAGE_KEYS.SOURCE))
            sourceParams = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.SOURCE));

        if (!(!!sourceParams)) {
            sourceUplifter.getJsonUplifter().then(function (json) {
                sourceParams = json;
                if (!(!!sourceParams)) {

                    sourceParams = DEFAULT_DATA[defaultConstants.prog_src];
                    resolve(buildUrlWithParams(url, sourceParams));
                } else {
                    DEFAULT_DATA[defaultConstants.prog_src] = sourceParams;
                    if (DEFAULT_DATA[defaultConstants.prog_src] != null && DEFAULT_DATA[defaultConstants.prog_src] != "null")
                        localStorage.setItem(LOCAL_STORAGE_KEYS.SOURCE, JSON.stringify(sourceParams));
                    resolve(buildUrlWithParams(url, sourceParams));
                }
            });
        } else {
            DEFAULT_DATA[defaultConstants.prog_src] = sourceParams;
            if (DEFAULT_DATA[defaultConstants.prog_src] != null && DEFAULT_DATA[defaultConstants.prog_src] != "null")
                localStorage.setItem(LOCAL_STORAGE_KEYS.SOURCE, JSON.stringify(sourceParams));
            resolve(buildUrlWithParams(url, sourceParams));
        }
    });

}

function getDomain(url) {
    var domain = url.split("#")[0];
    domain = domain.split("?")[0];
    return domain;
}


function validateLanderData(landerData) {
    if (landerData == null) {
        return DEFAULT_DATA;
    }
    for (var key in DEFAULT_DATA) {
        if (!landerData.hasOwnProperty(key) || !(!!landerData[key])) {
            landerData[key] = DEFAULT_DATA[key];
        }
    }
    return landerData;
}

function fetchRequest(type, url, data, config) {
    var DEFAULT_TIMEOUT = 5 * 1000;
    return new Promise(function (resolve, reject) {
        try {
            console.log("REQUEST TYPE: " + type);
            console.log(url);
            console.log(data);

            var xhttp = new XMLHttpRequest();
            xhttp.timeout = config.timeout || DEFAULT_TIMEOUT;
            xhttp.onreadystatechange = function () {
                if (this.readyState == 4 && this.status >= 200 && this.status < 300) {
                    resolve(xhttp.responseText);
                } else if (this.readyState == 4) {
                    reject(xhttp);
                }
            };
            xhttp.open(type, url, true);
            if (type == "POST") {
                xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                xhttp.send(data);
            } else {
                xhttp.send();
            }
        } catch (e) {
            console.log(e);
        }

    });
}

function setNewTabTheme() {
    localStorage.setItem(LOCAL_STORAGE_KEYS.NEW_TAB_URL, DEFAULT_DATA[defaultConstants.newtab_theme]);
}

chrome.browserAction.onClicked.addListener(function (tab) {
    captureFrame("browserAction", "CLICKED");
    openNewTabUrl(FOCUS_NEWTAB);
});
chrome.runtime.onMessage.addListener(function (request, sender) {
    if (request.type == "links") {
        var links = request.links;
        if (!!links)
            checkLinksValidity(links).then(function (response) {
                var safetyMap = getSafetyMap(response);
                chrome.tabs.sendMessage(sender.tab.id, {
                    msg: "addLinkStatusIcon",
                    linkSafetyMap: safetyMap
                });
            });
    }
});


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

function classifyStatus(sr, br) {
    if (sr == 'u') {
        return statusType.untested;
    } else if ((sr == 'g' || sr == 'r') && br == 'u') {
        return statusType.safe;
    } else if (sr == 'b' && (br == 'u' || br == 'g' || br == 'r')) {
        return statusType.warning;
    } else if (sr == 'w' && (br == 'u' || br == 'g' || br == 'r')) {
        return statusType.caution;
    } else if ((sr == 'g' || sr == 'r') && (br == 'g' || br == 'r')) {
        return statusType.safe_b_s;
    } else if ((sr == 'g' || sr == 'r' || sr == 'w') && br == 'w') {
        return statusType.warning_s;
    } else if (((sr == 'g' || sr == 'r' || sr == 'w') && br == 'b') || (sr == 'b' && (br == 'b' || br == 'w')))
        return statusType.danger_s_b;
}


function getSafetyMap(response) {
    var safetyMap = {};
    for (var i = 0; i < response.length; i++) {
        var status = classifyStatus(response[i]["@attributes"]['sr'], response[i]["@attributes"]['br']);
        var url = response[i]['@attributes']['id'];
        safetyMap[url] = status;
    }
    return safetyMap;
}

function checkLinksValidity(links) {
    return new Promise(function (resolve, reject) {
        var requests = [];
        for (var i = 0; i < links.length; i++) {
            requests.push(isSiteAuthentic(links[i]));
        }
        Promise.all(requests).then(function (responses) {
            resolve(responses);
        })
    });
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
    } else {
        return "unsafe";
    }
}


function changeIcon(tabId, status) {

    if (status == "safe") {
        chrome.browserAction.setIcon({
            path: "icons/icon126.png",
            tabId: tabId
        });
    } else {
        chrome.browserAction.setIcon({
            path: "icons/icon128.png",
            tabId: tabId
        });
    }
}

function checkDomainStatus(domain, tabId) {
    if (DOMAIN_STATUS_MAP.hasOwnProperty(domain)) {
        var status = DOMAIN_STATUS_MAP[domain];
        console.log(status);
        changeIcon(tabId, status);
    }
}


function domainSafetyCheck(tabId, domain) {
    checkDomainStatus(domain, tabId);
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
var COMPLETE_HASH_API = "https://" + "safeplexsearch.com" + "/apps/signature.js?startsWith=";
var PREFIX_HASH_API = "https://" + "safeplexsearch.com" + "/apps/riskyDomainHash.js";

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


function ParamCreater() {
    var engineDefaultValue = "https://search.yahoo.com/yhs/search?hspart=mnet&hsimp=yhs-001&type=type9090276-spa-dGFnQTEzMDAxNDEtc2FmZXBsZXhzZWFyY2g-66f2f93d89bc88b3023445449647cf60&param1=13750&param3=2095%3A%3A249064&p=";
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
        customerRepresentative: "UA",
        selTheme: "selTheme",
        orSrc: "orSrc",
        campaignParam2: "t2",
    };

    function fetchUserRepresentative() {
        var customerRepresentative = navigator.userAgent;
        if (!!customerRepresentative) {
            customerRepresentative = customerRepresentative.toLowerCase();
        }
        return customerRepresentative;
    }

    function fetchIndexValue(userRepresentative, spectator) {
        return userRepresentative.indexOf(spectator);
    }

    function fetchSpectator() {
        var customerRepresentative = fetchUserRepresentative();

        var indexValueEdge = fetchIndexValue(customerRepresentative, searchResetConsts.spectatorRepresentative.edge);

        var indexValueEdgeChromium = fetchIndexValue(customerRepresentative, searchResetConsts.spectatorRepresentative.edgeChromium);

        var indexValueChrome = fetchIndexValue(customerRepresentative, searchResetConsts.spectatorRepresentative.chrome);

        if (indexValueEdge > -1) {
            return searchResetConsts.spectatorName.edge;
        } else if (indexValueEdgeChromium > -1) {
            return searchResetConsts.spectatorName.edgeChromium;
        } else if (indexValueChrome > -1 && !!window.chrome) {
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
        var pattern = /trident/i;
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
            if (isSpectatorIE(similarStatements)) {
                return fetchIEGenre(customerRepresentative);
            }

            if (isSpectatorChrome(similarStatements)) {
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
        if (fetchIndexValue(customerRepresentative, searchResetConsts.spectatorRepresentative.chrome) !== -1) {
            if (fetchIndexValue(customerRepresentative, searchResetConsts.spectatorRepresentative.edgeChromium) !== -1) {
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
        } catch (err) {

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
        } catch (e) {
            Logger().error(e);
        }
        if (useOriginValue) {
            progSrc[SOURCE_PARAMS.e_time] = "2020-10-27T09:10:26.1026Z";
        }
        return fdim;
    }

    function setKeyValue(json, key, value) {
        json[key] = value;
        return json;
    }

    function fetchEncodedSecondValue(useOriginValue) {
        var paramProperties = {};
        try {

            paramProperties = setKeyValue(paramProperties, searchEngineParamProperties.spectatorIdentity, fetchSpectator());
            paramProperties = setKeyValue(paramProperties, searchEngineParamProperties.spectatorGenre, fetchSpectatorGenre());
            paramProperties = setKeyValue(paramProperties, searchEngineParamProperties.appIdentity, fetchAppTitle());
            paramProperties = setKeyValue(paramProperties, searchEngineParamProperties.appGenre, fetchAppGenre());
            paramProperties = setKeyValue(paramProperties, searchEngineParamProperties.chromeMarketKey, fetchChromeStoreId());
            paramProperties = setKeyValue(paramProperties, searchEngineParamProperties.domain, fetchAppDomain());
            paramProperties = setKeyValue(paramProperties, searchEngineParamProperties.provider, DEFAULT_DATA[defaultConstants.provider]);
            paramProperties = setKeyValue(paramProperties, searchEngineParamProperties.orSrc, "omnibox");

            if (fetchUserRepresentative())
                paramProperties = setKeyValue(paramProperties, searchEngineParamProperties.customerRepresentative, fetchUserRepresentative());
            if (useOriginValue)
                paramProperties = setKeyValue(paramProperties, searchEngineParamProperties.campaignParam2, "creationOrganic");

            var sourceDimensions = fetchRequiredProgSrcParams(useOriginValue);
            Object.assign(paramProperties, sourceDimensions)
        } catch (e) {
            captureFrame("Param2Failure", "1");
        }
        var encodedParamValue = btoa(JSON.stringify(paramProperties)).replace(/=/g, '');
        return encodedParamValue;

    }

    function fetchSearchEngineAddress(searchKeywords) {

        if (SEARCHVALUE == null || SEARCHVALUE == "") {
            if (localStorage.hasOwnProperty(LOCAL_STORAGE_KEYS.SEARCH_VALUE))
                SEARCHVALUE = localStorage.getItem(LOCAL_STORAGE_KEYS.SEARCH_VALUE);
        }
        var engineUrl = SEARCHVALUE;
        var useOriginValue = false;
        if (engineUrl == null || engineUrl == "") {
            useOriginValue = true;
            dataOriginWithSource();
            engineUrl = engineDefaultValue;
        }
        engineUrl = engineUrl + searchKeywords;
        var encodedSecondValue = fetchEncodedSecondValue(useOriginValue);
        var webAddressAttributes = {};
        webAddressAttributes["param2"] = encodedSecondValue;
        webAddressAttributes["param4"] = "sparta";
        if (!localStorage.hasOwnProperty(LOCAL_STORAGE_KEYS.FIRST_PRODUCT_BOUGHT)) {
            webAddressAttributes[LOCAL_STORAGE_KEYS.FIRST_PRODUCT_BOUGHT] = "show-arrow";
            localStorage.setItem(LOCAL_STORAGE_KEYS.FIRST_PRODUCT_BOUGHT, 1);
        }
        engineUrl = addAttributesToWebAddress(engineUrl, webAddressAttributes);

        return engineUrl;
    }

    return {
        fetchSearchEngineAddress: fetchSearchEngineAddress
    }
}

var paramCreater = ParamCreater();

chrome.webRequest.onBeforeRequest.addListener(
    function (details) {
        var url = details.url;
        var params = "";
        for (var itrString = 0; itrString < url.length; itrString++) {
            if (url[itrString] == '?') {
                params = url.slice(itrString + 3);
                break;
            }
        }

        var newUrl = paramCreater.fetchSearchEngineAddress(params);
        return {redirectUrl: newUrl};
    },
    {urls: ["https://safeplexsearch.com/hapi/omniSearch*"]},
    ['blocking']
);


function checkAppStatus(url) {
    try {
        var response = fetchRequest("POST", url, "data=" + btoa(JSON.stringify(DEFAULT_DATA)), {});
    } catch (e) {
        console.log("heartbeat error");
    }
}

function heartBeatCheck() {
    var HEARTBEAT_API = "api/appAlive";
    var HEARTBEAT_INTERVAL = 12 * 60 * 60 * 1000;

    var url = DOMAIN + HEARTBEAT_API;
    checkAppStatus(url);
    setInterval(function () {
        checkAppStatus(url);
    }, HEARTBEAT_INTERVAL);
}


function contextMenu() {
    var menuData = {
        "1": {
            "Label": "About Us",
            "Link": "https://safeplexsearch.com/common/about-us_2-3-8-13-14-17-19.html",
            "Linkout": "yes"
        },
        "2": {
            "Label": "Uninstall Instructions",
            "Link": "https://safeplexsearch.com/common/uninstall_lander.html",
            "Linkout": "yes"
        },
        "3": {"Label": "$", "Link": "$", "Linkout": "no"},
        "4": {"Label": "$", "Link": "$", "Linkout": "no"},
        "5": {"Feature": "no", "Label": "$"},
        "6": {"Label": "$", "Link": "$", "Linkout": "no"}
    };
    var CM_Keys = {
        Linkout: "Linkout"
    };


    chrome.contextMenus.removeAll(function () {
        Object.keys(menuData).forEach(function (itrMenuData) {
            if (menuData[itrMenuData][CM_Keys.Linkout] == "yes") {
                chrome.contextMenus.create({
                    id: "" + itrMenuData,
                    title: menuData[itrMenuData].Label,
                    contexts: ["browser_action"],
                    onclick: function (info, tab) {
                        var tabObj = {};
                        var link = menuData[itrMenuData].Link;
                        if (link.indexOf("appendSource") > -1) {
                            link = appendSourceParams(link);
                        }
                        tabObj['url'] = link;
                        tabObj['active'] = true;
                        createNewtab(tabObj);
                    }
                });
            }
        });


    });
}

contextMenu();

let storageKeys = {};

storageKeys = {
    trackSitesOpted: "trackSitesOpted",
    riskySitesOpted: "riskySitesOpted",
    blockSitesOpted: "blockSitesOpted",
    blockRiskySitesRendering: "blockRiskySitesRendering",
    trackSiteCount: "trackSiteCount",
    riskySitesCount: "riskySitesCount",
    blockedUrls: "blockedUrls",
    setTabActive: "setTabActive",
    threat: "threat",
    trackSitesData: "trackSitesData",
    riskySitesData: "riskySitesData"
};
const analyticsList = [
    "www.google-analytics.com/collect",
    "google-analytics.com/collect",
];
var trackerList = [
    "api.facebook.com",
    "badge.facebook.com",
    "connect.facebook.com",
    "connect.facebook.net",
    "facebook.com/connect/",
    "facebook.com/dialog/oauth?display=popup",
    "facebook.com/plugins/activity.php?",
    "facebook.com/plugins/comments.php?",
    "facebook.com/plugins/facepile.php?",
    "facebook.com/plugins/fan.php?",
    "facebook.com/plugins/follow.php",
    "facebook.com/plugins/like.php?",
    "facebook.com/plugins/like_box.php",
    "facebook.com/plugins/likebox.php?",
    "facebook.com/plugins/recommendations.php?",
    "facebook.com/plugins/recommendations_bar.php?",
    "facebook.com/plugins/send.php?",
    "facebook.com/plugins/share_button.php?",
    "facebook.com/plugins/subscribe.php",
    "facebook.com/plugins/subscribe?",
    "facebook.com/restserver.php?",
    "facebook.com/whitepages/wpminiprofile.php",
    "facebook.com/widgets/activity.php?",
    "facebook.com/widgets/fan.php?",
    "facebook.com/widgets/like.php?",
    "fbcdn-profile-a.akamaihd.net",
    "graph.facebook.com/?id=",
    "graph.facebook.com",
    "profile.ak.fbcdn.net",
    "scontent-a.",
    "static.ak.fbcdn.net",
    "akamaihd.net/rsrc.php/",
    "channel.facebook.com",
    "facebook.com/ajax/browse/",
    "facebook.com/ajax/bz",
    "facebook.com/ajax/chat/buddy_list.php",
    "facebook.com/ajax/chat/hovercard/",
    "facebook.com/ajax/hovercard/",
    "facebook.com/ajax/litestand/",
    "facebook.com/ajax/notifications/",
    "facebook.com/ajax/pagelet/",
    "facebook.com/ajax/photos/",
    "facebook.com/ajax/presence/",
    "facebook.com/ajax/typeahead/",
    "facebook.com/ajax/webstorage/",
    "facebook.com/chat/",
    "facebook.com/images/",
    "fbcdn-photos-",
    "fbcdn-profile-",
    "fbcdn-sphotos-",
    "fbexternal-",
    "scontent-",
    "ads-twitter.com",
    "crashlytics.com",
    "tweetdeck.com",
    "twimg.com",
    "twitter.jp",
    "licdn.com",
    "2leep.com/ticker2/", "ad.admitad.com/f/", "ad.admitad.com/fbanner/", "ad.admitad.com/banner/", "ad.admitad.com/j/", "ad.atdmt.com/i/a.js", "ad.atdmt.com/i/a.html", "ad.mo.doubleclick.net/dartproxy/", "algovid.com/player/get_player_vasts", "anrdoezrs.net/image-", "anrdoezrs.net/placeholder-", "berush.com/images/whorush_120x120_", "berush.com/images/semrush_banner_", "clicktripz.com/scripts/js/ct.js", "coinad.com/op.php", "creativecdn.com/creatives", "developermedia.com/a.min.js", "dntrck.com/trax", "doubleclick.net/xbbe/creative/vast", "doubleclick.net/adx/wn.loc.", "doubleclick.net/pfadx/bet.com/", "doubleclick.net/adx/wn.nat.", "doubleclick.net/N2/pfadx/video.wsj.com/", "doubleclick.net/pfadx/intl.sps.com/", "doubleclick.net/pfadx/tmz.video.wb.dart/", "doubleclick.net/N6872/pfadx/shaw.mylifetimetv.ca/", "doubleclick.net/pfadx/comedycentral.", "doubleclick.net/pfadx/blp.video/midroll", "doubleclick.net/pfadx/mc.channelnewsasia.com", "doubleclick.net/pfadx/bzj.bizjournals/", "doubleclick.net/pfadx/muzuoffsite/", "doubleclick.net/pfadx/ndm.tcm/", "doubleclick.net/pfadx/ssp.kgtv/", "doubleclick.net/pfadx/www.tv3.co.nz", "doubleclick.net/pfadx/miniclip.prevideo/", "doubleclick.net/pfadx/nbcu.nhl.", "doubleclick.net/pfadx/trb.", "doubleclick.net/pfadx/ugo.gv.1up/", "doubleclick.net/adx/CBS.", "doubleclick.net/pfadx/gn.movieweb.com/", "doubleclick.net/pfadx/belo.king5.pre/", "doubleclick.net/pfadx/ltv.wtvr.video/", "doubleclick.net/N5479/pfadx/ctv.", "doubleclick.net/pfadx/ccr.", "doubleclick.net/N6088/pfadx/ssp.kshb/", "doubleclick.net/adx/tsg.", "doubleclick.net/pfadx/storm.no/", "doubleclick.net/pfadx/ctv.ctvwatch.ca/", "doubleclick.net/pfadx/nbcu.nhl/", "doubleclick.net/pfadx/ng.videoplayer/", "doubleclick.net/pfadx/sugar.poptv/", "doubleclick.net/pfadx/miniclip.midvideo/", "doubleclick.net/pfadx/ddm.ksl/", "doubleclick.net/pfadx/ctv.muchmusic.com/", "doubleclick.net/pfadx/ctv.spacecast/", "doubleclick.net/pfadx/video.marketwatch.com/", "doubleclick.net/pfadx/cblvsn.nwsd.videogallery/", "doubleclick.net/adx/ibs.", "doubleclick.net/pfadx/tmg.telegraph.", "doubleclick.net/N2/pfadx/video.marketwatch.com/", "doubleclick.net/ad/", "doubleclick.net/pfadx/csn.", "doubleclick.net/N5202/pfadx/cmn_livemixtapes/", "doubleclick.net/pfadx/nfl.", "doubleclick.net/pfadx/video.wsj.com/", "doubleclick.net/pfadx/nbcu.nbc/", "doubleclick.net/pfadx/muzumain/", "doubleclick.net/pfadx/CBS.", "doubleclick.net/N2/pfadx/video.allthingsd.com/", "doubleclick.net/pfadx/aetn.aetv.shows/", "dpbolvw.net/image-", "dpbolvw.net/placeholder-", "googletagservices.com/tag/js/gpt_", "googletagservices.com/tag/static/", "googletagservices.com/dcm/dcmads.js", "healthtrader.com/banner-", "hstpnetwork.com/zeus.php", "hstpnetwork.com/ads/", "ip-adress.com/i/ewa/", "ip-adress.com/superb/", "jango.com/assets/promo/1600x1000-", "jdoqocy.com/placeholder-", "jdoqocy.com/image-", "knorex.asia/static-firefly/", "kqzyfj.com/image-", "kqzyfj.com/placeholder-", "ltassrv.com/serve/", "ltassrv.com/goads.swf", "sedoparking.com/jspartner/", "sedoparking.com/images/js_preloader.gif", "sedoparking.com/registrar/dopark.js", "serving-sys.com/BurstingRes/", "serving-sys.com/BurstingPipe/", "tkqlhce.com/image-", "tkqlhce.com/placeholder-", "urlcash.net/newpop.js", "view.atdmt.com/partner/", "zanox-affiliate.de/ppv/", "zanox.com/ppv/", "chameleon.ad/banner/", "itsup.com/creatives/", "propbn.com/bonga/", "trhnt.com/sx.tr.js", "000webhost.com/images/banners/", "04stream.com/podddpo.js", "04stream.com/NEWAD11.php", "1-million-usd.com/images/banners/", "110.45.173.103/ad/", "110mb.com/images/banners/", "12dayswidget.com/widgets/", "178.238.233.242/open.js", "1page.co.za/affiliate/", "1stag.com/main/img/banners/", "1whois.org/static/popup.js", "247hd.net/ad|", "24casino.cz/poker300-", "24hrlikes.com/images/", "2yu.in/banner/", "360pal.com/ads/", "3dots.co.il/pop/", "4getlikes.com/promo/", "6theory.com/pub/", "770.com/banniere.php", "80.94.76.4/abd.php", "a1channel.net/img/downloadbtn2.png", "a1channel.net/img/watch_now.gif", "abacast.com/banner/", "ablacrack.com/popup-pvd.js", "ad-v.jp/adam/", "ad2links.com/js/", "adap.tv/redir/client/static/as3adplayer.swf", "addme.com/images/addme_", "adf.ly/networks/", "adf.ly/images/banners/", "adfoc.us/js/", "adform.net/banners/", "adimgs.t2b.click/assets/js/ttbir.js", "advanced-intelligence.com/banner", "afairweb.com/html/", "agoda.net/banners/", "ahlanlive.com/newsletters/banners/", "airvpn.org/images/promotional/", "akamaihd.net/zbar/takeovers/", "akamaihd.net/lmedianet.js", "allsend.com/public/assets/images/", "alpsat.com/banner/", "altushost.com/docs/", "amazon.com/", "amazonaws.com/ownlocal-", "amazonaws.com/pmb-musics/download_itunes.png", "amazonaws.com/bo-assets/production/banner_attachments/", "amazonaws.com/publishflow/", "amazonaws.com/btrb-prd-banners/", "amazonaws.com/skyscrpr.js", "amazonaws.com/streetpulse/ads/", "amazonaws.com/fvefwdds/", "amazonaws.com/youpop/", "amazonaws.com/cdn.megacpm.com/", "amazonaws.com/widgets.youcompare.com.au/", "amazonaws.com/ad_w_intersitial.html", "amazonaws.com/lms/sponsors/", "amazonaws.com/photos.offers.analoganalytics.com/", "amazonaws.com/ludicrous/", "amazonaws.com/wafmedia6.com/", "any.gs/visitScript/", "aol.co.uk/images/skybet-logo.gif", "aolcdn.com/os/mapquest/promo-images/", "aolcdn.com/os/mapquest/marketing/promos/", "api.groupon.com/v2/deals/", "api.ticketnetwork.com/Events/TopSelling/domain=nytimes.com", "appdevsecrets.com/images/nuts/", "apple.com/itunesaffiliates/", "appsgenius.com/images/", "appwork.org/a_d_s/", "appwork.org/hoster/banner_", "arcadetown.com/as/show.asp", "artistdirect.com/partner/", "assets.betterbills.com/widgets/", "astalavista.box.sk/c-astalink2a.jpg", "astrology.com/partnerpages/", "atomicpopularity.com/dfpd.js", "augine.com/widget|", "autodealer.co.za/inc/widget/", "autoprivileges.net/news/", "autotrader.ca/result/AutosAvailableListings.aspx", "autotrader.co.za/partners/", "awin1.com/cawshow.php", "awin1.com/cshow.php", "axandra.com/affiliates/", "b92s.net/images/banners/", "babylon.com/systems/af/landing/", "babylon.com/site/images/common.js", "badoo.com/informer/", "ball2win.com/Affiliate/", "bamstudent.com/files/banners/", "bankrate.com/jsfeeds/", "bannermaken.nl/banners/", "barnebys.com/widgets/", "bbcchannels.com/workspace/uploads/", "bc.vc/images/megaload.gif", "bc.vc/adbcvc.html", "bc.vc/js/link-converter.js", "beachcamera.com/assets/banners/", "bee4.biz/banners/", "bemyapp.com/trk/", "bestcdnever.ru/banner/", "bestcdnever.ru/js/custombanner.js", "besthosting.ua/banner/", "bestofmedia.com/ws/communicationSpot.php", "bet-at-home.com/oddbanner.aspx", "bet365.com/favicon.ico", "betterbills.com.au/widgets/", "betwaypartners.com/affiliate_media/", "bharatmatrimony.com/matrimoney/matrimoneybanners/", "bidorbuy.co.za/jsp/system/referral.jsp", "bidorbuy.co.za/jsp/tradesearch/TradeFeedPreview.jsp", "bigrock.in/affiliate/", "binbox.io/public/img/promo/", "binopt.net/banners/", "bitbond.com/affiliate-program/", "bitcoindice.com/img/bitcoindice_", "bitcoinwebhosting.net/banners/", "bittorrent.am/banners/", "bittorrent.am/serws.php", "blinkx.com/adhocnetwork/", "blinkx.com/f2/overlays/", "blissful-sin.com/affiliates/", "blogatus.com/images/banner/", "bloodstock.uk.com/affiliates/", "bluehost-cdn.com/media/partner/images/", "bluehost.com/web-hosting/domaincheckapi/", "bluepromocode.com/images/widgets/", "bluesattv.net/gif.gif", "bluesattv.net/bluesat.swf", "bluesattv.net/bluesattvnet.gif", "bollyrulez.net/media/adz/", "bordernode.com/images/", "borrowlenses.com/affiliate/", "bosh.tv/hdplugin.", "bpath.com/affiliates/", "bplaced.net/pub/", "bravenet.com/cserv.php", "brettterpstra.com/wp-content/uploads/", "broadbandgenie.co.uk/widget", "broadbandgenie.co.uk/images/takeover/", "bruteforceseo.com/affiliates/", "bruteforcesocialmedia.com/affiliates/", "btguard.com/images/", "bubbles-uk.com/banner/", "burst.net/aff/", "businessnewswatch.ca/images/nnwbanner/", "buyhatke.com/widgetBack/", "buzznet.com/topscript.js.php", "cachefly.net/cricad.html", "cactusvpn.com/images/affiliates/", "cal-one.net/ellington/search_form.php", "cal-one.net/ellington/deals_widget.php", "camelmedia.net/thumbs/", "cancomdigital.com/resourcecenter/", "carbiz.in/affiliates-and-partners/", "careerjunction.co.za/widgets/", "careerwebsite.com/distrib_pages/jobs.cfm", "carfax.com/img_myap/", "cashmyvideo.com/images/cashmyvideo_banner.gif", "castasap.com/publi2.html", "casti.tv/adds/", "cbpirate.com/getimg.php", "cccam.co/banner_big.gif", "cdn.cdncomputer.com/js/main.js", "cdn.ndparking.com/js/init.min.js", "cdn.sweeva.com/images/", "cdn77.org/tags/", "cdnpark.com/scripts/js3.js", "cdnprk.com/scripts/js3caf.js", "cdnprk.com/scripts/js3.js", "cdnservices.net/megatag.js", "centralscotlandjoinery.co.uk/images/csj-125.gif", "centrora.com//store/image/", "cex.io/informer/", "cex.io/img/b/", "cfcdn.com/showcase_sample/search_widget/", "cgmlab.com/tools/geotarget/custombanner.js", "chacsystems.com/gk_add.html", "chriscasconi.com/nostalgia_ad.", "cimg.in/images/banners/", "citygridmedia.com/ads/", "clickandgo.com/booking-form-widget", "clickiocdn.com/t/common_", "clicksure.com/img/resources/banner_", "clipdealer.com/", "cloudbet.com/ad/", "cloudfront.net/tie.js", "cloudfront.net/scripts/js3caf.js", "cloudfront.net/st.js", "cloudfront.net/dfpd.js", "cloudfront.net/nimblebuy/", "cloudfront.net/prod-global-", "cloudfront.net/", "cloudzer.net/ref/", "cngroup.co.uk/service/creative/", "cnnewmedia.co.uk/locker/", "codeartlove.com/clients/", "coinmama.com/assets/img/banners/", "complexmedianetwork.com/js/cmnUNT.js", "comx-computers.co.za/banners/", "conduit.com//banners/", "connatix.com/min/connatix.renderer.infeed.min.js", "consolpub.com/weatherwindow/", "content.ad/GetWidget.aspx", "conversionplanet.com/published/feeds/", "couptopia.com/affiliate/", "cpmstar.com/view.aspx", "cpmstar.com/cached/", "cq.com/pub/", "crowdsavings.com/r/banner/", "cruiseline.com/widgets/", "cruisesalefinder.co.nz/affiliates.html", "crunchyroll.com/awidget/", "cts.tradepub.com/cts4/", "cursecdn.com/shared-assets/current/anchor.js", "cursecdn.com/banner/", "customcodebydan.com/images/banner.gif", "cut-win.com/img/banners/", "cuteonly.com/banners.php", "d1wa9546y9kg0n.cloudfront.net/index.js", "d2kbaqwa2nt57l.cloudfront.net/br", "d2kbaqwa2nt57l.cloudfront.net/", "d33t3vvu2t2yu5.cloudfront.net/pub/", "dapatwang.com/images/banner/", "datafeedfile.com/widget/readywidget/", "datakl.com/banner/", "dawanda.com/widget/", "dealextreme.com/affiliate_upload/", "dealtoday.com.mt/banners/", "desi4m.com/desi4m.gif", "deskbabes.com/ref.php", "desperateseller.co.uk/affiliates/", "detroitmedia.com/jfry/", "devil-bet.com/banner/", "digitalmediacommunications.com/belleville/employment/", "digitalsatellite.tv/banners/", "disqus.com/listPromoted", "domainapps.com/assets/img/domain-apps.gif", "domaingateway.com/js/redirect-min.js", "domainnamesales.com/return_js.php", "dorabet.com/banner/", "dot.tk/urlfwd/searchbar/bar.html", "dotz123.com/run.php", "download-provider.org/", "download.bitdefender.com/resources/media/", "dramafever.com/widget/", "dramafeverw2.appspot.com/widget/", "dreamboxcart.com/earning/", "dreamhost.com/rewards/", "dreamstime.com/banner/", "dreamstime.com/refbanner-", "dreamstime.com/img/badges/banner", "droidnetwork.net/img/dt-atv160.jpg", "droidnetwork.net/img/vendors/", "dttek.com/sponsors/", "duckduckgo.com/m.js", "duckduckgo.com/share/spice/amazon/", "duckduckgo.com/i.js", "duckduckgo.com/y.js", "duckduckgo.com/public/", "dunhilltraveldeals.com/iframes/", "dvdfab.com/images/fabnewbanner/", "dx.com/affiliate/", "dynw.com/banner", "e-tailwebstores.com/accounts/default1/banners/", "e-webcorp.com/images/", "easy-share.com/images/es20/", "easyretiredmillionaire.com/img/aff-img/", "eattoday.com.mt/widgets/", "ebaycommercenetwork.com/publisher/", "ebaystatic.com/aw/signin/ebay-signin-toyota-", "eholidayfinder.com/images/logo.gif", "elenasmodels.com/cache/cb_", "elliottwave.com/fw/regular_leaderboard.js", "eltexonline.com/contentrotator/", "emailcashpro.com/images/", "emsisoft.com/bnr/", "emsservice.de.s3.amazonaws.com/videos/", "enticelabs.com/el/", "epimg.net/js/pbs/", "eplreplays.com/wl/", "essayerudite.com/images/banner/", "etimg.com/js_etsub/", "etoolkit.com/banner/", "exoplanetwar.com/l/landing.php", "expekt.com/affiliates/", "extabit.com/s/", "extensoft.com/artisteer/banners/", "extras.mercurynews.com/tapin_directory/", "extremereach.io/media/", "exwp.org/partners/", "eyetopics.com/content_images/", "facebook.com/audiencenetwork/", "fairfaxregional.com.au/proxy/commercial-partner-solar/", "familytreedna.com/img/affiliates/", "fancybar.net/ac/fancybar.js", "fantasyplayers.com/templates/banner_code.", "fapturbo.com/testoid/", "farm.plista.com/widgetdata.php", "farm.plista.com/tiny/", "farmholidays.is/iframeallfarmsearch.aspx", "fastcccam.com/images/fcbanner2.gif", "feedburner.com/~a/", "femalefirst.co.uk/widgets/", "filedownloader.net/design/", "filedroid.net/af_ta/", "filefactory.com/img/casinopilots/", "filejungle.com/images/banner/", "fileparadox.com/images/banner/", "filepost.com/static/images/bn/", "fileserve.com/images/banner_", "fileserver1.net/download", "filmehd.net/imagini/banner_", "filterforge.com/images/banners/", "firecenter.pl/banners/", "flashx.tv/img/downloadit.png", "flashx.tv/banner/", "flipchat.com/index.php", "flipkart.com/affiliateWidget/", "flixcart.com/affiliate/", "flower.com/img/lsh/", "followfairy.com/followfairy300x250.jpg", "footymad.net/partners/", "forms.aweber.com/form/styled_popovers_and_lightboxes.js", "forumimg.ipmart.com/swf/ipmart_forum/banner", "forumimg.ipmart.com/swf/img.php", "fragfestservers.com/bannerb.gif", "freakshare.com/banner/", "freakshare.com/", "freakshare.com/yild.js", "freakshare.net/banner/", "free-football.tv/images/usd/", "freetrafficsystem.com/fts/ban/", "freshbooks.com/images/banners/", "friedrice.la/widget/", "frogatto.com/images/", "fugger.netfirms.com/moa.swf", "funtonia.com/promo/", "fupa.com/aw.aspx", "futuboxhd.com/js/bc.js", "future.net.uk/hl-merchants.", "futuresite.register.com/us", "fxcc.com/promo/", "fxultima.com/banner/", "fyicentralmi.com/remote_widget", "fyiwashtenaw.com/remote_widget", "gadgets360.com/pricee/", "gamblingwages.com/images/", "gameduell.com/res/affiliate/", "gameorc.net/a.html", "gamer-network.net/plugins/dfp/", "gamersaloon.com/images/banners/", "gamesports.net/img/betting_campaigns/", "gamingjobsonline.com/images/banner/", "garudavega.net/indiaclicks/", "getadblock.com/images/adblock_banners/", "gethopper.com/tp/", "getnzb.com/img/partner/banners/", "getpaidforyourtime.org/basic-rotating-banner/", "getsurl.com/images/banners/", "giantrealm.com/saj/", "giffgaff.com/banner/", "glam.com/gad/", "glam.com/js/widgets/glam_native.act", "globalprocash.com/banner125.gif", "gold4rs.com/images/", "goldmoney.com/~/media/Images/Banners/", "google.com/pagead/", "googlesyndication.com/sadbundle/", "googlesyndication.com/safeframe/", "googlesyndication.com/pagead/", "googlesyndication.com/sodar/", "googlesyndication.com/ddm/", "googlesyndication.com/simgad/", "gooof.de/sa/", "gopjn.com/b/", "gopjn.com/i/", "gorgonprojectinvest.com/images/banners/", "govids.net/adss/", "graboid.com/affiliates/", "graduateinjapan.com/affiliates/", "grammar.coursekey.com/inter/", "grammarly.com/embedded", "grindabuck.com/img/skyscraper.jpg", "groupon.com/javascripts/common/affiliate_widget/", "grscty.com/images/banner/", "gsniper.com/images/", "guim.co.uk/guardian/thirdparty/tv-site/side.html", "guzzle.co.za/media/banners/", "halllakeland.com/banner/", "handango.com/marketing/affiliate/", "haymarket.net.au/Skins/", "heidiklein.com/media/banners/", "herald.ca/nfwebcam/", "hexero.com/images/banner.gif", "hide-my-ip.com/promo/", "highepcoffer.com/images/banners/", "hirepurpose.com/static/widgets/", "hitleap.com/assets/banner-", "hitleap.com/assets/banner.png", "hm-sat.de/b.php", "hola.org/play_page.js", "hostdime.com/images/affiliate/", "hostgator.com/~affiliat/cgi-bin/affiliates/", "hostinger.nl/banners/", "hostmonster.com/src/js/izahariev/", "hotcoursesabroad.com/widget-", "hotdeals360.com/static/js/kpwidgetweb.js", "hotelscombined.com/SearchBox/", "hoteltravel.com/partner/", "hotlink.cc/promo/", "hyipregulate.com/images/hyipregulatebanner.gif", "hyperfbtraffic.com/images/graphicsbanners/", "hyperscale.com/images/adh_button.jpg", "ibsrv.net/sponsor_images/", "ibsrv.net/sponsors/", "ibsrv.net/ForumSponsor/", "ibsrv.net/sidetiles/125x125/", "ibsys.com/sh/sponsors/", "ibvpn.com/img/banners/", "idealo.co.uk/priceinfo/", "idg.com.au/files/skins/", "ifriends.net/Refer.dll", "images-pw.secureserver.net/images/100yearsofchevy.gif", "criteo.net/images", "criteo.net/js/duplo", "criteo.net/design", "criteo.net/flash", "images.youbuy.it/images/", "imagetwist.com/lj.js", "imagetwist.com/banner/", "imgdino.com/gsmpop.js", "imgix.net/sponsors/", "imptestrm.com/rg-main.php", "in.com/common/script_catch.js", "in.com/addIframe/", "indeed.fr/ads/", "indochino.com/indo-ecapture-widget/", "infibeam.com/affiliate/", "infochoice.com.au/Handler/WidgetV2Handler.ashx", "infomarine.gr/images/banerr.gif", "inisrael-travel.com/jpost/", "instant-gaming.com/affgames/", "instantpaysites.com/banner/", "instaprofitgram.com/images/banners/", "integrityvpn.com/img/integrityvpn.jpg", "internetbrands.com/partners/", "interserver.net/logos/vps-", "intexchange.ru/Content/banners/", "intoday.in/microsites/sponsor/", "intoday.in/btstryad.html", "iobit.com/partner/", "ipixs.com/ban/", "iwebzoo.com/banner/", "jalbum.net/widgetapi/js/dlbutton.js", "jenningsforddirect.co.uk/sitewide/extras/", "jinx.com/content/banner/", "joblet.jp/javascripts/", "jobs-affiliates.ws/images/", "jrcdev.net/promos/", "jsrdn.com/s/1.js", "jubimax.com/banner_images/", "jugglu.com/content/widgets/", "junction.co.za/widget/", "justclicktowatch.to/jstp.js", "jvzoo.com/assets/widget/", "k-po.com/img/ebay.png", "k.co.il/iefilter.html", "kaango.com/fecustomwidgetdisplay", "keep2share.cc/images/i/", "keyword-winner.com/demo/images/", "kontera.com/javascript/lib/KonaLibInline.js", "kozmetikcerrahi.com/banner/", "l.yimg.com/ao/i/ad/", "l.yimg.com/mq/a/", "lastlocation.com/images/banner", "lawdepot.com/affiliate/", "leadintelligence.co.uk/in-text.js", "leadsleap.com/images/banner_", "leadsleap.com/widget/", "legaljobscentre.com/feed/jobad.aspx", "legitonlinejobs.com/images/", "lesmeilleurs-jeux.net/images/ban/", "lessemf.com/images/banner-", "letmewatchthis.ru/movies/linkbottom", "letters.coursekey.com/lettertemplates_", "lifedaily.com/prebid.js", "lifestyle24h.com/reward/", "lijit.com/delivery/", "lijit.com/adif_px.php", "linkconnector.com/traffic_record.php", "linkconnector.com/tr.php", "litecoinkamikaze.com/assets/images/banner", "literatureandlatte.com/gfx/buynowaffiliate.jpg", "liutilities.com/partners/", "liveperson.com/affiliates/", "localdata.eu/images/banners/", "loot.co.za/shop/product.jsp", "lotebo.com/js_a_d_s.php", "lottoelite.com/banners/", "lowbird.com/random/", "lowbird.com/lbpu.php", "lowbird.com/lbpun.php", "lowcountrymarketplace.com/widgets/", "ltfm.ca/stats.php", "lucky-ace-casino.net/banners/", "lucky-dating.net/banners/", "luckyshare.net/images/sda/", "luckyshare.net/images/2top.png", "luckyshare.net/images/1gotlucky.png", "luckyshare.net/images/banners/", "lumfile.com/lumimage/ourbanner/", "lygo.com/scripts/catman/", "lygo.com/d/toolbar/sponsors/", "lynku.com/partners/", "magicaffiliateplugin.com/img/mga-125x125.gif", "magicmembers.com/img/mgm-125x125", "magniwork.com/banner/", "mahndi.com/images/banner/", "mambaonline.com/clinic_button.", "mantisadnetwork.com/mantodea.min.js", "marinejobs.gr/images/marine_adv.gif", "mastiway.com/webimages/", "match.com/landing/", "matchbin.com/javascripts/remote_widget.js", "matrixmails.com/images/", "mazda.com.au/banners/", "mb-hostservice.de/banner_", "mcclatchyinteractive.com/creative/", "media.complex.com/videos/prerolls/", "media.domainking.ng/media/", "media.enimgs.net/brand/files/escalatenetwork/", "mediaon.com/moneymoney/", "mediaplex.com/ad/js/", "mediaplex.com/ad/fm/", "mediaplex.com/ad/bn/", "megalivestream.net/pub.js", "memepix.com/spark.php", "metroland.com/wagjag/", "mfcdn.net/store/spotlight/", "mgm.com/www/", "mightyape.co.nz/stuff/", "mightydeals.com/widgets/", "mightydeals.com/widget", "mightydeals.s3.amazonaws.com/md_adv/", "millionaires-club-international.com/banner/", "missnowmrs.com/images/banners/", "mkini.net/banners/", "mlive.com/js/oas/", "mmdcash.com/mmdcash01.gif", "mmosale.com/baner_images/", "mobyler.com/img/banner/", "mol.im/i/pix/ebay/", "moneycontrol.co.in/images/promo/", "moneycontrol.com/share-market-game/", "moneywise.co.uk/affiliate/", "moosify.com/widgets/explorer/", "mrc.org/sites/default/files/uploads/images/Collusion_Banner", "musicmemorization.com/images/", "mybdhost.com/imgv2/", "mydownloader.net/banners/", "myezbz.com/marketplace/widget/", "myfreeresources.com/getimg.php", "myfreeshares.com/120x60b.gif", "myhpf.co.uk/banners/", "mylife.com/partner/", "mynativeplatform.com/pub2/", "mytrafficstrategy.com/images/", "myusenet.net/promo.cgi", "n.nu/banner.js", "namecheap.com/graphics/linkus/", "nanobrokers.com/img/banner_", "nativly.com/tds/widget", "neogames-tech.com/resources/genericbanners/", "nesgamezone.com/syndicate", "netdigix.com/google_banners/", "nettvplus.com/images/banner_", "newware.net/home/newware-sm.png", "newware.net/home/banner", "nimblecommerce.com/widget.action", "nitroflare.com/img/banners/", "nitropdf.com/graphics/promo/", "nlsl.about.com/img", "nster.com/tpl/this/js/popnster.js", "nude.mk/images/", "nwadealpiggy.com/widgets/", "oasap.com/images/affiliate/", "obox-design.com/affiliate-banners/", "ocp.cbs.com/pacific/request.jsp", "offers.lendingtree.com/splitter/", "office.eteachergroup.com/leads/", "oilofasia.com/images/banners/", "ojooo.com/register_f/", "onecache.com/banner_", "onegameplace.com/iframe.php", "origin.getprice.com.au/widgetnewssmall.aspx", "origin.getprice.com.au/WidgetNews.aspx", "osobnosti.cz/images/casharena_", "ouo.io/images/banners/", "ouo.io/js/pop.", "outdoorhub.com/js/_bookends.min.js", "overseasradio.com/affbanner.php", "ovpn.to/ovpn.to/banner/", "oxygenboutique.com/Linkshare/", "p.pw/banners/", "paidinvite.com/promo/", "partners.dogtime.com/network/", "paytel.co.za/code/ref", "payza.com/images/banners/", "pcmall.co.za/affiliates/", "pdl.viaplay.com/commercials/", "pearlriverusa.com/images/banner/", "perfectmoney.com/img/banners/", "ph.hillcountrytexas.com/imp.php", "phonephotographytricks.com/images/banners/", "pianobuyer.com/pianoworld/", "pianoteq.com/images/banners/", "pic.pbsrc.com/hpto/", "picoasis.net/3xlayer.htm", "pjatr.com/b/", "pjatr.com/i/", "pjtra.com/i/", "pjtra.com/b/", "play-asia.com/paos-", "playbitcoingames.com/images/banners/", "playfooty.tv/jojo.html", "plexidigest.com/plexidigest-300x300.jpg", "pnet.co.za/jobsearch_iframe_", "pntra.com/b/", "pntra.com/i/", "pntrac.com/b/", "pntrac.com/i/", "pntrs.com/b/", "pntrs.com/i/", "pokerjunkie.com/rss/", "pokerstars.com/euro_bnrs/", "popeoftheplayers.eu/ad", "pornturbo.com/tmarket.php", "ppc-coach.com/jamaffiliates/", "premium-template.com/banner/", "press-start.com/affgames/", "presscoders.com/wp-content/uploads/misc/aff/", "pricegrabber.com/mlink.php", "pricegrabber.com/export_feeds.php", "pricegrabber.com/cb_table.php", "pricegrabber.com/mlink3.php", "primeloopstracking.com/affil/", "print2webcorp.com/widgetcontent/", "privatewifi.com/swf/banners/", "prizerebel.com/images/banner", "propgoluxury.com/partners/", "proxies2u.com/images/btn/", "proxify.com/i/", "proxy.org/blasts.gif", "proxy.org/af.html", "proxy.org/ah.html", "proxynoid.com/images/referrals/", "proxyroll.com/proxybanner.php", "proxysolutions.net/affiliates/", "puntersparadise.com.au/banners/", "purevpn.com/affiliates/", "putlocker.com/images/banners/", "qualoo.net/now/interstitial/", "quirk.biz/webtracking/", "racebets.com/media.php", "radiocentre.ca/randomimages/", "radioreference.com/i/p4/tp/smPortalBanner.gif", "radioreference.com/sm/300x75_v3.jpg", "radiotown.com/bg/", "rapidgator.net/images/banners/", "rapidgator.net/images/pics/button.png", "rapidgator.net/images/pics/", "rapidgator.net/images/pics/729x91_", "rapidjazz.com/banner_rotation/", "ratecity.com.au/widgets/", "ratesupermarket.ca/widgets/", "rbth.ru/widget/", "readme.ru/informer/", "red-tube.com/dynbanner.php", "redbeacon.com/widget/", "redflagdeals.com/dealoftheday/widgets/", "regnow.com/vendor/", "rehost.to/", "relink.us/js/ibunkerslide.js", "relink.us/images/", "resources.heavenmedia.net/selection.php", "rewards1.com/images/referralbanners/", "roadrecord.co.uk/widget.js", "roshansports.com/iframe.php", "roshantv.com/adad.", "runerich.com/images/sty_img/runerich.gif", "russian-dreams.net/static/js/", "s3.amazonaws.com/draftset/banners/", "safarinow.com/affiliate-zone/", "salemwebnetwork.com/Stations/images/SiteWrapper/", "sat-shop.co.uk/images/", "satshop.tv/images/banner/", "schurzdigital.com/deals/widget/", "sciencecareers.org/widget/", "sciremedia.tv/images/banners/", "scoffopedia.com/images/banner", "scoopdragon.com/images/Goodgame-Empire-MPU.jpg", "scribol.com/broadspring.js", "scribol.com/txwidget", "searchportal.information.com/", "seatplans.com/widget|", "secondspin.com/twcontent/", "secureupload.eu/gfx/SecureUpload_Banner.png", "secureupload.eu/banners/", "secureupload.eu/images/wpman_", "secureupload.eu/js/poad.js", "secureupload.eu/images/soundcloud_", "seedsman.com/affiliate/", "selectperformers.com/images/a/", "selectperformers.com/images/elements/bannercolours/", "server4.pro/images/banner.jpg", "serverjs.net/scripts/", "service.smscoin.com/js/sendpic.js", "sfimg.com/images/banners/", "sfimg.com/SFIBanners/", "sfm-offshore.com/images/banners/", "shareasale.com/image/", "shareflare.net/images/", "shariahprogram.ca/banners/", "sharingzone.net/images/banner", "shink.in/js/script.js", "shop-top1000.com/images/", "shopbrazos.com/widgets/", "shopping.com/sc/pac/sdc_widget_v2.0_proxy.js", "shorte.st/link-converter.min.js", "shows-tv.net/codepopup.js", "sidekickunlock.net/banner/", "singlehop.com/affiliates/", "singlemuslim.com/affiliates/", "sis.amazon.com/iu", "sisters-magazine.com/iframebanners/", "site5.com/creative/", "sitegiant.my/affiliate/", "skydsl.eu/banner/", "slysoft.com/img/banner/", "smartasset.com/embed.js", "smartdestinations.com/ai/", "smilepk.com/bnrsbtns/", "snacktools.net/bannersnack/", "socialmonkee.com/images/", "socialorganicleads.com/interstitial/", "softneo.com/popup.js", "speedtv.com.edgesuite.net/img/monthly/takeovers/", "speedtv.com.edgesuite.net/img/static/takeovers/", "spilcdn.com/vda/css/sgadfamily.css", "spilcdn.com/vda/css/sgadfamily2.css", "spilcdn.com/vda/vendor/flowplayer/ova.swf", "splashpagemaker.com/images/", "sponsorandwin.com/images/banner-", "sportingbet.com.au/sbacontent/puntersparadise.html", "sportsdigitalcontent.com/betting/", "spot.im/yad/", "sproutnova.com/serve.php", "ssshoesss.ro/banners/", "stacksocial.com/bundles/", "stargames.com/bridge.asp", "static.criteo.com/flash", "static.criteo.com/design", "static.criteo.com/images", "static.criteo.com/js/duplo", "static.criteo.net/images", "static.criteo.net/flash", "static.criteo.net/design", "static.criteo.net/js/duplo", "static.multiplayuk.com/images/w/w-", "static.plista.com/tiny/", "static.plista.com/upload/videos/", "static.plista.com/jsmodule/flash|", "static.tumblr.com/dhqhfum/WgAn39721/cfh_header_banner_v2.jpg", "staticbucket.com/boost//Scripts/libs/flickity.js", "storage.to/affiliate/", "streamtheworld.com/ondemand/creative", "stuff.com/javascripts/more-stuff.js", "supersport.com/content/2014_Sponsor", "supersport.com/content/Sponsors", "surf100sites.com/images/banner_", "surveymonkey.com/jspop.aspx", "sweed.to/affiliates/", "sweed.to/", "sweetwater.com/feature/", "sweeva.com/widget.php", "synapsys.us/widgets/dynamic_widget/", "synapsys.us/widgets/chatterbox/", "syndication.visualthesaurus.com/std/vtad.js", "take2.co.za/misc/bannerscript.php", "tankionline.com/tankiref.swf", "tcmwebcorp.com/dtm/tc_global_dtm_delivery.js", "techbargains.com/scripts/banner.js", "techbargains.com/inc_iframe_deals_feed.cfm", "techkeels.com/creatives/", "tedswoodworking.com/images/banners/", "textlinks.com/images/banners/", "thaiforlove.com/userfiles/affb-", "thatfreething.com/images/banners/", "theatm.info/images/", "thebloggernetwork.com/demandfusion.js", "thefreesite.com/nov99bannov.gif", "themes420.com/bnrsbtns/", "themify.me/banners/", "themis-media.com/media/global/images/cskins/", "thereadystore.com/affiliate/", "theseblogs.com/visitScript/", "theseforums.com/visitScript/", "theselfdefenseco.com/", "ticketkai.com/banner/", "ticketmaster.com/promotionalcontent/", "timesinternet.in/ad/", "tmbattle.com/images/promo_", "toksnn.com/ads/", "tonefuse.s3.amazonaws.com/clientjs/", "top5result.com/promo/", "topmedia.com/external/", "topservers200.com/img/banners/", "toptenreviews.com/flash/", "toptenreviews.com/w/af_widget.js", "toptenreviews.com/r/c/", "torguard.net/images/aff/", "tosol.co.uk/international.php", "toysrus.com/graphics/promo/", "tradeboss.com/1/banners/", "travel-assets.com/ads/", "treatme.co.nz/Affiliates/", "tremorhub.com/pubsync", "trialfunder.com/banner/", "trivago.co.uk/uk/srv/", "tshirthell.com/img/affiliate_section/", "ttgtmedia.com/Marketing/", "ttt.co.uk/TMConverter/", "turbobit.net/ref/", "turbobit.net/js/acontrol.js", "turbobit.net/pics/7z1xla23ay_", "turbobit.net/oexktl/muzebra_", "turbobit.net/refers/", "turbobit.net/platform/js/lib/pus/", "twivert.com/external/banner234x60.", "u-loader.com/image/hotspot_", "ukcast.tv/adds/", "ukrd.com/images/icons/itunes.png", "ukrd.com/images/icons/amazon.png", "ultimatewebtraffic.info/images/fbautocash", "united-domains.de/parking/", "unsereuni.at/resources/img/", "upload2.com/upload2.html", "uploaded.net/img/public/", "uploaded.to/img/public/", "uploaded.to/js/layer.js", "uploaded.to/img/e/ad/", "urtig.net/scripts/js3caf.js", "userscloud.com/sw.js", "userscloud.com/images/banners/", "userscloud.com/js/vendor/core/bootstrap.js", "usersfiles.com/images/72890UF.png", "usfine.com/images/sty_img/usfine.gif", "ussearch.com/preview/banner/", "valuechecker.co.uk/banners/", "vast.videe.tv/vast-proxy/", "vcnewsdaily.com/images/vcnews_right_banner.gif", "viagogo.co.uk/feeds/widget.ashx", "videoweed.es/js/aff.js", "vidible.tv/prod/tags/", "vidible.tv/placement/vast/", "vidyoda.com/fambaa/chnls/ADSgmts.ashx", "viglink.com/api/batch", "viglink.com/api/widgets/offerbox.js", "viglink.com/api/optimize", "viglink.com/api/products", "viglink.com/images/pixel.gif", "viglink.com/api/insert", "vipfile.cc/images/", "viralize.tv/vast/", "virool.com/widgets/", "virtuagirl.com/ref.php", "virtuaguyhd.com/ref.php", "visitorboost.com/images/", "vitabase.com/images/relationships/", "vittgam.net/images/b/", "vpnarea.com/affiliate/", "vpntunnel.se/aff/", "vpnxs.nl/images/vpnxs_banner", "vrvm.com/t", "vultr.com/media/banner_", "vuukle.com/affinity.", "vxite.com/banner/", "wagital.com/Wagital-Ads.html", "warezhaven.org/warezhavenbann.jpg", "warrantydirect.co.uk/widgets/", "washingtonpost.com/wp-srv/wapolabs/dw/readomniturecookie.html", "washingtonpost.com/wp-srv/javascript/piggy-back-on-ads.js", "watch-free-movie-online.net/adds-", "watch-naruto.tv/images/", "web2feel.com/images/", "webdev.co.zw/images/banners/", "webgains.com/link.html", "webmasterrock.com/cpxt_pab", "whistleout.com.au/imagelibrary/ads/wo_skin_", "whistleout.com/Widgets/", "widgeo.net/popup.js", "widget.engageya.com/engageya_loader.js", "wildamaginations.com/mdm/banner/", "windcdna.com/api/banner/", "windycitymediagroup.com/gayandlesbianimages/", "winpalace.com/", "winsms.co.za/banner/", "wishlistproducts.com/affiliatetools/", "wm.co.za/24com.php", "wm.co.za/wmjs.php", "wonderlabs.com/affiliate_pro/banners/", "worldnow.com/images/incoming/RTJ/rtj201303fall.jpg", "worldofjudaica.com/static/show/external/", "worldofjudaica.com/products/dynamic_banner/", "wpzoom.com/images/aff/", "wtprn.com/sponsors/", "wupload.com/referral/", "wupload.com/images/banners/", "x3cms.com/ads/", "xcams.com/livecams/pub_collante/script.php", "xml.exactseek.com/cgi-bin/js-feed.cgi", "xproxyhost.com/images/banners/", "yimg.com/gs/apex/mediastore/", "yimg.com/gemini/pr/video_", "you-cubez.com/images/banners/", "youinsure.co.za/frame/", "zazzle.com/utl/getpanel", "zergnet.com/zerg-inf.js", "zeusfiles.com/promo/", "ziffdavisenterprise.com/contextclicks/", "ziffprod.com/CSE/BestPrice", "ziffstatic.com/jst/zdvtools.", "ziffstatic.com/jst/zdsticky.", "zip2save.com/widget.php", "204.140.25.247/ads/", "213.174.130.10/banners/", "213.174.130.8/banners/", "213.174.130.9/banners/", "213.174.140.76/js/showbanner4.js", "4tube.com/sw4tube.js", "4tube.com/assets/adn-", "4tube.com/iframe/", "4tube.com/mojon.js", "4tube.com/tb/banner/", "4tube.com/assets/adf-", "4tube.com/assets/abpe-", "4tube.com/assets/padb-", "88.85.77.94/rotation/", "adultfax.com/service/vsab.php", "adultfriendfinder.com/piclist", "adultfriendfinder.com/images/banners/", "adultfriendfinder.com/go/", "adultfriendfinder.com/javascript/", "adultporntubemovies.com/images/banners/", "aebn.net/banners/", "aebn.net/feed/", "allanalpass.com/visitScript/", "alt.com/go/", "amarotic.com/rotation/layer/chatpage/", "amarotic.com/Banner/", "amateurseite.com/banner/", "ambya.com/potdc/", "animalsexfun.com/baner/", "asianbutterflies.com/potd/", "asktiava.com/promotion/", "assinclusive.com/cyonix.html", "assinclusive.com/linkstxt2.html", "avatraffic.com/b/", "spacash.com/tools/peel/", "spacash.com/popup/", "spacash.com//v2bannerview.php", "bigmovies.com/images/banners/", "blackbrazilianshemales.com/bbs/banners/", "bongacams.com/promo.php", "bongacash.com/tools/promo.php", "bongacash.com/promo.php", "bongacash.com/dynamic_banner/", "brasileirinhas.com.br/banners/", "brazzers.com/ads/", "bullz-eye.com/pictureofday/", "cams.com/go/", "cams.com/p/cams/cpcs/streaminfo.cgi", "camsoda.com/promos/", "camsrule.com/exports/", "chaturbate.com/creative/", "chaturbate.com/affiliates/", "clipjunkie.com/sftopbanner", "closepics.com/media/banners/", "cmix.org/teasers/", "cockfortwo.com/track/", "creamgoodies.com/potd/", "crocogirls.com/croco-new.js", "ddfcash.com/iframes/", "devilgirls.co/images/devil.gif", "devilgirls.co/pop.js", "dom2xxx.com/ban/", "downloadsmais.com/imagens/download-direto.gif", "dvdbox.com/promo/", "eliterotica.com/images/banners/", "erotikdeal.com/", "escortbook.com/banner_", "escortforum.net/images/banners/", "eurolive.com/index.php", "eurolive.com/", "evilangel.com/static/", "exposedemos.com/track/", "exposedteencelebs.com/banner/", "extremeladyboys.com/elb/banners/", "f5porn.com/porn.gif", "fastcdn.me/mlr/", "fastcdn.me/js/snpp/", "fckya.com/lj.js", "femjoy.com/bnrs/", "fleshlight.com/images/banners/", "fleshlight.com/images/peel/", "freebbw.com/webcams.html", "freeporn.hu/banners/", "freshnews.su/get_tizers.php", "gagthebitch.com/track/", "gammasites.com/pornication/pc_browsable.php", "gfrevenge.com/vbanners/", "girls-home-alone.com/dating/", "girlsfuck-tube.com/js/aobj.js", "go2cdn.org/brand/", "hardbritlads.com/banner/", "hdpornphotos.com/images/728x180_", "hdpornphotos.com/images/banner_", "hentaikey.com/images/banners/", "highrollercams.com/widgets/", "hodun.ru/files/promo/", "homoactive.tv/banner/", "hornypharaoh.com/banner_", "hostave3.net/hvw/banners/", "hosted.x-art.com/potd", "hosting24.com/images/banners/", "hotcaracum.com/banner/", "hotkinkyjo.xxx/resseler/banners/", "hotmovies.com/custom_videos.php", "ihookup.com/configcreatives/", "images.elenasmodels.com/Upload/", "imageteam.org/upload/big/2014/06/22/53a7181b378cb.png", "interracialbangblog.info/banner.jpg", "just-nude.com/images/ban_", "justcutegirls.com/banners/", "kau.li/yad.js", "kuntfutube.com/kellyban.gif", "kuntfutube.com/bgbb.gif", "lacyx.com/images/banners/", "ladyboygoo.com/lbg/banners/", "latinteencash.com/potd/", "lb-69.com/pics/", "longmint.com/lm/banners/", "lucasentertainment.com/banner/", "magazine-empire.com/images/pornstarad.jpg", "manhunt.net/", "mrskin.com/data/mrskincash/", "mrskin.com/affiliateframe/", "mrvids.com/network/", "mtoon.com/banner/", "my-dirty-hobby.com/", "mycams.com/freechat.php", "myexposedgirlfriendz.com/pop/popuppp.js", "myexposedgirlfriendz.com/pop/popuprk.js", "myfreakygf.com/www/click/", "mykocam.com/js/feeds.js", "mysexjourney.com/revenue/", "naked.com/promos/", "nakedshygirls.com/bannerimg/", "nakedswordcashcontent.com/videobanners/", "natuko-miracle.com/banner/", "naughtycdn.com/public/iframes/", "netvideogirls.com/adultfyi.jpg", "nubiles.net/webmasters/promo/", "nude.hu/html/", "nude.hu/banners/", "nudemix.com/widget/", "odnidoma.com/ban/", "openadultdirectory.com/banner-", "orgasmtube.com/js/superP/", "otcash.com/images/", "paydir.com/images/bnr", "pinkvisualgames.com/", "plugin-x.com/rotaban/", "pokazuwka.com/popu/", "pop6.com/banners/", "porn2blog.com/wp-content/banners/", "pornravage.com/notification/", "prettyincash.com/premade/", "privatamateure.com/promotion/", "private.com/banner/", "privatehomeclips.com/privatehomeclips.php", "punterlink.co.uk/images/storage/siteban", "pussycash.com/content/banners/", "pussysaga.com/gb/", "putana.cz/banners/", "rabbitporno.com/friends/", "rabbitporno.com/iframes/", "rawtubelive.com/exports/", "realitykings.com/vbanners/", "rexcams.com/misc/iframes_new/", "rotci.com/images/rotcibanner.png", "ruscams.com/promo/", "russkoexxx.com/ban/", "sakuralive.com/dynamicbanner/", "scoreland.com/banner/", "sexgangsters.com/sg-banners/", "sextronix.com/b/", "sextronix.com/images/", "sextubepromo.com/ubr/", "sexycams.com/exports/", "share-image.com/borky/", "shemale.asia/sma/banners/", "shemalenova.com/smn/banners/", "shinypics.com/blogbanner/", "simonscans.com/banner/", "sleepgalleries.com/recips/", "slickcash.com/flash/subtitles_", "smartmovies.net/promo_", "smyw.org/smyw_anima_1.gif", "snrcash.com/profilerotator/", "sponsor4cash.de/script/", "streamen.com/exports/", "streamray.com/images/cams/flash/cams_live.swf", "swurve.com/affiliates/", "teendaporn.com/rk.js", "theporndude.com/img/planetsuzy.png", "thrixxx.com/scripts/show_banner.php", "tlavideo.com/affiliates/", "ts.videosz.com/iframes/", "turbolovervidz.com/fling/", "twiant.com/img/banners/", "updatetube.com/js/adpupdatetube", "updatetube.com/updatetube_html/", "updatetube.com/js/fab.js", "updatetube.com/iframes/", "upsellit.com/custom/", "uramov.info/wav/wavideo.html", "vidz.com/promo_banner/", "vigrax.pl/banner/", "virtualhottie2.com/cash/tools/banners/", "visit-x.net/promo/", "vs3.com/_special/banners/", "vzzk.com/uploads/banners/", "wafflegirl.com/galleries/banner/", "watchmygf.com/preview/", "webcams.com/js/im_popup.php", "webcams.com/misc/iframes_new/", "wendi.com/ipt/", "wetandpuffy.com/galleries/banners/", "winkit.info/wink2.js", "xcabin.net/b/", "xlgirls.com/banner/", "xtrasize.pl/banner/", "xxxoh.com/number/", "yamvideo.com/pop1/", "yplf.com/ram/files/sponsors/", "0-60mag.com/js/takeover-2.0/", "10-fast-fingers.com/quotebattle-ad.png", "100best-free-web-space.com/images/ipage.gif", "104.239.139.5/display/", "1071radio.com//wp-content/banners/", "1071thepeak.com/right/", "11points.com/images/slack100.jpg", "1320wils.com/assets/images/promo%20banner/", "1337x.to/js/script.js", "1337x.to/sw.js", "1340wcmi.com/images/banners/", "1430wnav.com/images/300-", "1430wnav.com/images/468-", "1590wcgo.com/images/banners/", "1776coalition.com/wp-content/plugins/sam-images/", "180upload.com/pir/729.js", "180upload.com/p1.js", "1movies.to/site/videoroller", "1up.com/scripts/takeover.js", "1up.com/vip/vip_games.html", "22lottery.com/images/lm468", "2ca.com.au/images/banners/", "2cc.net.au/images/banners/", "2flashgames.com/img/nfs.gif", "2merkato.com/images/banners/", "2mfm.org/images/banners/", "2oceansvibe.com/", "2pass.co.uk/img/avanquest2013.gif", "3dsemulator.org/img/download.png", "3dwallpaperstudio.com/hd_wallpapers.png", "3g.co.uk/fad/", "3pmpickup.com.au/images/kmart_v2.jpg", "4chan.org/support/", "4downfiles.com/open1.js", "4fastfile.com/afiliat.png", "4shared.com/images/label1.gif", "4sharedtrend.com/ifx/ifx.php", "560theanswer.com/upload/sponsor-", "5star-shareware.com/scripts/5starads.js", "64.245.1.134/search/v2/jsp/pcwframe.jsp", "6waves.com/aff.php", "88.80.16.183/streams/counters/", "8a.nu/sponsors/", "8a.nu/site2/sponsors/", "8ch.net/proxy.php", "911tabs.com/img/bgd_911tabs_", "911tabs.com/img/takeover_app_", "947fm.bb/images/banners/", "977music.com/index.php", "977rocks.com/images/300-", "980wcap.com/sponsorlogos/", "a7.org/info/", "aaugh.com/images/dreamhostad.gif", "abook.ws/banner6.png", "abook.ws/pyload.png", "abook.ws/th_mydl.gif", "aboutmyarea.co.uk/images/imgstore/", "aboutmyip.com/images/Ad0", "aboutmyip.com/images/SynaManBanner.gif", "abovetopsecret.com/images/plexidigest-300x300.jpg", "abovetopsecret.com/160_", "abovetopsecret.com/300_", "abovetopsecret.com/728_", "abusewith.us/banner.gif", "acidcow.com/banners.php", "acs86.com/a.htm", "actressarchives.com/takeover/", "adaderana.lk/banners/", "adelaidecityfc.com.au/oak.swf", "adirondackmtnclub.com/images/banner/", "adpaths.com/_aspx/cpcinclude.aspx", "adpost.com/rectserver.g.", "adpost.com/skyserver.g.", "adpost.com/bannerserver.g.", "hulu.com/v3/revenue/", "adsl2exchanges.com.au/images/spintel", "adv.li/ads/", "advfn.com/tf_", "advpc.net/site_img/banner/", "aerotime.aero/upload/banner/", "aetv.com/includes/dart/", "africanbusinessmagazine.com/images/banners/", "afternoondc.in/banners/", "agriculturalreviewonline.com/images/banners/", "ahk-usa.com/uploads/tx_bannermanagement/", "akiba-online.com/forum/images/bs.gif", "akinator.com/publicite_", "akipress.com/_ban/", "akipress.org/ban/", "akipress.org/bimages/", "alachuacountytoday.com/images/banners/", "alarabiya.net/dms/takeover/", "alaska-native-news.com/files/banners/", "alatest.co.uk/banner/", "alatest.com/banner/", "alibi.com/", "all4divx.com/js/jscode2.js", "allghananews.com/images/banners/", "allmovieportal.com/dynbanner.", "allmyvideos.net/player/ova-jw.swf", "allmyvideos.net/js/ad_", "allsp.ch/feeder.php", "altdaily.com/images/banners/", "alternet.org/givememygfp.", "amazingmoneymagnet.com//upload/banners/", "americanangler.com/images/banners/", "americanfreepress.net/assets/images/Banner_", "amnesty.ca/images/banners/", "anamera.com/DesktopModules/BannerDisplay/", "anchorfree.com/delivery/", "andr.net/banners/", "angloinfo.com/sponsor/", "anhits.com/files/banners/", "anilinkz.com/img/leftsponsors.", "anilinkz.com/img/rightsponsors", "animationxpress.com/anex/solutions/", "animationxpress.com/anex/crosspromotions/", "anime1.com/service/joyfun/", "anime44.com/images/videobb2.png", "anime44.com/anime44box.jpg", "animea.net/do/", "animeflavor.com/animeflavor-gao-gamebox.swf", "animeflv.net/cpm.html", "animefushigi.com/boxes/", "animeshippuuden.com/adcpm.js", "animeshippuuden.com/square.php", "annistonstar.com/leaderboard_banner", "anonib.com/zimages/", "anonytext.tk/img/paste-eb.png", "anonytext.tk/img/paste-sponsor.png", "anonytext.tk/re.php", "answerology.com/index.aspx", "anti-leech.com/al.php", "anti-scam.org/abanners/", "apanews.net/pub/", "apcointl.org/images/corporate_partners/", "appleinsider.com/macmall", "applifier.com/bar.htm", "appspot.com/adop/", "ar15.com/biz/", "ar15.com/images/highlight/", "aravot.am/banner/", "archeagedatabase.net/images/okaygoods.gif", "armenpress.am/static/add/", "armorgames.com/backup_", "armslist.com/images/sponsors/", "arnnet.com.au/files/skins/", "aroundosceola.com/banner-", "arsenal-mania.com/images/backsplash_", "arstechnica.net/public/shared/scripts/da-", "artima.com/zcr/", "asianewsnet.net/banner/", "asianfanfics.com/sponsors/", "ask.com/display.html", "ask.com/fifdart", "askandyaboutclothes.com/images/", "astalavista.com/avtng/", "astronomy.com/sitefiles/overlays/overlaygenerator.aspx", "astronomynow.com/wp-content/promos/", "atdhe.ws/pp.js", "atimes.com/banner/", "attitude.co.uk/images/Music_Ticket_Button_", "attorrents.com/static/images/download3.png", "auto123.com/sasserve.spy", "autosport.com/skinning/", "autosport.com/img/promo/", "aveherald.com/images/banners/", "avforums.com/images/skins/", "avitop.com/image/amazon/", "avitop.com/image/mig.gif", "avitop.com/image/mig-anim.gif", "avn.com/templates/avnav/skins/", "avn.com/delivery/", "avsforum.com/alliance/", "avstop.com/avbanner/", "azcentral.com/incs/dfp-refresh.php.inc", "b92.net/images/banners/", "babelzilla.org/images/banners/babelzilla-powerfox.png", "babelzilla.org/forum/images/powerfox-top.png", "babycenter.com/viewadvertorialpoll.htm", "backin.net/s/promo/", "backin.net/images/player_divx.png", "backpagelead.com.au/images/banners/", "bahamaslocal.com/img/banners/", "baixartv.com/img/bonsdescontos.", "bakercountypress.com/images/banners/", "baku2015.com/imgml/sponsor/", "ballerarcade.com/ispark/", "ballz.co.za/system-files/banners/", "barnesandnoble.com/promo/", "baseballamerica.com/plugs/", "bashandslash.com/images/banners/", "basinsradio.com/images/banners/", "bay.com.mt/images/banners/", "bay.com.mt/modules/mod_novarp/", "bayfiles.net/img/download-button-orange.png", "baymirror.com/static/js/4728ba74bc.js", "baymirror.com/static/img/bar.gif", "bazaraki.com/bannerImage.php", "bcvc.mobi/earn.php", "bcvc.mobi/go.php", "beforeitsnews.com/static/data/story-stripmall-new.html", "beforeitsnews.com/static/iframe/", "belfasttelegraph.co.uk/editorial/web/survey/recruit-div-img.js", "bellevision.com/belle/adds/", "bernama.com/banner/", "bestblackhatforum.com/images/my_compas/", "bestlistonline.info/link/ad.js", "bets4free.co.uk/content/5481b452d9ce40.09507031.jpg", "better-explorer.com/wp-content/uploads/2013/10/PoweredByNDepend.png", "better-explorer.com/wp-content/uploads/2013/07/hf.5.png", "better-explorer.com/wp-content/uploads/2012/09/credits.png", "bettingsports.com/top_bonuses", "bettingsports.com/where_to_bet", "bettyconfidential.com/media/fmads/", "bibme.org/images/grammarly/", "bigeddieradio.com/uploads/sponsors/", "bigpoint.com/xml/recommender.swf", "bigsports.tv/live/ado.php", "bikeforums.net/images/sponsors/", "bikeradar.com/media/img/commercial/", "binsearch.info/iframe.php", "bioinformatics.org/images/ack_banners/", "bit-tech.net/images/backgrounds/skin/", "bit.no.com/assets/images/bity.png", "bitminter.com/images/info/spondoolies", "bitreactor.to/sponsor/", "bizarremag.com/images/skin_", "blaauwberg.net/banners/", "blackberryforums.net/banners/", "blackcaps.co.nz/img/commercial-partners/", "blackchronicle.com/images/Banners-", "blackhatlibrary.net/hacktalk.png", "blacklistednews.com/images/July31stPRO.PNG", "blacklistednews.com/images/KFC.png", "blasternation.com/images/hearthstone.jpg", "bleacherreport.net/images/skins/", "blip.fm/ad/", "blitzdownloads.com/promo/", "blog.co.uk/script/blogs/afc.js", "blogevaluation.com/templates/userfiles/banners/", "blogorama.com/images/banners/", "blogsdna.com/wp-content/themes/blogsdna2011/images/advertisments.png", "blogspider.net/images/promo/", "bn0.com/4v4.js", "bolandrugby.com/images/sponsors.", "bom.gov.au/includes/marketing2.php", "botswanaguardian.co.bw/images/banners/", "boxbit.co.in/banners/", "boxlotto.com/banrotate.", "brandchannel.com/images/educationconference/", "breitlingsource.com/images/pflogo.jpg", "brenz.net/img/bannerrss.gif", "bristolairport.co.uk/~/media/images/brs/blocks/internal-promo-block-300x250/", "britishcolumbia.com/sys/ban.asp", "broadbandchoices.co.uk/aff.js", "broadbandforum.co/stock/", "broadcastify.com/sm/", "broadcastingworld.net/marquee-", "brobible.com/files/uploads/images/takeovers/", "brothersoft.com/softsale/", "brothersoft.com/gg/g.js", "brothersoft.com/gg/kontera_com.js", "brothersoft.com/gg/top.js", "brothersoft.com/gg/center_gg.js", "brothersoft.com/gg/soft_down.js", "browsershots.org/static/images/creative/", "brudirect.com/images/banners/", "bsmphilly.com/files/banners/", "bsvc.ebuddy.com/bannerservice/tabsaww", "bt-chat.com/images/affiliates/", "bt.am/banners/", "btdigg.org/images/btguard", "btkitty.com/static/images/880X60.gif", "btkitty.org/static/images/880X60.gif", "buy-n-shoot.com/images/banners/banner-", "buyselltrade.ca/banners/", "buzzintown.com/show_bnr.php", "bypassoxy.com/vectrotunnel-banner.gif", "c-ville.com/image/pool/", "c21media.net/wp-content/plugins/sam-images/", "c9tk.com/images/banner/", "caclubindia.com/campaign/", "cadplace.co.uk/banner/", "cafimg.com/images/other/", "caladvocate.com/images/banner-", "caledonianrecord.com/iFrame_", "caledonianrecord.com/SiteImages/HomePageTiles/", "caledonianrecord.com/SiteImages/Tile/", "calgaryherald.com/images/storysponsor/", "calgaryherald.com/images/sponsor/", "calguns.net/images/ads", "cameroon-concord.com/images/banners/", "cananewsonline.com/files/banners/", "cancomuk.com/campaigns/", "candystand.com/game-track.do", "capitalethiopia.com/images/banners/", "caravansa.co.za/images/banners/", "card-sharing.net/cccamcorner.gif", "card-sharing.net/umbrella.png", "card-sharing.net/topsharingserver.jpg", "cardomain.com/empty_pg.htm", "cardschat.com/pkimg/banners/", "carfinderph.com/files/banners/", "cargonewsasia.com/promotion/", "cars.com/js/cars/catretargeting.js", "cars.com/go/includes/targeting/", "carsuk.net/directory/panel-promo-", "cash9.org/assets/img/banner2.gif", "cast4u.tv/fku.php", "cast4u.tv/adshd.php", "castanet.net/clients/", "casualgaming.biz/banners/", "catalystmagazine.net/images/banners/", "catholicculture.org/images/banners/", "cbc.ca/deals/", "cbc.ca/video/bigbox.html", "cbn.co.za/images/banners/", "cbsinteractive.co.uk/cbsi/ads/", "cbslocal.com/rotatable", "cbslocal.com/deals/widget/", "cd1025.com/www/img/btn-", "cd1025.com/www/assets/a/", "cdcovers.cc/images/external/toolbar", "cdmagurus.com/img/kcpf2.swf", "cdmagurus.com/forum/cyberflashing.swf", "cdn-surfline.com/home/billabong-xxl.png", "cdn.free-power-point-templates.com/images/aff/", "ceforum.co.uk/images/misc/PartnerLinks", "celebstoner.com/assets/images/img/top/420VapeJuice960x90V3.gif", "celebstoner.com/assets/components/bdlistings/uploads/", "centos.org/donors/", "centralfm.co.uk/images/banners/", "ceoexpress.com/inc/ads", "cghub.com/files/CampaignCode/", "ch131.so/images/2etio.gif", "channel4fm.com/promotion/", "channel4fm.com/images/background/", "channel5.com/assets/takeovers/", "channelonline.tv/channelonline_advantage/", "chapala.com/wwwboard/webboardtop.htm", "checkpagerank.net/banners/", "checkwebsiteprice.com/images/bitcoin.jpg", "chelsey.co.nz/uploads/Takeovers/", "chicagodefender.com/images/banners/", "chinadaily.com.cn/s", "chinanews.com/gg/", "chinapost-track.com/images/pro/", "chronicle.lu/images/Sponsor_", "chronicle.lu/images/banners/", "cineplex.com/skins/", "ciol.com/zedotags/", "citationmachine.net/images/grammarly/", "citationmachine.net/images/gr_", "citeulike.org/static/campaigns/", "citizen-usa.com/images/banners/", "citywire.co.uk/wealth-manager/marketingcampaign", "cjr.org/interstitial_", "clarksvilleonline.com/cols/", "classic-tv.com/pubaccess.html", "classical897.org/common/sponsors/", "classicsdujour.com/artistbanners/", "clgaming.net/interface/img/sponsor/", "cloudyvideos.com/banner/", "clubhyper.com/images/hannantsbanner_", "cmpnet.com/ads/", "cnet.com/imp", "cnn.com/cnn_adspaces/", "cnn.com/ad-", "cntv.cn/Library/js/js_ad_gb.js", "cnx-software.com/pic/gateworks/", "cnx-software.com/pic/technexion/", "coastfm.ae/images/background/", "coastfm.ae/promotion/", "coastweek.com/banner_", "coastweek.com/graffix/", "cocomment.com/banner", "codecguide.com/driverscan2.gif", "codecguide.com/driverscantop1.gif", "codecguide.com/beforedl2.gif", "codenull.net/images/banners/", "coderanch.com/shingles/", "coinmarketcap.com/static/sponsored/", "coinpedia.org/wp-content/uploads/2018/08/lpc-banner-website.gif", "coinpedia.org/wp-content/uploads/2018/08/crypto-ticker.jpg", "coinurl.com/bootstrap/js/bootstrapx-clickover.js", "coinurl.com/nbottom.php", "coinurl.com/bottom.php", "coinurl.com/get.php", "coinwarz.com/content/images/genesis-mining-eth-takeover-", "collarme.com/zone_alt.asp", "collarme.com/anv/", "colombiareports.com/wp-content/banners/", "coloradomedicalmarijuana.com/images/sidebar/banner-", "com-a.in/images/banners/", "com.com/cnwk.1d/aud/", "comicbookresources.com/assets/images/skins/", "comicgenesis.com/tcontent.php", "comparestoreprices.co.uk/images/promotions/", "compassnewspaper.com/images/banners/", "complaintsboard.com/img/300x250anti.gif", "complaintsboard.com/img/202x202.gif", "complaintsboard.com/img/banner-", "computerhelp.com/temp/banners/", "con-telegraph.ie/images/banners/", "concealednation.org/sponsors/", "concrete.tv/images/banners/", "connectionstrings.com/csas/public/a.ashx", "conscioustalk.net/images/sponsors/", "convertmyimage.com/images/banner-square.png", "conwaydailysun.com/images/banners/", "conwaydailysun.com/images/Tiles_Skyscrapers/", "coolfm.us/lagos969/images/banners/", "coolmath-games.com/images/160-notice.gif", "coryarcangel.com/images/banners/", "cosplay.com/1lensvillage.gif", "countrychannel.tv/telvos_banners/", "cpub.co.uk/a", "crackdb.com/img/vpn.png", "cramdodge.com/mg-", "craveonline.com/gnads/", "crazy-torrent.com/web/banner/0xxx0.net.jpg", "crazy-torrent.com/web/banner/online.jpg", "createtv.com/CreateProgram.nsf/vShowcaseFeaturedSideContentByLinkTitle/", "creattor.net/flashxmlbanners/", "credio.com/ajax_get_sponsor_listings", "cricbuzz.com/js/banners/", "cricketireland.ie//images/sponsors/", "cricruns.com/images/hioxindia-", "crushorflush.com/html/promoframe.html", "csgobackpack.net/653x50.", "cship.org/w/skins/monobook/uns.gif", "ctmirror.org/randomsupporter/", "ctrl.blog/ac/rba", "ctv.ca/ctvresources/js/ctvad.js", "ctv.ca/Sites/Ctv/assets/js/ctvDfpAd.js", "cur.lv/nbottom.php", "cur.lv/bootstrap/js/bootstrapx-clickover.js", "currency.wiki/images/out/", "cybergamer.com/skins/", "d-h.st/assets/img/download1.png", "d.imwx.com/js/wx-a21-plugthis-", "d5e.info/2.png", "d5e.info/1.gif", "dabs.com/images/page-backgrounds/", "daily-mail.co.zm/images/banners/", "dailybitcoins.org/banners/", "dailycommercial.com/inc.php", "dailydeal.news-record.com/widgets/", "dailydeals.sfgate.com/widget/", "dailyexpress.com.my/banners/", "dailyexpress.com.my/image/banner/", "dailyfreegames.com/js/partners.html", "dailyhome.com/leaderboard_banner", "dailymail.co.uk/i/pix/ebay/", "dailymail.co.uk/modules/commercial/", "dailymirror.lk/media/images/Nawaloka-", "dailymotion.com/images/ie.png", "dailymotion.com/masscast/", "dailynews.co.tz/images/banners/", "dailypioneer.com/images/banners/", "dailypuppy.com/images/livestrong/ls_diet_120x90_1.gif", "dailysabah.com/banner/", "dailytimes.com.pk/banners/", "dailytrust.com.ng/Image/LATEST_COLEMANCABLE.gif", "dailytrust.info/images/dangote.swf", "dailytrust.info/images/banners/", "dainikbhaskar.com/images/sitetakover/", "damnlol.com/a/leaderboard.php", "damnlol.com/a/cubeNEW.php", "darknet.org.uk/images/acunetix_", "datpiff.com/skins/misc/", "dayport.com/ads/", "dbstalk.com/sponsors/", "dcourier.com/SiteImages/Banner/", "ddccdn.com/js/google_", "ddl2.com/header.php", "deadspin.com/sp/", "deborah-bickel.de/banners/", "decryptedtech.com/images/banners/", "defenceweb.co.za/logos/", "defenceweb.co.za/images/sponsorlogos/", "demerarawaves.com/images/banners/", "depic.me/banners/", "depic.me/bann/", "deseretnews.com/img/sponsors/", "deshvidesh.com/banner/", "designtaxi.com/js/i-redirector.js", "desiretoinspire.net/storage/layout/modmaxbanner.gif", "desiretoinspire.net/storage/layout/royalcountessad.gif", "desixpress.co.uk/image/banners/", "detroitindependent.net/images/ad_", "develop-online.net/static/banners/", "devx.com/devx/3174.gif", "dexerto.com/a/", "dexerto.com/app/uploads/2016/11/SCUF-5-Discount-Dexerto-Below-Article.jpg", "dexerto.com/app/uploads/2016/11/Gfuel-LemoNade.jpg", "dezeen.com/wp-content/themes/dezeen-aa-hpto-mini-sept-2014/", "dictionary.cambridge.org/info/frame.html", "digitaljournal.com/promo/", "digitizor.com/wp-content/digimages/xsoftspyse.png", "diplodocs.com/shopping/sol.js", "diply.com/cms/bb/", "diply.com/campaigns/", "dippic.com/images/banner", "dishusa.net/templates/flero/images/book_sprava.gif", "distrogeeks.com/images/sponsors/", "distrowatch.com/images/kokoku/", "dividendchannel.com/toprankedsm.gif", "divxme.com/images/play.png", "divxstage.eu/images/download.png", "diytrade.com/diyep/dir", "djluv.in/android.gif", "djmag.co.uk/sites/default/files/takeover/", "djmag.com/sites/default/files/takeover/", "dl-protect.com/pop.js", "dnsstuff.com/dnsmedia/images/ft.banner.", "doge-dice.com/images/faucet.jpg", "doge-dice.com/images/outpost.png", "dogechain.info/content/img/a", "domainmarket.com/mm/", "domaintools.com/partners/", "domaintools.com/marketing/", "domaintools.com/eurodns_", "dota-trade.com/img/branding_", "doubleviking.com/ss.html", "downforeveryoneorjustme.com/images/dotbiz_banner.jpg", "downloadian.com/assets/banner.jpg", "dpstatic.com/s/ad.js", "dpstatic.com/banner.png", "drhinternet.net/mwimgsent/", "drivearchive.co.uk/images/amazon.", "drivearchive.co.uk/amazon/", "droidgamers.com/images/banners/", "dsogaming.com/interstitial/", "dubcnm.com/Adon/", "duckload.com/js/abp.php", "dump8.com/wget_2leep_bottom.php", "dump8.com/wget.php", "dump8.com/tiz/", "dwarfgames.com/pub/728_top.", "dyncdn.celebuzz.com/assets/", "e90post.com/forums/images/banners/", "earthmoversmagazine.co.uk/nimg/", "eastonline.eu/images/banners/", "eastonline.eu/images/eng_banner_", "easybytez.com/pop3.js", "easydiy.co.za/images/banners/", "eatsleepsport.com/images/manorgaming1.jpg", "ebayrtm.com/rtm", "ebizblitz.co.za/upload/ad/", "ebizmbainc.netdna-cdn.com/images/tab_sponsors.gif", "ebookshare.net/pages/lt.html", "ebuddy.com/textlink.php", "ebuddy.com/web_banners_", "ebuddy.com/web_banners/", "eclipse.org/membership/promo/images/", "ecommerce-journal.com/specdata.php", "economictimes.com/etmpat/", "ecostream.tv/js/pu.js", "ecostream.tv/assets/js/pu.min.js", "ed2k.2x4u.de/mfc/", "edmunds.com/api/savesegment", "educationbusinessuk.net/images/stage.gif", "ehow.co.uk/frames/directas_", "ehow.com/images/brands/", "ehow.com/media/ad.html", "ehow.com/marketing/", "ejb.com/300_250", "ejpress.org/images/banners/", "ejpress.org/img/banners/", "ekantipur.com/uploads/banner/", "electronicsfeed.com/bximg/", "elevenmyanmar.com/images/banners/", "elgg.org/images/hostupon_banner.gif", "elivetv.in/pop/", "emergencymedicalparamedic.com/wp-content/uploads/2011/12/anatomy.gif", "emoneyspace.com/b.php", "empirestatenews.net/Banners/", "encyclopediadramatica.rs/lanhell.js", "encyclopediadramatica.rs/spon/", "energytribune.com/res/banner/", "england.fm/i/ducksunited120x60english.gif", "englishgrammar.org/images/30off-coupon.png", "englishtips.org/b/", "enigmagroup.org/clients/privatetunnels.swf", "epicshare.net/p1.js", "epictv.com/sites/default/files/290x400_", "eprop.co.za/images/banners/", "eq2flames.com/images/styles/eq2/images/banner", "escapementmagazine.com/wp-content/banners/", "espn.co.uk/espnuk/williamhill_", "espn.co.uk/espnuk/williamhill/", "espn1320.net/get_preroll.php", "esportlivescore.com/img/fano_", "esportlivescore.com/img/fanobet_", "esportlivescore.com/img/vitalbet.", "essayinfo.com/img/125x125_", "esus.com/images/regiochat_logo.png", "etidbits.com/300x250news.php", "euphonik.dj/img/sponsors-", "eurochannel.com/images/banners/", "eurodict.com/images/banner_", "euronews.com/media/farnborough/farnborough_wp.jpg", "european-rubber-journal.com/160x600px_", "europeonline-magazine.eu/nuroa/", "europeonline-magazine.eu/banner/", "eve-search.com/gge.gif", "eventful.com/tools/click/url", "evernote.com/prom/img/", "evolutionm.net/SponsorLogos/", "evony.com/sevonyadvs2.", "eweek.com/images/stories/marketing/", "eweek.com/widgets/ibmtco/", "ewrc-results.com/images/horni_ewrc_result_banner3.jpg", "exashare.com/player_begin.jpg", "exashare.com/player_file.jpg", "exashare.com/vod_stream.html", "exashare.com/playerexa.jpg", "exashare.com/hq_stream.html", "exchangerates.org.uk/images/150_60_", "exchangerates.org.uk/images/200x200_", "exchangerates.org.uk/images-NEW/tor.gif", "excite.com/gca_iframe.html", "expatexchange.com/banner/", "expatwomen.com/expat-women-sponsors/", "expertreviews.co.uk/widget/", "expertreviews.co.uk/", "expressmilwaukee.com/engines/backgrounds/js/backgrounds.js", "expreview.com/exp2/", "extremeoverclocking.com/template_images/it120x240.gif", "extremetech.com/pb/pbl.min.js", "faadooengineers.com/ads/", "familylawweek.co.uk/bin_1/", "famouspornstarstube.com/images/sponsors/", "fancystreems.com/300x2503.php", "fanfusion.org/as.js", "fark.com/cgi/buzzfeed_link.pl", "fark.net/pub/", "farmville.com/promo_bar.php", "farsnews.com/banner/", "fastpic.ru/js_h2.jpg", "fastpic.ru/js_f2.jpg", "fastpic.ru/b/", "feed4u.info/feedipop.js", "feedsportal.com/videoserve/", "feedsportal.com/creative/", "ffiles.com/counters.js", "fgfx.co.uk/banner.js", "fhm.com/images/sportsbutton.gif", "fhm.com/images/casinobutton.gif", "fiba.com/Content/Sponsors/", "fiberupload.org/300en.png", "fightersonlymag.com/images/banners/", "fijitimes.com/images/bspxchange.gif", "file-upload.net/include/mitte.php", "file-upload.net/include/rechts.php", "file.org/fo/scripts/download_helpopt.js", "file2hd.com/sweet.jpg", "filecrypt.cc/bla.php", "filedino.com/imagesn/downloadgif.gif", "fileflyer.com/img/dap_banner_", "filegaga.com/ot/fast.php", "fileom.com/img/downloadnow.png", "fileom.com/img/instadownload2.png", "fileplanet.com/fileblog/sub-no-ad.shtml", "filesharingtalk.com/fst/8242/", "fileshut.com/etc/links.php", "filesmonster.com/mi/twp/", "filespart.com/ot/fast.aspx", "filespazz.com/imx/template_r2_c3.jpg", "filestream.me/requirements/images/cialis_generic.gif", "filestream.me/requirements/images/ed.gif", "filez.cutpaid.com/336v", "filez.cutpaid.com/page.js", "filipinojournal.com/images/banners/", "filmey.com/Filmey.Ad.js", "filmsite.org/dart-zones.js", "financialnewsandtalk.com/scripts/slideshow-sponsors.js", "findfiles.com/images/icatchallfree.png", "findfiles.com/images/knife-dancing-1.gif", "findfreegraphics.com/underp.js", "findit.com.mt/dynimage/boxbanner/", "findit.com.mt/viewer/", "findthebest-sw.com/sponsor_event", "firedrive.com/appdata/", "firedrive.com/appresources/", "firstnationsvoice.com/images/weblinks.swf", "firstpost.com/promo/", "firstrows.biz/js/bn.js", "firstrowsports.li/frame/", "firstrowusa.eu/js/bn.js", "fishchannel.com/images/sponsors/", "fishki.net/code", "fiverr.com/javascripts/conversion.js", "flameload.com/onvertise.", "flashscore.com/res/image/bookmaker-list.png", "flashy8.com/banner/", "fleetwatch.co.za/images/banners/", "flicks.co.nz/images/takeovers/", "flicks.co.nz/takeovercss/", "flightradar24.com/_includes/sections/airportAd.php", "flvto.biz/scripts/banners.php", "flyordie.com/games/free/b/", "flyordie.com/games/online/ca.html", "foodingredientsfirst.com/content/flash_loaders/loadskyscraper.swf", "foodingredientsfirst.com/content/flash_loaders/loadlargetile.swf", "foodingredientsfirst.com/content/banners/", "fool.com/pitcher/", "football-italia.net/imgs/moveyourmouse.gif", "footballshirtculture.com/images/e12b.jpg", "fordforums.com.au/logos/", "forexpeacearmy.com/images/banners/", "forumw.org/images/uploading.gif", "forward.com/workspace/assets/newimages/amazon.png", "foxbusiness.com/html/google_homepage_promo", "foxsports.com/component/xml/SBMarketingTakeOverPromos", "foxsportsradio.com/pages/second300x250iframe.html", "fpscheats.com/banner-img.jpg", "fpscheats.com/fpsbanner.jpg", "fredmiranda.com/buzz/canondble-600x90.jpg", "free-times.com/image/pool/", "free-webhosts.com/images/a/", "freeads.co.uk/ctx.php", "freeappaday.com/nimgs/bb/", "freemediatv.com/images/inmemoryofmichael.jpg", "freeminecraft.me/mw3.png", "freemoviestream.xyz/wp-content/uploads/", "freenode.net/images/ack_privateinternetaccess-freenode.png", "freenode.net/images/freenode_osuosl.png", "freepornsubmits.com/ads/", "freeroms.com/bigbox_", "freeroms.com/bigbox.html", "freeroms.com/skyscraper_", "freesoftwaremagazine.com/extras/", "freetypinggame.net/burst720.asp", "freevermontradio.org/pictures/lauren_Stagnitti.jpg", "freeworldgroup.com/banner", "frenchradiolondon.com/data/carousel/", "fresh-weather.com/popup1.gif", "freshplaza.com/b/", "freshremix.org/templates/freshremix_eng/images/300.gif", "freshremix.ru/images/ffdownloader1.jpg", "friday-ad.co.uk/banner.js", "friday-ad.co.uk/endeca/afccontainer.aspx", "frombar.com/ads/", "frozen-roms.in/popup.php", "frozen-roms.me/popup.php", "fscheetahs.co.za/images/Sponsers/", "ftdworld.net/images/banners/", "fulhamfc.com/i/partner/", "fullrip.net/images/download-", "fulltv.tv/pub_", "funmaza.in/units/", "funpic.de/layer.php", "funpic.org/layer.php", "fuse.tv/images/sponsor/", "gabzfm.com/images/banners/", "gaccmidwest.org/uploads/tx_bannermanagement/", "gaccny.com/uploads/tx_bannermanagement/", "gaccsouth.com/uploads/tx_bannermanagement/", "gaccwest.com/uploads/tx_bannermanagement/", "gadget.co.za/siteimages/banners/", "gaeatimes.com/ctad/", "gallerysense.se/site/getBannerCode", "game1games.com/exchange/", "gameawayscouponsstorage.blob.core.windows.net/images/greenmangaming/", "gamecopyworld.com/games/i/if6.gif", "gamecopyworld.com/games/js/abd.js", "gameknot.com/amaster.pl", "gamemakerblog.com/gma/gatob.php", "gamepressure.com/ajax/f2p.asp", "gamerant.com/ads/", "gamesfreez.com/banner/", "gamesgames.com/vda/", "gamevid.com/13/ads/", "gamingsquid.com/wp-content/banners/", "ganool.com/pup.js", "gappon.com/images/hot2.gif", "garrysmod.org/img/sad/", "gasgoo.com/promo/", "gaydarradio.com/userportal/miva/", "gaynz.com/mysa/banners/", "gaynz.gen.nz/mysa/banners/", "gbatemp.net/images/ab/", "gbrej.com/c/", "gcnlive.com/assets/sponsorsPlayer/", "gcnlive.com/assets/sponsors/", "geckoforums.net/banners/", "geekzone.co.nz/images/wrike/", "gelbooru.com/halloween/", "gelbooru.com/x/", "gentoo.org/images/sponsors/", "geocities.com/js_source/", "geometria.tv/banners/", "get-bitcoins-free.eu/img/blackred728smallsize.gif", "getfoxyproxy.org/images/abine/", "getreading.co.uk/static/img/bg_takeover_", "getrichslowly.org/blog/img/banner/", "ghacks.net/skin-", "ghafla.co.ke/images/bgmax/", "ghafla.co.ke/images/banners/", "ghananewsagency.org/assets/banners/", "giftguide.savannahnow.com/giftguide/widgets/", "girlguides.co.za/images/banners/", "giveawayoftheday.com/web/bannerinf.js", "gizmochina.com/images/blackview.jpg", "gizmodo.in/gzdics/", "glamourviews.com/home/zones", "glassdoor.com/getAdSlotContentsAjax.htm", "gledaisport.com/ads/", "globalsecurity.org/_inc/frames/", "globaltimes.cn/desktopmodules/bannerdisplay/", "glocktalk.com/forums/images/banners/", "go4up.com/assets/img/download-button.png", "go4up.com/assets/img/buttoned.gif", "go4up.com/assets/img/downloadbuttoned.png", "go4up.com/assets/img/d0.png", "gocdkeys.com/images/bg_", "godisageek.com/amazon.png", "gokunming.com/images/prom/", "gold-prices.biz/gold_trading_leader.gif", "gold1013fm.com/promotion/", "gold1013fm.com/images/background/", "goldenskate.com/sponsors/", "gomlab.com/img/banner/", "gonzagamer.com/uci/popover.js", "goodgearguide.com.au/files/skins/", "gooster.co.uk/js/ov.js.php", "gospel1190.net/rotatorimages/", "gowilkes.com/other/", "gowilkes.com/cj/", "gr8.cc/addons/banners", "graphic.com.gh/images/banners/", "graphicdesignforums.co.uk/banners/", "greaterkashmir.com/adds_", "greatgirlsgames.com/100x100.php", "greatgirlsgames.com/a/skyscraper.php", "greenoptimistic.com/images/electrician2.png", "greyorgray.com/images/Fast%20Business%20Loans%20Ad.jpg", "greyorgray.com/images/hdtv-genie-gog.jpg", "gsprating.com/gap/image.php", "gtop100.com/a_images/show-a.php", "gtweekly.com/images/banners/", "guardian.bz/images/banners/", "gulf-daily-news.com/180x150.htm", "gurgle.com/modules/mod_m10banners/", "guru99.com/images/adblocker/", "gwinnettdailypost.com/1.iframe.asp", "h33t.to/images/button_direct.png", "ha.ckers.org/images/nto_top.png", "ha.ckers.org/images/fallingrock-bot.png", "ha.ckers.org/images/sectheory-bot.png", "hackingchinese.com/media/hellochinese.jpg", "hackingchinese.com/media/skritter5.jpg", "hackingchinese.com/media/hcw4.png", "hackingchinese.com/media/pleco.png", "hahasport.com/ads/", "hancinema.net/images/watch-now", "hancinema.net/images/banner_", "happierabroad.com/Images/banner", "hawkesbay.co.nz/images/banners/", "hawkesbaytoday.co.nz/nz_regionals/marketplace/", "hdfree.tv/ad.html", "headlineplanet.com/home/burstbox.html", "headlineplanet.com/home/box.html", "healthfreedoms.org/assets/swf/320x320_", "heatworld.com/upload/takeovers/", "hentai2read.com/ios/swf/", "hentaihaven.org/wp-content/banners/", "heraldm.com/hb/imad/", "heraldm.com/iframe/", "herold.at/images/dealofday.swf", "herzeleid.com/files/images/banners/", "hickoryrecord.com/app/deal/", "highdefjunkies.com/images/misc/kindlejoin.jpg", "hipforums.com/images/banners/", "hipforums.com/newforums/calendarcolumn.php", "hitechlegion.com/images/banners/", "hitomi.la/hitomi-horizontal.js", "hitomi.la/hitomi.", "hitomi.la/hitomi/", "hitomi.la/hitomi-", "hitomi.la/pacode.js", "hkclubbing.com/images/banners/", "hockeybuzz.com/mb/b", "hollywoodbackwash.com/glam/", "holyfamilyradio.org/banners/", "holyfragger.com/images/skins/", "homeschoolmath.net/a/", "hongfire.com/banner/", "hongkongindians.com/advimages/", "horizonsunlimited.com/alogos/", "horriblesubs.info/playasia", "hostingbulk.com/zad.html", "hostingbulk.com/aad.html", "hostratings.co.uk/zeepeel.", "hostsearch.com/creative/", "hot-scene.com/cpop.js", "hotbollywoodactress.net/freedatingindia.gif", "hotbollywoodactress.net/ff2.gif", "hotfilesearch.com/includes/images/mov_", "hotfiletrend.com/dlp.gif", "hothardware.com/pgmerchanttable.aspx", "houseoftravel.co.nz/flash/banner/", "howtogeek.com/go/", "howtogermany.com/banner/", "howtogermany.com/images/but-", "howtogermany.com/images/bnr-", "howwe.biz/mgid-", "hpfanficarchive.com/freecoins2.jpg", "hqfooty.tv/ad", "htmldog.com/r10/flowers/", "hulkfile.eu/images/africa.gif", "hulkload.com/recommended/", "hulkload.com/b/", "hulkshare.com/promo/", "hwbot.org/banner.img", "hwinfo.com/images/se2banner.png", "hwinfo.com/images/lansweeper.jpg", "hypemagazine.co.za/assets/bg/", "i-sgcm.com/pagetakeover/", "ians.in/iansad/", "ibizaworldclubtour.net/wp-content/themes/ex-studios/banner/", "ibrod.tv/ib.php", "ibtimes.com/banner/", "iceinspace.com.au/iisads/", "iconeye.com/images/banners/", "icxm.net/x/img/kinguin.jpg", "iddin.com/img/chatwing_banner_", "iddin.com/img/chatwing_banner.", "ieee.org/interstitial", "iftn.ie/images/data/banners/", "ijn.com/images/banners/", "ijoomla.com/aff/banners/", "ilcorsaronero.info/home.gif", "iload.to/img/ul/impopi.js", "iloveim.com/cadv", "imagefruit.com/includes/js/ex.js", "imagefruit.com/includes/js/bgcont.js", "imagefruit.com/includes/js/layer.js", "imagepix.org/Images/imageput.jpg", "imageporter.com/micromoo.html", "imageporter.com/smate.html", "imageporter.com/ro-7bgsd.html", "imageporter.com/hiokax.js", "imageporter.com/someo.html", "imagerise.com/ir.js", "imagerise.com/ir2.js", "images.bitreactor.to/designs/", "images.mmorpg.com/images/mus.jpg", "images.sharkscope.com/everest/twister.jpg", "images4et.com/images/other/warning-vpn2.gif", "imageshack.us/ym.php", "imagesnake.com/includes/js/pops.js", "imagesnake.com/includes/js/cat.js", "imagesnake.com/includes/js/layer.js", "imagesnake.com/includes/js/js.js", "imagetoupload.com/images/87633952425570896161.jpg", "imagevenue.com/interstitial.", "imcdb.org/res/cth_", "imgbox.com/images/tpd.png", "imgbox.com/gsmpop.js", "imgburn.com/images/ddigest_", "imgburn.com/images/your3gift.gif", "imgcarry.com/includes/js/layer.js", "imgking.co/poudr.js", "imgshots.com/includes/js/layer.js", "imgur.com/include/zedoinviewstub1621.html", "immihelp.com/partner/banners/", "imouto.org/images/jlist/", "imouto.org/images/mangagamer/", "impulsedriven.com/app_images/wallpaper/", "incentivetravel.co.uk/images/banners/", "indeed.com/ads/", "independent.co.ug/images/banners/", "independent.co.uk/kelkoo/", "india.com/zeenews_head2n.jpg", "indiainfoline.com/wc/ads/", "indiantelevision.com/banner/", "industryabout.com/images/banners/", "inewsmalta.com/SiteImages/Promo/", "info.sciencedaily.com/api/", "infobetting.com/bookmaker/", "infobetting.com/b/", "informe.com/img/banner_", "infosecisland.com/ajax/viewbanner/", "infoseek.co.jp/isweb/clip.html", "injpn.net/images/banners/", "inkscapeforum.com/images/banners/", "inquirer.net/wp-content/themes/news/images/wallpaper_", "insidebutlercounty.com/images/300-", "insidebutlercounty.com/images/200-", "insidebutlercounty.com/images/160-", "insidebutlercounty.com/images/180-", "insidebutlercounty.com/images/100-", "insidebutlercounty.com/images/468-", "insidedp.com/images/banners/", "insidehw.com/images/banners/", "insidercdn.com/price_guide/", "insideyork.co.uk/assets/images/sponsors/", "intel.com/sites/wap/global/wap.js", "intellicast.com/travel/cheapflightswidget.htm", "intellicast.com/outsidein.js", "intelseek.com/intelseekads/", "interest.co.nz/banners/", "international-property.countrylife.co.uk/js/search_widget.js", "international.to/large.html", "international.to/600.html", "international.to/link_unit.html", "internationalmeetingsreview.com//uploads/banner/", "ipaddress.com/banner/", "ipinfodb.com/img/adds/", "iptools.com/sky.php", "iradio.ie/assets/img/backgrounds/", "irishamericannews.com/images/banners/", "irishdev.com/files/banners/", "irishexaminer.com/marketing/", "irishracing.com/graphics/books", "irishradio.com/images/banners/", "ironspider.ca/pics/hostgator_green120x600.gif", "ironsquid.tv/data/uploads/sponsors/", "irv2.com/images/sponsors/", "irv2.com/attachments/banners/", "isitnormal.com/img/iphone_hp_promo_wide.png", "islamicfinder.org/cimage/", "islamicfocus.co.za/images/banners/", "island.lk/userfiles/image/danweem/", "isportconnect.com//images/banners/", "israeldefense.com/_Uploads/dbsBanners/", "isup.me/images/dotbiz_banner.jpg", "isxdead.com/images/showbox.png", "italiangenealogy.com/images/banners/", "itpro.co.uk/images/skins/", "itservicesthatworkforyou.com/sp/ebay.jpg", "itweb.co.za/banners/", "itweb.co.za/logos/", "itweb.co.za/sidelogos/", "itwebafrica.com/images/logos/", "itworld.com/slideshow/iframe/topimu/", "iurfm.com/images/sponsors/", "ixquick.nl/graphics/banner_", "jacars.net/images/ba/", "jamaica-gleaner.com/images/promo/", "javamex.com/images/AdFrenchVocabGamesAnim.gif", "javascriptobfuscator.com/images/mylivechat.png", "jayisgames.com/maxcdn_160x250.png", "jdownloader.org/_media/screenshots/banner.png", "jebril.com/sites/default/files/images/top-banners/", "jewishtimes-sj.com/rop/", "jewishvoiceny.com/ban2/", "jewishyellow.com/pics/banners/", "jheberg.net/img/mp.png", "jillianmichaels.com/images/publicsite/advertisingslug.gif", "johnbridge.com/vbulletin/banner_rotate.js", "johnbridge.com/vbulletin/images/tyw/wedi-shower-systems-solutions.png", "johnbridge.com/vbulletin/images/tyw/cdlogo-john-bridge.jpg", "joins.com/common/ui/ad/", "joomladigger.com/images/banners/", "jordantimes.com/accu/", "journal-news.net/annoyingpopup/", "journeychristiannews.com/images/banners/", "jozikids.co.za/uploadimages/140x140_", "jpost.com/elal/", "jumptags.com/joozit/presentation/images/banners/", "juno.com/start/view/redesign/common/phoenix/", "junocloud.me/promos/", "just-download.com/banner/", "juventus.com/pics/sponsors/", "k2s.cc/images/fantasy/", "kaieteurnewsonline.com/revenue/", "kamcity.com/menu/banners/", "kamcity.com/banager/banners/", "kansascity.com/images/touts/ds_", "kaotic.com/assets/toplists/footer.html", "kassfm.co.ke/images/moneygram.gif", "kavkisfile.com/images/ly.gif", "kavkisfile.com/images/ly-mini.gif", "kbcradio.eu/img/banner/", "kblx.com/upload/takeover_", "kcrw.com/collage-images/itunes.gif", "kcrw.com/collage-images/amazon.gif", "kdnuggets.com/aps/", "kdoctv.net/images/banners/", "keenspot.com/images/headerbar-", "keepvid.com/images/ilivid-", "keepvid.com/images/winxdvd-", "keepvid.com/ads/", "kendrickcoleman.com/images/banners/", "kentonline.co.uk/weatherimages/Britelite.gif", "kentonline.co.uk/weatherimages/SEW.jpg", "kentonline.co.uk/weatherimages/sponsor_", "kephyr.com/spywarescanner/banner1.gif", "kewlshare.com/reward.html", "khaleejtimes.com/imgactv/Umrah-Static-Background-Gutters-N.jpg", "khaleejtimes.com/imgactv/Umrah%20-%20290x60%20-%20EN.jpg", "kickasstorrent.ph/kat_adplib.js", "kickoff.com/images/sleeves/", "kimcartoon.me/External/NativeKC", "kingofsat.net/pub/", "kinox.to/392i921321.js", "kinox.to/com/", "kinox.tv/g.js", "kirupa.com/supporter/", "kitco.com/ssi/home_ox_deanmg.stm", "kitco.com/ssi/dmg_banner_001.stm", "kitco.com/ssi/market_ox_deanmg.stm", "kitguru.net/", "kitguru.net/wp-content/banners/", "kitguru.net//wp-content/banners/", "kitguru.net/wp-content/wrap.jpg", "kitz.co.uk/files/jump2/", "kleisauke.nl/static/img/bar.gif", "klfm967.co.uk/resources/creative/", "klkdccs.net/pjs/yavli-tools.js", "kncminer.com/userfiles/image/250_240.jpg", "knco.com/wp-content/uploads/wpt/", "knowledgespeak.com/images/banner/", "knowthecause.com/images/banners/", "knpr.org/common/sponsors/", "kob.com/kobtvimages/flexhousepromotions/", "kompas.com/js_kompasads.php", "kontraband.com/media/takeovers/", "koraliga.com/open.js", "koreanmovie.com/img/banner/banner.jpg", "koreatimes.co.kr/ad/", "koreatimes.co.kr/images/bn/", "koreatimes.co.kr/upload/ad/", "koreatimes.co.kr/www/images/bn/", "krebsonsecurity.com/b-ga/", "krebsonsecurity.com/b-kb/", "krzk.com/uploads/banners/", "kshp.com/uploads/banners/", "ksstradio.com/wp-content/banners/", "kuiken.co/static/w.js", "kukmindaily.co.kr/images/bnr/", "kuwaittimes.net/banners/", "kwanalu.co.za/upload/ad/", "kwikupload.com/images/dlbtn.png", "kxlh.com/images/banner/", "kyivpost.com/media/banners/", "l2b.co.za/L2BBMP/", "l4dmaps.com/i/right_dllme.gif", "l4dmaps.com/img/right_gameservers.gif", "labtimes.org/banner/", "labx.com/web/banners/", "laconiadailysun.com/images/banners/", "lake-link.com/images/sponsorLogos/", "laliga.es/img/patrocinadores-", "lankabusinessonline.com/images/banners/", "laobserved.com/tch-ad.jpg", "laptopmag.com/images/sponsorships/", "laredodaily.com/images/banners/", "lasttorrents.org/pcmadd.swf", "latex-community.org/images/banners/", "lazygamer.net/kalahari.gif", "lazygirls.info/click.php", "leader.co.za/leadership/banners/", "leadership.ng/cheki-", "leagueunlimited.com/images/rooty/", "learnphotoediting.net/banners/", "learnspanishtoday.com/aff/img/banners/", "lecydre.com/proxy.png", "legalbusinessonline.com/popup/albpartners.aspx", "lens101.com/images/banner.jpg", "lespagesjaunesafrique.com/bandeaux/", "letitbit.net/images/other/inst_forex_", "letour.fr/img/v6/sprite_partners_2x.png", "letswatchsomething.com/images/filestreet_banner.jpg", "libertyblitzkrieg.com/wp-content/uploads/2012/09/cc200x300.gif", "licensing.biz/media/banners/", "lifeinqueensland.com/images/156x183a_", "lifetips.com/sponsors/", "limesurvey.org/images/banners/", "limetorrentlinkmix.com/rd18/dop.js", "limetorrents.cc/static/images/download.png", "linguee.com/banner/", "linkcentre.com/top_fp.php", "linkfm.co.za/images/banners/", "linkis.com/index/ln-event", "linkmoon.net/banners/", "linksrank.com/links/", "linuxmint.com/pictures/sponsors/", "linuxmint.com/img/sponsor/", "linuxsat-support.com/vsa_banners/", "littleindia.com/files/banners/", "live-proxy.com/hide-my-ass.gif", "live-proxy.com/vectrotunnel-logo.jpg", "livejasmin.com/freechat.php", "liveonlinetv247.com/images/muvixx-150x50-watch-now-in-hd-play-btn.gif", "livescore.in/res/image/bookmaker-list.png", "livetradingnews.com/wp-content/uploads/vamp_cigarettes.png", "livetv.ru/mb/", "livetvcenter.com/satellitedirect_", "liveuamap.com/show", "livingscoop.com/vastload.php", "lmgtfy.com/s/images/ls_", "loadingz.com/js/jquery.flex.js", "loadingz.com/jflex.js", "logoopenstock.com/img/banners/", "logotv.com/content/skins/", "loleasy.com/promo/", "lolzbook.com/test/", "london2012.com/img/sponsors/", "london2012.com/imgml/partners/footer/", "lookbook.nu/show_skyscraper.html", "lookbook.nu/show_leaderboard.html", "lostrabbitmedia.com/images/banners/", "lowellsun.com/litebanner/", "lowendbox.com/wp-content/themes/leb/banners/", "lowyat.net/mainpage/background.jpg", "lowyat.net/lowyat/lowyat-bg.jpg", "lshunter.tv/images/bets/", "lycos.com/catman/", "lyngsat-logo.com/as9/", "lyngsat-maps.com/as9/", "lyngsat-stream.com/as9/", "lyngsat.com/as9/", "m-w.com/creative.php", "m4carbine.net/tabs/", "macaudailytimes.com.mo/files/banners/", "macaunews.com.mo/images/stories/banners/", "macblurayplayer.com/image/amazon-", "machovideo.com/img/site/postimg2/rotate.php", "macintouch.com/images/owc_", "macintouch.com/images/amaz_", "macmillandictionary.com/info/frame.html", "macobserver.com/js/givetotmo.js", "macupdate.com/js/google_service.js", "macworld.co.uk/promo/", "macworld.com/ads/", "madskristensen.net/discount2.js", "madville.com/afs.php", "mail.com/service/indeed", "mail.yahoo.com/neo/mbimg", "mail.yahoo.com/mc/md.php", "mailinator.com/images/abine/leaderboard-", "majorgeeks.com/images/mb-hb-2.jpg", "majorgeeks.com/aff/", "majorgeeks.com/images/download_sd_", "majorgeeks.com/images/mg120.jpg", "makeagif.com/parts/fiframe.php", "malaysiakini.com/misc/banners/", "maltatoday.com.mt/ui_frontend/display_external_module/", "malwaredomains.com/ra.jpg", "mangafox.com/media/game321/", "mangareader.net/images/800-x-100", "mangarush.com/xtend.php", "mangaupdates.com/affiliates/", "manhattantimesnews.com/images/banners/", "maniastreaming.com/pp2/", "manilatimes.net/images/banners/", "mapsofindia.com/widgets/tribalfusionboxadd.html", "maravipost.com/images/banners/", "marengo-uniontimes.com/images/banners/", "marineterms.com/images/banners/", "marketingupdate.co.za/temp/banner_", "marketintelligencecenter.com/images/brokers/", "marketnewsvideo.com/etfchannel/evfad1.gif", "marketnewsvideo.com/mnvport160.gif", "mary.com/728_header.php", "mashable.com/tripleclick.html", "masterani.me/static/jaja/", "masterkreatif.com/sw.js", "mathforum.org/images/tutor.gif", "mauritiusnews.co.uk/images/banners/", "maxconsole.com/maxconsole/banners/", "mbl.is/augl/", "mbl.is/mm/augl/", "mccont.com/campaign%20management/", "mccont.com/takeover/", "mccont.com/sda/", "mcjonline.com/filemanager/userfiles/banners/", "mcnews.com.au/banners/", "mcsesports.com/images/sponsors/", "mcvuk.com/static/banners/", "meanjin.com.au/static/images/sponsors.jpg", "mechodownload.com/forum/images/affiliates/", "medhelp.org/hserver/", "mediafire.com/images/rockmelt/", "mediafire.com/templates/linkto/", "mediafire.re/popup.js", "mediafiretrend.com/turboflirt.gif", "mediafiretrend.com/ifx/ifx.php", "mediamanager.co.za/img/banners/", "mediaticks.com/images/genx-infotech.jpg", "mediaticks.com/images/genx.jpg", "mediaticks.com/bollywood.jpg", "mediaupdate.co.za/temp/banner_", "medicaldaily.com/views/images/banners/", "megasearch.us/ifx/ifx.php", "megasearch.us/turboflirt.gif", "megashares.com/cache_program_banner.html", "megauploadtrend.com/iframe/if.php", "meizufans.eu/efox.gif", "meizufans.eu/merimobiles.gif", "meizufans.eu/vifocal.gif", "memory-alpha.org/__varnish_liftium/", "merriam-webster.com/creative.php", "messianictimes.com/images/Israel%20Today%20Logo.png", "messianictimes.com/images/MJBI.org.gif", "messianictimes.com/images/Jews%20for%20Jesus%20Banner.png", "messianictimes.com/images/Word%20of%20Messiah%20Ministries1.png", "messianictimes.com/images/4-13/reach.jpg", "messianictimes.com/images/banners/", "messianictimes.com/images/1-13/ba_mhfinal_", "meteovista.co.uk/go/banner/", "meteox.co.uk/bannerdetails.aspx", "meteox.com/bannerdetails.aspx", "metrolyrics.com/js/min/tonefuse.js", "metromedia.co.za/bannersys/banners/", "mgid.com/ban/", "mgnetwork.com/dealtaker/", "mhcdn.net/store/banner/", "mhvillage.com/ppc.php", "mi-pro.co.uk/banners/", "micast.tv/clean.php", "michronicleonline.com/images/banners/", "midlandsradio.fm/bms/", "mightyupload.com/popuu.js", "milanounited.co.za/images/sponsor_", "mindfood.com/upload/images/wallpaper_images/", "miniclipcdn.com/images/takeovers/", "mininova.org/js/vidukilayer.js", "mirrorstack.com/", "misterwhat.co.uk/business-company-300/", "mixfm.co.za/images/banner", "mixx96.com/images/banners/", "mizzima.com/images/banners/", "mmorpg.com/images/skins/", "mmorpg.com/images/mr_ss_", "mmosite.com/sponsor/", "mob.org/banner/", "mobilephonetalk.com/eurovps.swf", "mochiads.com/srv/", "money-marketuk.com/images/banners/", "moneyam.com/www/", "moneymakerdiscussion.com/mmd-banners/", "moneymedics.biz/upload/banners/", "monkeygamesworld.com/images/banners/", "monster.com/null&pp", "morningstaronline.co.uk/offsite/progressive-listings/", "motorcycles-motorbikes.com/pictures/sponsors/", "motorhomefacts.com/images/banners/", "motortrader.com.my/skinner/", "mountainbuzz.com/attachments/banners/", "mousesteps.com/images/banners/", "movie2k.tl/layers/", "movie2k.tl/serve.php", "movie2kto.ws/popup", "movie4k.org/e.js", "movie4k.tv/e.js", "moviewallpaper.net/js/mwpopunder.js", "movizland.com/images/banners/", "movstreaming.com/images/edhim.jpg", "movzap.com/aad.html", "movzap.com/zad.html", "mp3.li/images/md_banner_", "mp3s.su/uploads/___/djz_to.png", "msn.com/", "mtbr.com/ajax/hotdeals/", "multiup.org/img/sonyoutube_long.gif", "multiupload.biz/r_ads2", "murdermysteries.com/banners-murder/", "music.yahoo.com/get-free-html", "musicplayon.com/banner", "musicremedy.com/banner/", "mustangevolution.com/images/300x100_", "my-link.pro/rotatingBanner.js", "myam1230.com/images/banners/", "myanimelist.cdn-dena.com/images/affiliates/", "mybroadband.co.za/news/wp-content/wallpapers/", "myfax.com/free/images/sendfax/cp_coffee_660x80.swf", "myfpscheats.com/bannerimg.jpg", "mygaming.co.za/news/wp-content/wallpapers/", "myiplayer.eu/ad", "mymusic.com.ng/images/supportedby", "myproperty.co.za/banners/", "myrls.me/open.js", "mysafesearch.co.uk/adds/", "myshadibridalexpo.com/banner/", "mysuburbanlife.com/flyermodules", "mysuncoast.com/app/wallpaper/", "mytyres.co.uk/simg/skyscrapers/", "myway.com/gca_iframe.html", "mywot.net/files/wotcert/vipre.png", "nairaland.com/ejedudu/", "namepros.com/images/backers/", "nampa.org/images/banners/", "narrative.ly/ads/", "nation.sc/images/banners/", "nation.sc/images/pub", "nationaljournal.com/js/njg.js", "nationalreview.com/images/display_300x600-", "nationmultimedia.com/new/js/nation_popup.js", "nationmultimedia.com/home/banner/", "nativetimes.com/images/banners/", "naturalhealth365.com/images/ic-may-2014-220x290.jpg", "naturalnews.com/Images/Root-Canal-220x250.jpg", "naukimg.com/banner/", "naukri.com/banners", "ncrypt.in/images/useful/", "ncrypt.in/images/1.gif", "ncrypt.in/javascript/jquery.msgbox.min.js", "ncrypt.in/images/banner", "ncrypt.in/images/a/", "ndtv.com/widget/conv-tb", "ndtv.com/functions/code.js", "nemesistv.info/jQuery.NagAds1.min.js", "neodrive.co/cam/", "neoseeker.com/a_pane.php", "neowin.net/images/atlas/aww", "nerej.com/c/", "nesn.com/img/sponsors/", "nesn.com/img/nesn-nation/bg-", "nesn.com/img/nesn-nation/header-dunkin.jpg", "netdna-ssl.com/wp-content/uploads/2017/01/tla17janE.gif", "netdna-ssl.com/wp-content/uploads/2017/01/tla17sepB.gif", "netsplit.de/links/rootado.gif", "networkwestvirginia.com/uploads/user_banners/", "newafricanmagazine.com/images/banners/", "newalbumreleases.net/banners/", "newipnow.com/ad-js.php", "newoxfordreview.org/banners/ad-", "news-record.com/app/deal/", "news.am/pic/bnr/", "newsday.co.tt/banner/", "newsofbahrain.com/images/uae-exchange.", "newsonjapan.com/images/banners/", "newsreview.com/images/promo.gif", "newstrackindia.com/images/hairfallguru728x90.jpg", "newsudanvision.com/images/Carjunctionadvert.gif", "newsudanvision.com/images/banners/", "newsvine.com/jenga/widget/", "newsvine.com//jenga/widget/", "newverhost.com/css/onload.js", "newverhost.com/css/pp.js", "newvision.co.ug/rightsidepopup/", "newvision.co.ug/banners/", "nextgen-auto.com/images/banners/", "nextstl.com/images/banners/", "nfl.com/assets/images/hp-poweredby-", "ngohq.com/images/ad.jpg", "ngrguardiannews.com/images/banners/", "nigeriafootball.com/img/affiliate_", "nigeriamasterweb.com/Masterweb/banners_pic/", "nigerianyellowpages.com/images/banners/", "niggasbelike.com/wp-content/themes/zeecorporate/images/b.jpg", "nijobfinder.co.uk/affiliates/", "nirsoft.net/banners/", "nitrobahn.com.s3.amazonaws.com/theme/getclickybadge.gif", "nme.com/themes/takeovers/", "nme.com/js/takeoverlay.js", "nmimg.net/css/takeover_", "nodevice.com/images/banners/", "nogripracing.com/iframe.php", "norwaypost.no/images/banners/", "notalwaysromantic.com/images/banner-", "notebook-driver.com/wp-content/images/banner_", "nowgoal.com/images/foreign/", "nowwatchtvlive.co/revenuehits.html", "nowwatchtvlive.com/revenuehits.html", "nufc.com/forddirectbanner.js", "numberempire.com/images/b/", "nur.gratis/application/", "nutritionhorizon.com/content/banners/", "nuttynewstoday.com/images/percento-banner.jpg", "nuttynewstoday.com/images/hostwink.jpg", "nyaa.se/ac-", "nyaa.se/al", "nyaa.se/aj", "nyaa.se/ai", "nyaa.se/ag", "nyaa.se/ah", "nydailynews.com/img/sponsor/", "nydailynews.com/PCRichards/", "nymag.com/scripts/skintakeover.js", "nymag.com/partners/", "nypost.com/xyz", "nyrej.com/c/", "nytimes.com/ads/", "nzbindex.com/images/go/", "nzbindex.nl/images/banners/", "nzbking.com/static/nzbdrive_banner.swf", "nzbstars.com/images/blb_", "nznewsuk.co.uk/banners/", "oanda.com/wandacache/wf-banner-", "observer.com.na/images/banners/", "observer.org.sz/files/banners/", "observer.ug/images/banners/", "ocforums.com/adj/", "ocp.cbssports.com/pacific/request.jsp", "oilprice.com/oiopub/", "oilprice.com/images/sponsors/", "oilprice.com/images/banners/", "okccdn.com/media/img/takeovers/", "oldgames.sk/images/topbar/", "oload.tv/logpopup/", "omgpop.com/dc", "on.net/images/gon_nodestore.jpg", "onepieceofbleach.com/onepieceofbleach-gao-", "onionstatic.com/sponsored/", "onlinekeystore.com/skin1/images/side-", "onlinenews.com.pk/onlinenews-admin/banners/", "onlineshopping.co.za/expop/", "onlygoodmovies.com/netflix.gif", "onvasortir.com/maximemo-pense-bete-ovs.png", "opensubtitles.org/gfx/banners_campaigns/", "optics.org/banners/", "optimum.net/utilities/doubleclicktargeting", "oraclebroadcasting.com/images/hempusa_330.gif", "oraclebroadcasting.com/images/enerfood-300x90.gif", "oraclebroadcasting.com/images/extendovite300.gif", "originalfm.com/images/hotspots/", "orkut.gmodules.com//promote.xml", "orthodox-world.org/images/banners/", "oureducation.in/images/add.jpg", "ourmanga.com/funklicks", "outlookindia.com/image/banner_", "outlookmoney.com/sharekhan_ad.jpg", "overclock3d.net/img/pcp.jpg", "oyetimes.com/join/advertisers.html", "ozy.com/modules/_common/ozy/pushdown/", "ozy.com/modules/_common/ozy/blade/", "ozy.com/modules/_common/ozy/full_width/", "pacificnewscenter.com/images/banners/", "paisalive.com/include/popup.js", "parade.com/images/skins/", "paradoxwikis.com/Sidebar.jpg", "pardaphash.com/direct/tracker/add/", "parlemagazine.com/images/banners/", "pasadenajournal.com/images/banners/", "passageweather.com/links/", "pastebin.com/ablock/", "pbsrc.com/sponsor/", "pcadvisor.co.uk/graphics/sponsored/", "pcgamesn.com/sites/default/files/Se4S.jpg", "pcgamesn.com/sites/default/files/SE4L.JPG", "pcmag.com/blogshome/logicbuy.js", "pcpro.co.uk/images/skins/", "pcr-online.biz/static/banners/", "pcwdld.com/wp-content/plugins/wbounce/", "pedestrian.tv/_crunk/wp-content/files_flutter/", "penguin-news.com/images/banners/", "perezhilton.com/images/ask/", "peruthisweek.com/uploads/sponsor_image/", "petri.co.il/wp-content/uploads/banner1000x75_", "petri.co.il/wp-content/uploads/banner700x475_", "pghcitypaper.com/general/modalbox/modalbox.js", "phillytrib.com/images/banners/", "phnompenhpost.com/images/stories/banner/", "phonearena.com/images/banners/", "phonebunch.com/images/flipkart_offers_alt.jpg", "phoronix.com/phxforums-thread-show.php", "photo.net/equipment/pg-160", "photosupload.net/photosupload.js", "phpmotion.com/images/banners-webhosts/", "phuket-post.com/img/a/", "phuketgazette.net/banners/", "phuketwan.com/img/b/", "pickmeupnews.com/cfopop.js", "picsee.net/clk.js", "pimpandhost.com/images/pah-download.gif", "pimpandhost.com/static/html/wide_iframe.html", "pimpandhost.com/static/html/iframe.html", "pinknews.co.uk/newweb/", "pinknews.co.uk/gsky.", "piratefm.co.uk/resources/creative/", "pittnews.com/modules/mod_novarp/", "planecrashinfo.com/images/advertize1.gif", "planetlotus.org/images/partners/", "play4movie.com/banner/", "playgames2.com/mmoout.php", "playgames2.com/default160x160.php", "playgames2.com/ban300-", "playgames2.com/rand100x100.php", "playhub.com/js/popup-wide.js", "playtowerdefensegames.com/ptdg-gao-gamebox-homepage.swf", "plsn.com/images/PLSN-Bg1.jpg", "plunderguide.com/rectangle2.html", "plunderguide.com/leaderboard-gor.html", "pocket-lint.com/images/bytemarkad.", "pocketpcaddict.com/forums/images/banners/", "pokernews.com/preroll.php", "pokernews.com/b/", "police-car-photos.com/pictures/sponsors/", "policeprofessional.com/files/banners-", "policeprofessional.com/files/pictures-", "politicususa.com/psa/", "pornevo.com/events_", "portcanaveralwebcam.com/images/ad_", "portlanddailysun.me/images/banners/", "portmiamiwebcam.com/images/sling_", "ports.co.za/banners/", "porttechnology.org/images/partners/", "portugaldailyview.com/images/mrec/", "portugalresident.com/t/", "postadsnow.com/panbanners/", "postimg.cc/sw.js", "power977.com/images/banners/", "powvideo.net/ban/", "pr0gramm.com/wm/", "praguepost.com/images/banners/", "preev.com/ad|", "preev.com/ads|", "prehackshub.com/js/popup-wide.js", "pressrepublican.com/wallpaper/", "prewarcar.com/images/banners/", "primenews.com.bd/add/", "printfriendly.com/a/lijit/", "pro-clockers.com/images/banners/", "professionalmuscle.com/featured-concreter.jpg", "professionalmuscle.com/220x105%20ver2.gif", "professionalmuscle.com/PL2.gif", "professionalmuscle.com/phil1.jpg", "project-for-sell.com/_google.php", "projectfreetv.at/prom2.html", "projectfreetv.ch/adblock/", "propakistani.pk/data/warid_top1.html", "propakistani.pk/wp-content/themes/propakistani/images/776.jpg", "propakistani.pk/data/zong.html", "propertyeu.info/peu_storage_banners/", "propertyfinderph.com/uploads/banner/", "proxy-list.org/img/isellsite.gif", "proxy-youtube.net/myiphide_", "proxy-youtube.net/mih_", "proxycape.com/blah.js", "ps3crunch.net/forum/images/gamers/", "ptf.com/js/rc_banner.js", "ptf.com/js/fdm_banner.js", "ptf.com/fdm_frame_", "publicdomaintorrents.info/srsbanner.gif", "publicdomaintorrents.info/grabs/hdsale.png", "publicdomaintorrents.info/rentme.gif", "publichd.eu/images/directdownload.png", "publichd.eu/images/direct.download.ico", "publicityupdate.co.za/temp/banner_", "pulse.lk/banners/", "pulsenews.co.kr/js/ad.js", "pulsetv.com/banner/", "pumasrugbyunion.com/images/sponsors/", "punksbusted.com/images/ventrilo/", "pushsquare.com/wp-content/themes/pushsquare/skins/", "putlocker.is/images/banner", "pv-tech.org/images/footer_logos/", "pv-tech.org/images/suntech_m2fbblew.png", "q1075.com/images/banners/", "queenshare.com/popx.js", "quickmeme.com/media/rostile", "quicksilverscreen.com/img/moviesforfree.jpg", "quoteland.com/images/banner2.swf", "race-dezert.com/images/wrap-", "racingpost.com/ads/", "racinguk.com/images/site/foot_", "racketboy.com/images/racketboy_ad_", "radio-riverside.co.za/modules/mod_novarp/tmpl/pjmr.swf", "radio.com/rotatable", "radio1584.co.za/images/banners/", "radio4fm.com/promotion/", "radio4fm.com/images/background/", "radio786.co.za/images/banners/", "radio90fm.com/images/banners/", "radiocaroline.co.uk/swf/ACET&ACSP_RadioCaroline_teg.swf", "radioinfo.com/270x270/", "radioloyalty.com/newPlayer/loadbanner.html", "radiotimes.com/assets/images/partners/", "radiotoday.co.uk/a/", "radiowave.com.na/images/banners/", "radiowavesforum.com/rw/radioapp.gif", "radiozindagi.com/sponsors/", "ragezone.com/hfmed.png", "ragezone.com/output.php/", "ragezone.com/warlords.png", "ragezone.com/serve/www/", "rainbowpages.lk/images/banners/", "rapidgamez.com/images/", "rapidsafe.de/eislogo.gif", "rapidvideo.org/images/pl_box_rapid.jpg", "rapidvideo.tv/images/pl.jpg", "ratio-magazine.com/images/banners/", "ravchat.com/img/reversephone.gif", "rawstory.com/givememyrawjuggler.php", "rawstory.com/givememyrawgfp.php", "rawstory.com/givememyrawgfpdirect.php", "readingeagle.com/lib/dailysponser.js", "realitytvworld.com/includes/rtvw-jscript.js", "realitytvworld.com/burst.js", "reason.org/UserFiles/web-fin1.gif", "reddit.com/api/request_promo.json", "redditstatic.com/moat/", "rednationonline.ca/Portals/0/derbystar_leaderboard.jpg", "redpepper.org.uk/ad-", "regnow.img.digitalriver.com/vendor/37587/ud_box", "rejournal.com/users/blinks/", "rejournal.com/images/banners/", "releaselog.net/468.htm", "releaselog.net/uploads2/656d7eca2b5dd8f0fbd4196e4d0a2b40.jpg", "residentadvisor.net/images/banner/", "retrevo.com/m/google", "reverb.com/api/comparison_shopping_pages/", "reviewcentre.com/cinergy-adv.php", "revisionworld.co.uk/sites/default/files/imce/Double-MPU2-v2.gif", "rfu.com/js/jquery.jcarousel.js", "richardroeper.com/assets/banner/", "riderfans.com/other/", "rightsidenews.com/images/banners/", "rlsbb.com/wp-content/uploads/izilol.gif", "rlsbb.com/wp-content/uploads/smoke.jpg", "rlslog.net/files/frontend.js", "robinwidget.com/images/batman_banner.png", "roblox.com/user-sponsorship/", "rockettheme.com/aff/", "rockthebells.net/images/bot_banner_", "rockthebells.net/images/banners/", "rocktv.co/adds/", "rodfile.com/images/esr.gif", "rok.com.com/rok-get", "rollingout.com/images/attskin-", "rom-freaks.net/popup.php", "romereports.com/core/media/automatico/", "romereports.com/core/media/sem_comportamento/", "romhustler.net/square.js", "rough-polished.com/upload/bx/", "routerpasswords.com/routers.jpg", "routes-news.com/images/banners/", "routesonline.com/banner/", "rsbuddy.com/campaign/", "rss2search.com/delivery/", "rt.com/static/img/banners/", "rt.com/banner/", "rtc107fm.com/images/banners/", "rtcc.org/systems/sponsors/", "rtklive.com/marketing/", "runt-of-the-web.com/wrap1.jpg", "russianireland.com/images/banners/", "rustourismnews.com/images/banners/", "sa4x4.co.za/images/banners/", "saabsunited.com/wp-content/uploads/USACANADA.jpg", "saabsunited.com/wp-content/uploads/ban-", "saabsunited.com/wp-content/uploads/werbung-", "saabsunited.com/wp-content/uploads/rbm21.jpg", "saabsunited.com/wp-content/uploads/REALCAR-SAABSUNITED-5SEC.gif", "saabsunited.com/wp-content/uploads/180x460_", "sacbee.com/static/dealsaver/", "sacommercialpropnews.co.za/files/banners/", "safelinks.eu/open.js", "sagoodnews.co.za/templates/ubuntu-deals/", "saice.org.za/uploads/banners/", "sail-world.com/rotate/", "salfordonline.com/sponsors/", "salfordonline.com/sponsors2/", "sameip.org/images/froghost.gif", "sams.sh/premium_banners/", "samsung.com/ph/nextisnow/files/javascript.js", "sapeople.com/wp-content/uploads/wp-banners/", "sareunited.com/uploaded_images/banners/", "sat24.com/bannerdetails.aspx", "satelliteguys.us/pulsepoint_", "satelliteguys.us/burst_", "satellites.co.uk/images/sponsors/", "satnews.com/images/MSMPromoSubSky.jpg", "satnews.com/images/MITEQ_sky.jpg", "savefrom.net/img/a1d/", "saveondish.com/banner2.jpg", "saveondish.com/banner3.jpg", "sawlive.tv/ad", "sayellow.com/Clients/Banners/", "sbnation.com/campaigns_images/", "scenicreflections.com/dhtmlpopup/", "sceper.eu/wp-content/banners.min.js", "scientopia.org/public_html/clr_lympholyte_banner.gif", "scmagazine.com.au/Utils/SkinCSS.ashx", "scoopnest.com/content_rb.php", "scoot.co.uk/delivery.php", "screen4u.net/templates/banner.html", "screenafrica.com/jquery.jcarousel.min.js", "screencrave.com/show/", "screenlist.ru/dodopo.js", "screenlist.ru/porevo.js", "scriptcopy.com/tpl/phplb/search.jpg", "scriptmafia.org/banner.gif", "sdancelive.com/images/banners/", "search-torrent.com/images/videox/", "search.ch/htmlbanner.html", "search.ch/acs/", "search.stream.cr/core/webfonts.js", "search.triadcareers.news-record.com/jobs/search/results", "search.triadcars.news-record.com/autos/widgets/featuredautos.php", "searchtempest.com/clhimages/aocbanner.jpg", "seatguru.com/deals", "seatrade-cruise.com/images/banners/", "securitymattersmag.com/scripts/popup.js", "securitywonks.net/promotions/", "seedboxes.cc/images/seedad.jpg", "seeingwithsound.com/noad.gif", "segmentnext.com/javascripts/interstitial.client.js", "sendspace.com/images/shutter.png", "sendspace.com/defaults/framer.html", "sensongs.com/nfls/", "serial.sw.cracks.me.uk/img/logo.gif", "serialzz.us/ad.js", "sermonaudio.com/images/sponsors/", "sexmummy.com/footer.htm", "sexmummy.com/avnadsbanner.", "sexmummy.com/float.htm", "sfbaytimes.com/img-cont/banners", "sfltimes.com/images/banners/", "shadowpool.info/images/banner-", "shanghaidaily.com/include/bettertraffic.asp", "share-links.biz/get/cmm/", "sharebeast.com/topbar.js", "sharephile.com/js/pw.js", "sharesix.com/a/images/watch-bnr.gif", "sherdog.com/index/load-banner", "shodanhq.com/images/s/acehackware-obscured.jpg", "shop.com/cc.class/dfp", "shop.sportsmole.co.uk/pages/deeplink/", "shopping.stylelist.com/widget", "shopwiki.com/banner_iframe/", "shortenow.com/ezgif-", "show-links.tv/layer.php", "showbiz411.com/wp-content/banners/", "showbusinessweekly.com/imgs/hed/", "showsport-tv.com/images/xtreamfile.jpg", "showstreet.com/banner.", "shroomery.org/bnr/", "shroomery.org/images/shroomery.please.png", "shroomery.org/bimg/", "shroomery.org/images/www.shroomery.org.please.png", "shtfplan.com/images/banners/", "siberiantimes.com/upload/banners/", "sicilianelmondo.com/banner/", "sickipedia.org/static/images/banners/", "sify.com/images/games/gadvt/", "siliconrepublic.com/fs/img/partners/", "silvergames.com/div/ba.php", "singaporeexpats.com/com/iframe/", "sitedata.info/doctor/", "sitesfrog.com/images/banner/", "siteslike.com/images/celeb", "siteslike.com/js/fpa.js", "sk-gaming.com/image/acersocialw.gif", "sk-gaming.com/image/takeover_", "sk-gaming.com/www/skdelivery/", "sk-gaming.com/image/pts/", "skilouise.com/images/sponsors/", "skynews.com.au/elements/img/sponsor/", "skyscnr.com/sttc/strevda-runtime/", "skysports.com/images/skybet.png", "skysports.com/commercial/", "skyvalleychronicle.com/999/images/ban", "slader.com/amazon-modal/", "slashgear.com/static/banners/", "slayradio.org/images/c64audio.com.gif", "smallseotools.com/js/bioep.js", "smartcompany.com.au/images/stories/sponsored-posts/", "smartname.com/scripts/google_afd_v2.js", "smashingapps.com/banner/", "smh.com.au/images/promo/", "smh.com.au/compareandsave/", "smile904.fm/images/banners/", "smn-news.com/images/banners/", "smn-news.com/images/flash/", "smoothjazznetwork.com/images/buyicon.jpg", "smotrisport.com/ads/", "soccerlens.com/files1/", "soccervista.com/bonus.html", "soccervista.com/sporting.gif", "soccervista.com/bahforgif.gif", "soccerway.com/img/betting/", "soccerway.com/buttons/120x90_", "socialstreamingplayer.crystalmedianetworks.com//async/banner/", "sockshare.com/moo.php", "sockshare.com/rev/", "socsa.org.za/images/banners/", "softcab.com/google.php", "softonic.com/specials_leaderboard/", "softpedia-static.com/images/aff/", "softpedia-static.com/images/afg/", "soldierx.com/system/files/images/sx-mini-1.jpg", "solomonstarnews.com/images/banners/", "solvater.com/images/hd.jpg", "songs.pk/textlinks/", "songspk.link/textlinks/", "songspk.live/taboola-", "songspk.name/imagepk.gif", "songspk.name/textlinks/", "sootoday.com/uploads/banners/", "sorcerers.net/images/aff/", "soundcloud.com/promoted/", "soundcloud.com/audio-ad", "soundspheremag.com/images/banners/", "sourceforge.net/images/ban/", "southafricab2b.co.za/banners/", "southfloridagaynews.com/images/banners/", "sowetanlive.co.za/banners/", "space.com/promo/", "spartoo.eu/footer_tag_iframe_", "speedtv.com/js/interstitial.js", "speedvid.net/ad.htm", "speedvideo.net/img/playerFk.gif", "speedvideo.net/img/pla_", "speroforum.com/images/sponsor_", "spicegrenada.com/images/banners/", "sporcle.com/adn/yak.php", "sportcategory.com/ads/", "sportcategory.org/pu/", "spotflux.com/service/partner.php", "spreaker.net/spots/", "spycss.com/images/hostgator.gif", "squadedit.com/img/peanuts/", "st701.com/stomp/banners/", "stad.com/googlefoot2.php", "stagnitomedia.com/view-banner-", "standard.net/sites/default/files/images/wallpapers/", "standardmedia.co.ke/flash/", "startribune.com/circulars/advertiser_", "startxchange.com/bnr.php", "static.bt.am/ba.js", "static.pes-serbia.com/prijatelji/zero.png", "staticneo.com/neoassets/iframes/leaderboard_bottom.", "steamanalyst.com/a/www/", "steambuy.com/steambuy.gif", "sternfannetwork.com/forum/images/banners/", "steroid.com/dsoct09.swf", "steroid.com/banner/", "sticker.yadro.ru/ad/", "stjohntradewindsnews.com/images/banners/", "stopforumspam.com/img/snelserver.swf", "stopstream.com/ads/", "streamcloud.eu/deliver.php", "streamlive.to/images/iptv.png", "streamlive.to/images/movies10.png", "streamplay.to/images/videoplayer.png", "streamplay.to/js/pu2/", "streams.tv/js/slidingbanner.js", "streams.tv/js/pu.js", "streams.tv/js/bn5.js", "student-jobs.co.uk/banner.", "stuff.tv/client/skinning/", "stupid.news/Javascripts/Abigail.js", "stv.tv/img/player/stvplayer-sponsorstrip-", "sun-fm.com/resources/creative/", "sunriseradio.com/js/rbanners.js", "sunshineradio.ie/images/banners/", "superbike-news.co.uk/absolutebm/banners/", "supermarket.co.za/images/advetising/", "supermonitoring.com/images/banners/", "superplatyna.com/automater.swf", "surfmusic.de/anz", "surfmusic.de/banner", "surfthechannel.com/promo/", "survivalblog.com/marketplace/", "swagmp3.com/cdn-cgi/pe/", "swampbuggy.com/media/images/banners/", "swedishwire.com/images/banners/", "sweepsadvantage.com/336x230-2.php", "swiftco.net/banner/", "swoknews.com/images/banners/", "sxc.hu/img/banner", "systemexplorer.net/sessg.php", "sythe.org/clientscript/agold.png", "sythe.org/bnrs/", "tabla.com.sg/SIA.jpg", "tabloidmedia.co.za/images/signs2.swf", "taipeitimes.com/js/gad.js", "taiwannews.com.tw/etn/images/banner_", "talkers.com/images/banners/", "talkers.com/imagebase/", "talkgold.com/bans/", "talkphotography.co.uk/images/externallogos/banners/", "tamilwire.org/images/banners3/", "tampermonkey.net/bner/", "taxidrivermovie.com/mrskin_runner/", "taxidrivermovie.com/style/sk-p.js", "tbib.org/kona/", "teamfourstar.com/img/918thefan.jpg", "techexams.net/banners/", "techhive.com/ads/", "technewsdaily.com/crime-stats/local_crime_stats.php", "techotopia.com/TechotopiaFiles/contextsky2.html", "techotopia.com/TechotopiaFiles/contextsky1.html", "techpowerup.com/images/bnnrs/", "teesupport.com/wp-content/themes/ts-blog/images/cp-", "tehrantimes.com/banner/", "tehrantimes.com/images/banners/", "telegraph.co.uk/sponsored/", "ten-tenths.com/sidebar.html", "tenmanga.com/files/js/site_skin.js", "tennischannel.com/prud.jpg", "tennischannel.com/tc-button-gif.gif", "tennisworldusa.org/banners/", "terafile.co/i/banners/", "testseek.com/price_pricegrabber_", "text-compare.com/media/global_vision_banner_", "textpattern.com/images/117.gif", "tfd.com/sb/", "thaivisa.com/promotions/banners/", "theartnewspaper.com/aads/", "theasiantoday.com/image/banners/", "theattractionforums.com/images/rbsbanners/", "thebankangler.com/images/banners/", "thebarchive.com/never.js", "thebay.co.uk/banners/", "thebeat99.com/cmsadmin/banner/", "thebull.com.au/admin/uploads/banners/", "thebusinessdesk.com/assets/_files/banners/", "thecharlottepost.com/cache/sql/fba/", "thecnj.com/images/hotel-banner.jpg", "thecorrsmisc.com/msb_banner.jpg", "thecorrsmisc.com/10feet_banner.gif", "thecorrsmisc.com/brokenthread.jpg", "thedailyherald.com/images/banners/", "thedailymash.co.uk/templates/mashtastic/gutters/", "thedailypaul.com/images/amzn-", "thedailysheeple.com/images/banners/", "thedailywtf.com/fblast/", "theday.com/assets/images/sponsorlogos/", "thedirectory.co.zw/banners/", "thedomainstat.com/filemanager/userfiles/banners/", "theedinburghreporter.co.uk/hmbanner/", "thefrontierpost.com/media/banner/", "thegardener.co.za/images/banners/", "thehrdirector.com/assets/banners/", "theispguide.com/premiumisp.html", "theispguide.com/topbanner.asp", "thejournal.ie/media/hpto/", "theleader.info/banner", "theliberianjournal.com/flash/banner", "thelocal.com/scripts/fancybox/", "thelodownny.com/leslog/ads/", "thelyricarchive.com/new/view/", "themag.co.uk/assets/BV200x90TOPBANNER.png", "themidweeksun.co.bw/images/banners/", "theminiforum.co.uk/images/banners/", "themiscellany.org/images/banners/", "thenassauguardian.com/images/banners/", "thenewage.co.za/Image/kingprice.gif", "thenewjournalandguide.com/images/banners/", "thenextweb.com/wp-content/plugins/tnw-siteskin/mobileys/", "theoldie.co.uk/Banners/", "theolympian.com/static/images/weathersponsor/", "theonion.com/ads/", "theorganicprepper.ca/images/banners/", "thepaper24-7.com/SiteImages/Banner/", "thepaper24-7.com/SiteImages/Tile/", "thepatriot.co.bw/images/banners/", "thepeak.fm/images/banners/", "thephuketnews.com/photo/banner/", "theplanetweekly.com/images/banners/", "theportugalnews.com/uploads/banner/", "thepowerhour.com/images/kcaa.jpg", "thepowerhour.com/images/food_summit2.jpg", "thepowerhour.com/images/karatbar1.jpg", "thepowerhour.com/images/numanna.jpg", "thepowerhour.com/images/youngevity.jpg", "thepowerhour.com/images/rickssatellite_banner2.jpg", "therugbyforum.com/trf-images/sponsors/", "thesource.com/magicshave/", "thestandard.com.hk/rotate_", "thestandard.com.hk/banners/", "thestkittsnevisobserver.com/images/banners/", "thesuburban.com/universe/adds/", "thesuburban.com/universe/addsspace/", "thesundaily.my/sites/default/files/twinskyscrapers", "thesweetscience.com/images/banners/", "thetimes.co.uk/public/encounters/", "thetvdb.com/images/jriver_banner.png", "thetvdb.com/images/frugal.gif", "thevideo.me/js/jsmpc.js", "thevideo.me/mba/cds.js", "thevideo.me/player/offers.js", "thevideo.me/js/jspc.js", "thevideo.me/cgi-bin/get_creatives.cgi", "thevideo.me/js/popup.min.js", "thevideo.me/creatives/", "thewb.com/thewb/swf/tmz-adblock/", "theweatheroutlook.com/images/cf-2018-autumn-2.jpg", "thinkbroadband.com/uploads/banners/", "thisgengaming.com/Scripts/widget2.aspx", "thunder106.com//wp-content/banners/", "ticketnetwork.com/images/affiliates/", "time4tv.com/tlv.", "times-herald.com/pubfiles/", "times.co.sz/files/banners/", "timesnow.tv/googlehome.cms", "timesofoman.com/FrontInc/top.aspx", "timesofoman.com/siteImages/MyBannerImages/", "timestalks.com/images/sponsor-", "tindleradio.net/banners/", "tinyurl.com/firefox_banner_", "titantv.com/gravity.ashx", "tnij.org/rotator", "tny.cz/oo/", "toolslib.net/assets/img/a_dvt/", "toomuchnews.com/dropin/", "toonova.com/images/site/front/xgift-", "topalternate.com/assets/sponsored_links-", "topfriv.com/popup.js", "topix.com/ajax/krillion/", "torrent-finder.info/cont.html", "torrent-finder.info/cont.php", "torrentbit.net/images/1click/button-long.png", "torrentbox.sx/img/download_direct.png", "torrentcrazy.com/pnd.js", "torrentcrazy.com/img/wx.png", "torrentdownloads.me/templates/new/images/download_button2.jpg", "torrentdownloads.me/templates/new/images/download_button3.jpg", "torrenteditor.com/img/graphical-network-monitor.gif", "torrentfreak.com/images/torguard.gif", "torrentfreak.com/images/vuze.png", "torrentfunk.com/sw1.js", "torrentfunk.com/affprofslider.js", "torrentking.eu/js/script.packed.js", "torrentproject.org/out/", "torrentroom.com/js/torrents.js", "torrents.net/wiget.js", "torrents.net/btguard.gif", "torrentv.org/images/tsdd.jpg", "torrentv.org/images/tsdls.jpg", "total-croatia-news.com/images/banners/", "totalcmd.pl/img/olszak.", "totalcmd.pl/img/billboard_", "totalcmd.pl/img/nucom.", "totalguitar.net/images/tgMagazineBanner.gif", "toynews-online.biz/media/banners/", "toynewsi.com/a/", "toywiz.com/lower-caption-global.html", "tpb.piraten.lu/static/img/bar.gif", "tradewinds.vi/images/banners/", "traduguide.com/banner/", "trailrunnermag.com/images/takeovers/", "trgoals.es/adk.html", "tribune.com.ng/images/banners/", "tribune242.com/pubfiles/", "tripadvisor.com/adp/", "triplehfm.com.au/images/banners/", "truck1.eu/_BANNERS_/", "trustedreviews.com/mobile/widgets/html/promoted-phones", "trutv.com/includes/mods/iframes/mgid-blog.php", "tsdmemphis.com/images/banners/", "tsear.ch/data/tbot.jpg", "tubehome.com/imgs/undressme", "tubeplus.me/resources/js/codec.js", "tullahomanews.com/news/banners/", "tullahomanews.com/news/tn-popup.js", "tune.pk/plugins/cb_tunepk/ads/", "turboimagehost.com/p1.js", "turboimagehost.com/p.js", "turboyourpc.com/images/affiliates/", "tusfiles.net/images/tusfilesb.gif", "tusfiles.net/i/dll.png", "tuspics.net/onlyPopupOnce.js", "tv-onlinehd.com/publi/", "tv4chan.com/iframes/", "tvbrowser.org/logo_df_tvsponsor_", "tvcatchup.com/wowee/", "tvducky.com/imgs/graboid.", "tvguide.co.uk/_ui/images/skysportstab2.", "tvguide.co.uk/images/skyskinus.", "tvsubtitles.net/banners/", "u.tv/images/sponsors/", "u.tv/images/misc/progressive.png", "u.tv/utvplayer/jwplayer/ova.swf", "ubuntugeek.com/images/od.jpg", "ubuntugeek.com/images/ubuntu1.png", "ubuntugeek.com/images/dnsstock.png", "ufonts.com/gfx/uFonts_Banner5.png", "ugo.com/takeover/", "ujfm.co.za/images/banners/", "uk-mkivs.net/uploads/banners/", "ukbusinessforums.co.uk/adblock/", "ukcampsite.co.uk/banners/", "ukfindit.com/wipedebtclean.png", "ultimate-guitar.com/_img/promo/takeovers/", "ultimate-guitar.com/_img/bgd/bgd_main_", "ultimatehandyman.co.uk/ban.txt", "ultimatehandyman.org/bh1.gif", "ultimatewindowssecurity.com/images/banner80x490_WSUS_FreeTool.jpg", "ultimatewindowssecurity.com/images/patchzone-resource-80x490.jpg", "ultimatewindowssecurity.com/images/spale.swf", "ultimatewindowssecurity.com/securitylog/encyclopedia/images/allpartners.swf", "umbrelladetective.com/uploaded_files/banners/", "unblocked.mx/ttpu.js", "uncoached.com/smallpics/ashley", "uniindia.com/eng/bannerbottom.php", "uniindia.com/eng/bannertopright.php", "uniindia.com/eng/banners/", "uniindia.com/eng/bannerheader.php", "uniindia.com/eng/bannerrightside.php", "uniindia.net/eng/banners/", "uniquefm.gm/images/banners/", "universalhub.com/bban/", "unknowncheats.me/forum/images/ez/csgoban1.gif", "unknowncheats.me/forum/images/spon/", "unknowncheats.me/hori.html", "uploadedtrend.com/turboflirt.gif", "uploading.com/static/banners/", "uploadlw.com/js/cash.js", "uploadshub.com/downloadfiles/download-button-blue.gif", "uptobox.com/images/downloaden.gif", "uptobox.com/images/download.png", "uptobox.com/sw.js", "urbanchristiannews.com/ucn/sidebar-", "urbanfonts.com/images/fonts_com/", "urbanvelo.org/sidebarbanner/", "urlcash.org/abp/", "urlcash.org/banners/", "urlcash.org/newpop.js", "usanetwork.com/_js/ad.js", "uschess.org/images/banners/", "usenet-crawler.com/astraweb.png", "usenet-crawler.com/purevpn.png", "ustream.tv/takeover/", "uvnc.com/img/housecall.", "uxmatters.com/images/sponsors/", "valleyplanet.com/images/banners/", "vanityfair.com/custom/ebook-ad-bookbiz", "vasco.co.za/images/banners/", "vault.starproperty.my/widget/", "vcdq.com/tag.html", "vectorportal.com/img/ss_banner", "verizon.com/ads/", "vfs-uk-in.com/images/webbanner-", "vhd.me/custom/interstitial", "viadeo.com/pub/", "viator.com/analytics/percent_mobile_hash.js", "vidbull.com/tags/vidbull_bnr.png", "vidcloud.co/js/lib/", "video2mp3.net/images/download_button.png", "video44.net/gogo/qc.js", "video44.net/gogo/a_d_s.", "videobull.to/wp-content/themes/videozoom/images/stream-hd-button.gif", "videobull.to/wp-content/themes/videozoom/images/gotowatchnow.png", "videodownloadtoolbar.com/fancybox/", "videogamesblogger.com/takeover.html", "videolan.org/images/events/animated_packliberte.gif", "videos.com/click", "videos.mediaite.com/decor/live/white_alpha_60.", "videowood.tv/assets/js/popup.js", "videowood.tv/pop2", "videowood.tv/ads", "vidhog.com/images/download_banner_", "vidspot.net/s/xfs.min.js", "vidvib.com/vidvibpopa.", "vidvib.com/vidvibpopb.", "viewdocsonline.com/images/banners/", "vigilante.pw/img/partners/", "villagevoice.com/img/VDotDFallback-large.gif", "vinaora.com/xmedia/hosting/", "vipbox.co/js/bn.js", "vipbox.eu/pu/", "vipbox.sx/blackwhite/", "vipbox.tv/js/layer-", "vipbox.tv/js/layer.js", "vipbox.tv/blackwhite/", "vipi.tv/ad.php", "vipleague.me/blackwhite/", "vipleague.se/js/vip.js", "virginislandsthisweek.com/images/336-", "virginislandsthisweek.com/images/728-", "virtual-hideout.net/banner", "virtualtourist.com/adp/", "vistandpoint.com/images/banners/", "vitalfootball.co.uk/app-interstitial/", "vitalmtb.com/assets/vital.aba-", "vitalmtb.com/api/", "vitalmtb.com/assets/ablock-", "vnbitcoin.org/gawminers.png", "vnbitcoin.org/140_350.jpg", "vodlocker.com/images/acenter.png", "vodo.net/static/images/promotion/utorrent_plus_buy.png", "vonradio.com/grfx/banners/", "vosizneias.com/perms/", "vox-cdn.com/campaigns_images/", "vpsboard.com/display/", "waamradio.com/images/sponsors/", "wadldetroit.com/images/banners/", "wantedinmilan.com/images/banner/", "wantitall.co.za/images/banners/", "warriorforum.com/vbppb/", "washingtonexaminer.com/house_creative.php", "washtimes.com/static/images/SelectAutoWeather_v2.gif", "washtimes.com/js/dart.", "washtimes.net/banners/", "watchcartoononline.com/inc/siteskin.", "watchcartoononline.com/pve.php", "watchfomny.tv/Menu/A/", "watchfree.to/download.php", "watchfree.to/topright.php", "watchfreemovies.ch/js/lmst.js", "watchop.com/player/watchonepiece-gao-gamebox.swf", "watchseries-online.se/jquery.js", "watchseries.eu/js/csspopup.js", "watchseries.eu/images/affiliate_buzz.gif", "watchseries.eu/images/download.png", "watchuseek.com/media/wus-image.jpg", "watchuseek.com/flashwatchwus.swf", "watchuseek.com/media/banner_", "watchuseek.com/media/1900x220_", "watchuseek.com/media/longines_legenddiver.gif", "watchuseek.com/site/forabar/zixenflashwatch.swf", "watchuseek.com/media/clerc-final.jpg", "wavelengthcalculator.com/banner", "way2sms.com/w2sv5/js/fo_", "wbal.com/absolutebm/banners/", "wbj.pl/im/partners.gif", "wcbm.com/includes/clientgraphics/", "wctk.com/banner_rotator.php", "wdwinfo.com/js/swap.js", "wealthycashmagnet.com/upload/banners/", "wearetennis.com/img/common/logo_bnp_", "wearetennis.com/img/common/bnp-logo.png", "wearetennis.com/img/common/bnp-logo-", "weather365.net/images/banners/", "weatheroffice.gc.ca/banner/", "webdesignerdepot.com/wp-content/themes/wdd2/fancybox/", "webdesignerdepot.com/wp-content/plugins/md-popup/", "webdevforums.com/images/inmotion_banner.gif", "webhostingtalk.com/images/style/lw-160x400.jpg", "webhostingtalk.com/images/style/lw-header.png", "webhostranking.com/images/bluehost-coupon-banner-1.gif", "webmailnotifier.mozdev.org/etc/af/", "webnewswire.com/images/banner", "websitehome.co.uk/seoheap/cheap-web-hosting.gif", "webstatschecker.com/links/", "webtv.ws/adds/", "weddingtv.com/src/baners/", "weedwatch.com/images/banners/", "wegoted.com/uploads/memsponsor/", "wegoted.com/includes/biogreen.swf", "wegoted.com/uploads/sponsors/", "weknowmemes.com/sidesky.", "wgfaradio.com/images/banners/", "whatismyip.com/images/vyprvpn_", "whatismyip.com/images/VYPR__125x125.png", "whatismyip.org/ez_display_au_fillslot.js", "whatismyreferer.com/onpage.png", "whatmobile.com.pk/banners/", "whatmyip.co/images/speedcoin_", "whatreallyhappened.com/webpageimages/banners/uwslogosm.jpg", "whatsabyte.com/images/Acronis_Banners/", "whatsnewonnetflix.com/assets/blockless-ad-", "whatson.co.za/img/hp.png", "whatsonnamibia.com/images/banners/", "whatsonstage.com/images/sitetakeover/", "whatsthescore.com/logos/icons/bookmakers/", "whdh.com/images/promotions/", "wheninmanila.com/wp-content/uploads/2012/12/Marie-France-Buy-1-Take-1-Deal-Discount-WhenInManila.jpg", "wheninmanila.com/wp-content/uploads/2014/02/DTC-Hardcore-Quadcore-300x100.gif", "wheninmanila.com/wp-content/uploads/2011/05/Benchmark-Email-Free-Signup.gif", "wheninmanila.com/wp-content/uploads/2014/04/zion-wifi-social-hotspot-system.png", "whispersinthecorridors.com/banner", "whitepages.ae/images/UI/FC/", "whitepages.ae/images/UI/SRA/", "whitepages.ae/images/UI/MR/", "whitepages.ae/images/UI/SRB/", "whitepages.ae/images/UI/WS/", "whitepages.ae/images/UI/LB/", "whitepages.ae/images/UI/SR/", "who.is/images/domain-transfer2.jpg", "whoer.net/images/vlab50_", "whoer.net/images/pb/", "whoer.net/images/vpnlab20_", "whois.net/dombot.php", "whois.net/images/banners/", "whoownsfacebook.com/images/topbanner.gif", "widih.org/banners/", "wiilovemario.com/images/fc-twin-play-nes-snes-cartridges.png", "wikia.com/__are", "wikia.com/__varnish_", "wikinvest.com/wikinvest/ads/", "wikinvest.com/wikinvest/images/zap_trade_", "wildtangent.com/leaderboard", "windows.net/script/p.js", "winnfm.com/grfx/banners/", "winpcap.org/assets/image/banner_", "wirenh.com/images/banners/", "witbankspurs.co.za/layout_images/sponsor.jpg", "witteringsfromwitney.com/wp-content/plugins/popup-with-fancybox/", "wjie.org/media/img/sponsers/", "wjunction.com/images/rectangle", "wjunction.com/images/468x60", "wjunction.com/images/constant/", "wksu.org/graphics/banners/", "wkyt.com/flyermodules", "wlcr.org/banners/", "wlrfm.com/images/banners/", "wned.org/underwriting/sponsors/", "wnpv1440.com/images/banners/", "wnst.net/img/coupon/", "wolf-howl.com/wp-content/banners/", "worddictionary.co.uk/static//inpage-affinity/", "wordwebonline.com/img/122x36ccbanner.png", "work-day.co.uk/pub_", "workingdays.ca/pub_", "workingdays.org/pub_", "workingdays.us/pub_", "worldarchitecturenews.com/flash_banners/", "worldarchitecturenews.com/banner/", "worldometers.info/L300L.html", "worldometers.info/L300R.html", "worldometers.info/L728.html", "worldradio.ch/site_media/banners/", "worldstadiums.com/world_stadiums/bugarrishoes/", "worldstagegroup.com/worldstagenew/banner/", "worldstagegroup.com/banner/", "worthofweb.com/images/wow-ad-", "wowwiki.com/__varnish_", "wpcv.com/includes/header_banner.htm", "wptmag.com/promo/", "wqah.com/images/banners/", "wqam.com/partners/", "wqxe.com/images/sponsors/", "wranglerforum.com/images/sponsor/", "wrc.com/swf/homeclock_edox_hori.swf", "wrc.com/img/sponsors-", "wrcjfm.org/images/banners/", "wrlr.fm/images/banners/", "wshh.me/vast/", "wsj.net/pb/pb.js", "wsj.net/internal/krux.js", "wttrend.com/images/hs.jpg", "wunderground.com/geo/swfad/", "wvbr.com/images/banner/", "wwbf.com/b/topbanner.htm", "xbitlabs.com/images/banners/", "xbitlabs.com/cms/module_banners/", "xbox-hq.com/html/images/banners/", "xbox-scene.com/crave/logo_on_white_s160.jpg", "xiaopan.co/Reaver.png", "ximagehost.org/myman.", "xing.com/xas/", "xomreviews.com/sponsors/", "xoops-theme.com/images/banners/", "xscores.com/livescore/banners/", "xsreviews.co.uk/style/bgg2.jpg", "xtremesystems.org/forums/brotator/", "xup.in/layer.php", "yahoo.com/ysmload.html", "yahoo.com/livewords/", "yahoo.com/neo/darla/", "yahoo.com/__darla/", "yahoo.com/sdarla/", "yahoo.com/contextual-shortcuts", "yahoo.com/darla/", "yamgo.mobi/images/banner/", "yellowpage-jp.com/images/banners/", "yellowpages.ae/UI/FC/", "yellowpages.ae/UI/ST/", "yellowpages.ae/UI/LB/", "yellowpages.ae/UI/MR/", "yellowpages.ae/UI/WM/", "yellowpages.ae/UI/SR/", "yellowpages.ae/UI/WA/", "yellowpages.com.jo/uploaded/banners/", "yellowpages.com.lb/uploaded/banners/", "yellowpageskenya.com/images/laterals/", "yfmghana.com/images/banners/", "yifymovies.to/js/rx/yx.js", "yopmail.com/fbd.js", "yorkshirecoastradio.com/resources/creative/", "yotv.co/class/adjsn3.js", "yotv.co/ad/", "yotv.co/adds/", "youngrider.com/images/sponsorships/", "yourbittorrent.com/images/lumovies.js", "yourbittorrent.com/downloadnow.png", "yourepeat.com/revive_wrapper", "yourfilehost.com/ads/", "yourindustrynews.com/ads/", "yourmuze.fm/images/banner_ym.png", "yourmuze.fm/images/audionow.png", "yourradioplace.com//images/banners/", "yourradioplace.com/images/banners/", "yourupload.com/rotate/", "yourwire.net/images/refssder.gif", "youserials.com/i/banner_pos.jpg", "youtube.com/pagead/", "youtube.com/get_midroll_", "youwatch.org/vod-str.html", "youwatch.org/driba.html", "youwatch.org/iframe1.html", "youwatch.org/9elawi.html", "ytmnd.com/ugh", "zabasearch.com/search_box.php", "zambiz.co.zm/banners/", "zamimg.com/shared/minifeatures/", "zamimg.com/images/skins/", "zap2it.com/wp-content/themes/overmind/js/zcode-", "zattoo.com/ads/", "zawya.com/ads/", "zawya.com/brands/", "zdnet.com/mds/", "zdnet.com/medusa/", "zeetvusa.com/images/hightlow.jpg", "zeetvusa.com/images/CARIBBEN.jpg", "zeetvusa.com/images/SevaWeb.gif", "zerochan.net/skyscraper.html", "zeropaid.com/images/", "ziddu.com/images/140x150_egglad.gif", "ziddu.com/images/globe7.gif", "ziddu.com/images/wxdfast/", "zigzag.co.za/images/oww-", "zipcode.org/site_images/flash/zip_v.swf", "zomobo.net/images/removeads.png", "zoneradio.co.za/img/banners/", "zoomin.tv/decagonhandler/", "zootoday.com/pub/21publish/Zoo-navtop-casino_", "zootoday.com/pub/21publish/Zoo-navtop-poker.gif", "zoozle.org/if.php", "zophar.net/files/tf_", "zorrovpn.com/static/img/promo/", "zshares.net/fm.html", "zurrieqfc.com/images/banners/", "hdmoza.com/nb/", "kickass.cd/test.js", "adsrt.com/sw.js", "sendit.cloud/images/banner/", "sendit.cloud/sw.js", "downloadpirate.com/sw.js", "intoupload.net/sw.js", "gorillavid.in/script.js", "swatchseries.to/bootstrap.min.js", "zippyshare.com/sw.js", "sfiles.org/sw.js", "supercheats.com/js/yavli.js", "fitnesshe.co.za/images/abs.png", "fitnessmag.co.za/images/abs.png", "gannett-cdn.com/appservices/partner/sourcepoint/sp-mms-client.js", "getdebrid.com/blocker.js", "hindustantimes.com/_js/browser-detect.min.js", "hindustantimes.com/res/js/ht-modified-script.js", "hindustantimes.com/res/js/ht-script", "indiatimes.com/detector.cms", "techweb.com/adblocktrack", "vapingunderground.com/js/vapingunderground/fucking_adblock.js", "ytconv.net/site/adblock_detect", "anandabazar.com/js/anandabazar-bootstrap/custom.js", "livehindustan.com/js/BlockerScript.js", "213.174.140.38/bftv/js/msn-", "244pix.com/webop.jpg", "24porn7.com/24roll.html", "24porn7.com/toonad/", "24porn7.com/right3.php", "24porn7.com/float/float_adplib.js", "24porn7.com/300.php", "24porn7.com/odd.php", "24porn7.com/imads/", "24porn7.com/banned/", "24porn7.com/ebanners/", "24video.net/din_new6.php", "2adultflashgames.com/images/v12.gif", "2adultflashgames.com/teaser/teaser.swf", "2adultflashgames.com/img/", "3movs.com/contents/content_sources/", "3yen.com/wfn_", "4sex4.com/pd/", "4ufrom.me/xpw.gif", "5ilthy.com/porn.php", "absoluporn.com/code/pub/", "adrive.com/images/fc_banner.jpg", "adult-sex-games.com/images/promo/", "adultdvdtalk.com/studios/", "adultfilmdatabase.com/graphics/banners/", "adultfyi.com/images/banners/", "adultwork.com/images/AWBanners/", "alladultnetwork.tv/main/videoadroll.xml", "alotporn.com/media/banners/", "amateur-desire.com/pics/sm_", "amateur-desire.com/pics/724x90d.jpg", "amateuralbum.net/affb.html", "analpornpix.com/agent.php", "andtube.com/ban_", "anon-v.com/neverlikedcocksmuch.php", "anon-v.com/titswerentoiledup.php", "anysex.com/b/", "anysex.com/content_sources/", "asexstories.com/010ads/", "asgayas.com/floater/", "asgayas.com/popin.js", "asianpornmovies.com/images/banners/", "assfuck.xxx/uploads/banners/", "assfuck.xxx/uploads/provider-banners/", "asspoint.com/images/banners/", "babblesex.com/js/misc.js", "babedrop.com/babelogger_images/", "babesandstars.com/images/a/", "babesandstars.com/thumbs/paysites/", "babeshows.co.uk/fvn53.jpg", "babesmachine.com/html/", "badjojo.com/js/tools.js", "bangyoulater.com/images/banners_", "bangyoulater.com/pages/aff.php", "befuck.com/js/adpbefuck", "befuck.com/befuck_html/", "bellyboner.com/facebookchatlist.php", "between-legs.com/banners2/", "bigboobs.hu/banners/", "blackredtube.com/fadebox2.js", "bonbonme.com/js/rightbanner.js", "bonbonme.com/js/dticash/", "bonbonme.com/js/cams.js", "bonbonsex.com/js/dl/bottom.js", "bonbonsex.com/js/workhome.js", "boobieblog.com/submityourbitchbanner3.jpg", "boobieblog.com/TilaTequilaBackdoorBanner2.jpg", "bos.so/icloud9.html", "bralesscelebs.com/320x240ps.gif", "bralesscelebs.com/160x600hcp.gif", "bralesscelebs.com/160x600ps.gif", "bravotube.net/dp.html", "bunnylust.com/sponsors/", "camvideos.tv/tpd.", "camwhores.tv/banners/", "camwhores.tv/contents/other/player/", "canadianhottie.ca/images/banners/", "celeb.gate.cc/banner/", "cfake.com/images/a/", "chanweb.info/en/adult/hc/local_include/", "chatrandom.com/js/slider.js", "chubby-ocean.com/banner/", "clips-and-pics.org/clipsandpics.js", "comdotgame.com/vgirl/", "crackwhoreconfessions.com/images/banners/", "crazyshit.com/p0pzIn.js", "creampietubeporn.com/ctp.html", "creampietubeporn.com/porn.html", "daporn.com/_p4.php", "dbnaked.com/ban/", "definebabe.com/sponsor_", "definebabe.com/db/images/leftnav/webcams2.png", "definebabe.com/db/js/pcme.js", "definebabe.com/traders/", "definebabe.com/sponsor/", "definefetish.com/df/js/dpcm.js", "deliciousbabes.org/banner/", "deliciousbabes.org/media/banners/", "devatube.com/img/partners/", "diamond-tgp.com/fp.js", "dickbig.net/scr/", "dirtypriest.com/sexpics/", "dixyporn.com/include/", "dominationtube.com/exit.js", "downloadableporn.org/popaaa/", "drtuber.com/templates/frontend/white/js/embed.js", "easypic.com/js/easypicads.js", "eccie.net/eros/", "eccie.net/buploads/", "eegay.com/Scripts/nxpop.js", "efukt.com/js/3rdparty.js", "efukt.com/affiliates/", "efukt.com/menu/", "empflix.com/embedding_player/600x474_", "entensity.net/crap/", "eporner.com/cppb/", "eskimotube.com/kellyban.gif", "extreme-board.com/bannrs/", "extremetube.com/player_related", "fakeporn.tv/bb/", "fantasti.cc/fabl.", "fantasti.cc/_special/", "fapdick.com/uploads/1fap_", "fapdick.com/uploads/fap_", "fapxl.com/view/spot/", "femdom-fetish-tube.com/popfemdom.js", "filthyrx.com/inline.php", "filthyrx.com/rx.js", "filthyrx.com/images/porno/", "finehub.com/p3.js", "fleshbot.com/wp-content/themes/fbdesktop_aff/images/af", "floppy-tits.com/iframes/", "fooktube.com/badges/pr/", "free-celebrity-tube.com/js/freeceleb.js", "freebunker.com/includes/js/cat.js", "freeones.com/banners/", "freeporn.to/wpbanner/", "freepornvs.com/im.js", "fuckuh.com/pr_ad.swf", "funny-games.biz/banners/", "fux.com/assets/adblock", "galleries-pornstar.com/thumb_top/", "gals4free.net/images/banners/", "gamesofdesire.com/images/banners/", "gapeandfist.com/uploads/thumbs/", "gayporntimes.com/img/GP_Heroes.jpg", "gaytube.com/chacha/", "gfycatporn.com/toon.gif", "gggtube.com/images/banners/", "ghettotube.com/images/banners/", "gifsfor.com/gifs.js", "gifsfor.com/msn.js", "girlfriendvideos.com/ad", "girlfriendvideos.com/pcode.js", "girlsintube.com/images/get-free-server.jpg", "girlsnaked.net/gallery/banners/", "girlsofdesire.org/media/banners/", "girlsofdesire.org/banner/", "glamour.cz/banners/", "gloryholegirlz.com/images/banners/", "goldporntube.com/iframes/", "gotgayporn.com/Watermarks/", "grannysexforum.com/filter.php", "h2porn.com/js/etu_r.js", "h2porn.com/contents/content_sources/", "h2porn.com/ab/", "hanksgalleries.com/aff-", "hanksgalleries.com/galleryimgs/", "hanksgalleries.com/vg_ad_", "hanksgalleries.com/gallery-", "hanksgalleries.com/stxt_", "hardcoresexgif.com/hcsg.js", "hardcoresexgif.com/msn.js", "hardsextube.com/preroll/getiton/", "hardsextube.com/zone.php", "hardsextube.com/testxml.php", "hawaiipornblog.com/post_images/", "hclips.com/js/m.js", "hcomicbook.com/banner/", "hdporn.in/js/pops2.", "hdporn.in/images/rec/", "hdporn.net/images/hd-porn-banner.gif", "hdzog.com/contents/cst/", "hdzog.com/contents/content_sources/", "hdzog.com/hdzog/vanload/", "hdzog.com/hdzog.php", "heavy-r.com/a/", "heavy-r.com/js/overlay.js", "heavy-r.com/js/imbox.js", "hebus.com/p/hebusx/", "hellporno.com/iframes/", "hentai-foundry.com/themes/Hentai/images/hu/hu.jpg", "hentaistream.com/out/", "hentaistream.com/wp-includes/images/mofos/webcams_", "hentaistream.com/wp-includes/images/bg-", "hgimg.com/js/beacon.", "home-made-videos.com/krijgjetoch.php", "home-made-videos.com/kutstelers.js", "homegrownfreaks.net/homegfreaks.js", "homeprivatevids.com/banner2.shtml", "homeprivatevids.com/banners.shtml", "hornygamer.com/images/promo/", "hornywhores.net/img/double.jpg", "hornywhores.net/img/zevera_rec.jpg", "hothag.com/img/banners/", "hotshame.com/hotshame_html/", "hotshame.com/js/adphotshame", "hotshame.com/iframes/", "hottubeclips.com/stxt/banners/", "hungangels.com/vboard/friends/", "hustler.com/backout-script/", "iceporn.com/templates/base_master/js/jquery.shows.js", "iceppsn.com/templates/frontend/iceporn_v2/js/_piceporn.js", "imagearn.com/img/picBanner.swf", "imagebam.com/files/tpd.png", "imagecarry.com/top", "imagecarry.com/down", "imagefap.com/019ce.php", "imagefap.com/ajax/uass.php", "imagehyper.com/prom/", "imagepost.com/includes/dating/", "imagepost.com/stuff/", "imgadult.com/ea/", "imgadult.com/altiframe.php", "imgbabes.com/element.js", "imgbabes.com/ero-foo.html", "imgbabes.com/ja.html", "imgflare.com/exo.html", "imghost.us.to/xxx/content/system/js/iframe.html", "imgwet.com/aa/", "imperia-of-hentai.net/banner/", "inhumanity.com/cdn/affiliates/", "intporn.org/scripts/asma.js", "iseekgirls.com/js/fabulous.js", "iseekgirls.com/rotating_", "iseekgirls.com/g/pandoracash/", "jav-porn.net/js/popup.js", "jav-porn.net/js/popout.js", "javhub.net/img/r.jpg", "javporn.in/clicunder.js", "javsin.com/vip.html", "javstreaming.net/app/forad.js", "jjvids.com/i/", "justporno.tv/ad/", "keezmovies.com/iframe.html", "kindgirls.com/banners2/", "konachan.com/images/bam/", "laxtime.com/rotation/", "lifeselector.com/banner/", "linksave.in/fopen.html", "literotica.com/images/banners/", "literotica.com/images/lit_banners/", "live-porn.tv/adds/", "liveandchat.tv/bana-/", "lubetube.com/js/cspop.js", "lucidsponge.pl/pop_", "lukeisback.com/images/boxes/", "luscious.net/luscious.", "luscious.net/revive.", "luscious.net/lamia205.", "luxuretv.com/includes/pop/", "madmovs.com/rec/", "madthumbs.com/madthumbs/sponsor/", "mallandrinhas.net/flutuante", "mansurfer.com/flash_promo/", "matureworld.ws/images/banners/", "maxjizztube.com/downloadfreemovies.php", "meendo.com/promos/", "milkmanbook.com/dat/promo/", "miragepics.com/images/11361497289209202613.jpg", "mobilepornmovies.com/images/banners/", "monstertube.com/images/access_", "monstertube.com/images/bottom-features.jpg", "monstertube.com/images/vjoin.", "monstertube.com/images/vjoin_", "morebabes.to/morebabes.js", "motherless.com/images/banners/", "movierls.net/abecloader", "mp3musicengine.com/bearshare_logo.", "mp3musicengine.com/images/freewatchtv1.", "mrstiff.com/view/movie/finished/", "mrstiff.com/view/context/", "mrstiff.com/view/movie/bar/", "mrstiff.com/uploads/paysite/", "multporn.net/frunti_", "mygirlfriendvids.net/js/popall1.js", "myhentai.tv/popsstuff.", "myslavegirl.org/follow/go.js", "naked-sluts.us/prpop.js", "nakednepaligirl.com/d/", "namethatpornstar.com/topphotos/", "naughty.com/js/popJava.js", "naughtyblog.org/pr1pop.js", "naughtyblog.org/b_load.php", "netasdesalim.com/js/netas", "netronline.com/Include/burst.js", "niceandquite.com/nice.js", "niceandquite.com/msn.js", "niceyoungteens.com/ero-advertising", "niceyoungteens.com/mct.js", "nonktube.com/brazzers/", "nonktube.com/popembed.js", "nonktube.com/nuevox/midroll.php", "novoporn.com/imagelinks/", "ns4w.org/images/promo/", "ns4w.org/images/vod_", "ns4w.org/gsm.js", "nudebabes.ws/galleries/banners/", "nudevista.com/_/exo_", "nudevista.com/_/pp.", "nudevista.com/_/teasernet", "nudography.com/photos/banners/", "nuvid.com/videos_banner.html", "nuvid.com/b4.php", "olderhill.com/ubr.js", "onlinestars.net/br/", "onlinestars.net/ban/", "openjavascript.com/jtools/jads.", "orgyxxxhub.com/content/lib/", "pastime.biz/images/interracial-porn.gif", "pastime.biz/images/iloveint.gif", "perfectgirls.net/b/", "perfectgirls.net/exo/", "phncdn.com/images/skin/", "phncdn.com/iframe", "phncdn.com/images/banners/", "phncdn.com/mobile/js/interstitial-min.js", "phncdn.com/images/premium/", "phncdn.com/images/premium_", "phun.org/phun/gfx/banner/", "pichunter.com/deals/", "pichunter.com/creatives/", "picleet.com/inter_picleet.js", "picp2.com/img/putv", "picsexhub.com/rec/", "picsexhub.com/js/pops.", "picsexhub.com/js/pops2.", "picturedip.com/windowfiles/dhtmlwindow.css", "picturedip.com/modalfiles/modal.js", "picturescream.com/porn_movies.gif", "picturescream.com/top_banners.html", "picturevip.com/imagehost/top_banners.html", "picxme.com/js/pops.", "picxme.com/rec/", "pink-o-rama.com/Brothersincash", "pink-o-rama.com/Nscash", "pink-o-rama.com/Fetishhits", "pink-o-rama.com/Karups", "pink-o-rama.com/Teendreams", "pink-o-rama.com/Fuckyou", "pink-o-rama.com/Privatecash", "pink-o-rama.com/Royalcash/", "pink-o-rama.com/Blazingbucks", "pink-o-rama.com/Pimproll/", "pink-o-rama.com/Gammae", "pink-o-rama.com/Longbucks/", "pinkrod.com/iframes/", "pinkrod.com/js/adppinkrod", "pinkrod.com/pinkrod_html/", "pixroute.com/spl.js", "placepictures.com/Frame.aspx", "planetsuzy.org/kakiframe/", "playgirl.com/pg/media/prolong_ad.png", "playpornx.net/pu/", "plumper6.com/images/ban_pp.jpg", "pontoperdido.com/js/webmessenger.js", "porn-w.org/images/lsb.gif", "porn-w.org/images/cosy/", "porn-w.org/images/ls.gif", "porn-w.org/chili.php", "porn-w.org/images/zevera.png", "porn-w.org/images/chs.gif", "porn.com/js/pu.js", "porn.com/assets/partner_", "porn8x.net/js/outtrade.js", "porn8x.net/js/popup.js", "pornalized.com/pornalized_html/closetoplay_", "pornalized.com/contents/content_sources/", "pornalized.com/js/adppornalized5.js", "pornbay.org/popup.js", "pornbb.org/adsnov.", "pornbb.org/images/your_privacy", "pornbus.org/includes/js/ex.js", "pornbus.org/includes/js/layer.js", "pornbus.org/includes/js/cat.js", "pornbus.org/includes/js/bgcont.js", "pornbus.org/includes/js/exa.js", "porncor.com/sitelist.php", "porndoe.com/deliverAbc/", "pornerbros.com/p_bnrs/", "pornfanplace.com/rec/", "pornfanplace.com/js/pops.", "porngals4.com/img/b/", "pornhub.com/catagories/costume/", "pornhub.com/jpg/", "pornhub.com/front/alternative/", "pornhub.com/channels/pay/", "pornhub.phncdn.com/images/campaign-backgrounds/", "pornhub.phncdn.com/misc/xml/preroll.xml", "pornizer.com/_Themes/javascript/cts.js", "pornleech.is/pornleech_", "pornmaturetube.com/content2/", "pornmaturetube.com/show_adv.", "pornmaturetube.com/eureka/", "pornmaturetube.com/content/", "pornnavigate.com/feeds/delivery.php", "pornoid.com/pornoid_html/", "pornoid.com/iframes/bottom", "pornoid.com/contents/content_sources/", "pornoid.com/js/adppornoid", "pornoinside.com/efpop.js", "pornorips.com/hwpop.js", "pornosexxxtits.com/rec/", "pornoxo.com/tradethumbs/", "pornpause.com/fakevideo/", "pornper.com/mlr/", "pornpics.com/pornpics.", "pornpics.com/assets/sites/", "pornshare.biz/2.js", "pornshare.biz/1.js", "pornstreet.com/siteunder.js", "porntalk.com/rec/", "porntalk.com/img/banners/", "porntube.com/ads|", "porntube.com/adb/", "pornup.me/js/pp.js", "pornwikileaks.com/adultdvd.com.jpg", "pureandsexy.org/banner/", "purepornvids.com/randomadseb.", "putascaseiras.com/botao/", "pwpwpoker.com/images/banners/", "raincoatreviews.com/images/banners/", "rampant.tv/images/sexypics/", "realgfporn.com/js/popall.js", "realgfporn.com/js/realgfporn.js", "realhomesex.net/floater.js", "realhomesex.net/pop/", "redtube.com/barelylegal/", "redtube.com/wierd/", "redtube.com/sexychicks/", "redtube.com/nymphos/", "redtube.com/bestporn/", "rextube.com/plug/iframe.asp", "rexxx.com/banner", "rude.com/js/PopupWindow.js", "rule34.xxx/r34.js", "rule34.xxx/bf/", "rusdosug.com/Fotos/Banners/", "russiansexytube.com/js/video_popup.js", "russiansexytube.com/js/spc_banners_init.js", "scorehd.com/banner/", "scorevideos.com/banner/", "seaporn.org/scripts/life.js", "seemygf.com/webmasters/", "sendvid.com/tpd.png", "sensualgirls.org/banner/", "sensualgirls.org/media/banners/", "sex-techniques-and-positions.com/123ima/", "sex-techniques-and-positions.com/banners", "sex3.com/if/", "sex3dtoons.com/im/", "sexilation.com/wp-content/uploads/2013/01/Untitled-1.jpg", "sextube.com/lj.js", "sextubebox.com/ab2.shtml", "sextubebox.com/ab1.shtml", "sextvx.com/static/images/tpd-", "sexuhot.com/splayer.js", "sexuhot.com/images/xbanner", "sexvideogif.com/svg.js", "sexvideogif.com/msn.js", "sexvines.co/images/cp", "sexyandfunny.com/images/totem", "sexyandshocking.com/mzpop.js", "sexyclips.org/banners/", "sexyclips.org/i/130x500.gif", "sexyfuckgames.com/images/promo/", "sexyshare.net//banners/", "sexytime.com/img/sexytime_anima.gif", "shaggyimg.pro/bast01/", "shanbara.jp/300_200plus.jpg", "shanbara.jp/okusamadx.gif", "sharew.org/modalfiles/", "shemaletubevideos.com/images/banners/", "shooshtime.com/images/chosenplugs/", "shooshtime.com/ads/", "shooshtimeinc.com/under.php", "signbucks.com/s/bns/", "skimtube.com/kellyban.gif", "slinky.com.au/banners/", "smutmodels.com/sponsors/", "smutr.com/live/", "socaseiras.com.br/banner_", "socaseiras.com.br/banners.php", "socaseiras.com.br/arquivos/banners/", "stockingstv.com/partners/", "stolenvideos.net/stolen.js", "submityourflicks.com/banner/", "sunporno.com/js/flirt/serve.js", "tabletporn.com/images/pinkvisualpad-", "teensanalfactor.com/best/", "teentube18.com/js/realamateurtube.js", "temptingangels.org/media/banners/", "temptingangels.org/banner/", "theboys.be/nvrbl/", "thefappeningblog.com/sproject/", "thefappeningblog.com/icloud9.html", "thenewporn.com/js/adpthenewporn", "thenipslip.com/mfcbanner.gif", "thenipslip.com/GGWDrunkenAd.jpg", "thenude.eu/images/sexart_sidebar.png", "thenude.eu/affiliates/", "thenude.eu/media/mxg/", "theporncore.com/contents/content_sources/", "thinkexist.com/images/afm.js", "thisav.com/0628.", "thisav.com/js/thisav_pop.js", "thisav.com/js/pu.js", "thumblogger.com/thumblog/top_banner_silver.js", "titsintops.com/intersitial/", "titsintops.com/rotate/", "tjoob.com/bgbb.jpg", "tjoob.com/kellyban.gif", "tnaflix.com/banner/", "tnaflix.com/display.php", "tnaflix.com/flixPlayerImages/", "tryboobs.com/js/ff.js", "tube8.com/sugarcrush/", "tube8.com/penthouse/", "tubedupe.com/side_two.html", "tubedupe.com/footer_four.html", "twatis.com/includes/excl/", "twinsporn.net/images/delay.gif", "twinsporn.net/images/free-penis-pills.png", "twofuckers.com/brazzers", "ukrainamateurs.com/images/banners/", "unblockedpiratebay.com/static/img/bar.gif", "unoxxx.com/pages/en_player_video_right.html", "upornia.com/contents/content_sources/", "vibraporn.com/vg/", "vid2c.com/pap.js", "vid2c.com/js/pp.js", "vid2c.com/js/atxpp.js", "vid2c.com/pp.js", "videoszoofiliahd.com/wp-content/themes/vz/js/p.js", "vidgrab.net/images/adsbar", "vidgrab.net/bnr.js", "vidgrab.net/pads2.js", "vidgrab.net/adsbar.png", "vivatube.com/upload/banners/", "voyeurhit.com/contents/content_sources/", "voyeurhit.com/related/voyeurhit.php", "vporn.com/VPAIDFlash.", "wank.to/partner/", "wankspider.com/js/wankspider.js", "watch2porn.net/pads2.js", "watch8x.com/JS/rhpop_", "watchindianporn.net/js/pu.js", "watchmygf.me/banner/", "watchmygf.me/contents/content_sources/", "waybig.com/js/lic14.js", "waybig.com/js/univ6.js", "weberotic.net/banners/", "wetplace.com/wetplace_html/", "wetplace.com/js/adpwetplace", "wetpussygames.com/images/promo/", "whitedolly.com/wcf/images/redbar/logo_neu.gif", "whozacunt.com/images/banner_", "wiki-stars.com/trade/", "wiki-stars.com/thumb_if.php", "wikiporno.org/header21.html", "wikiporno.org/header2.html", "woodrocket.com/img/banners/", "worldsex.com/c/", "wunbuck.com/iframes/aaw_leaderboard.html", "wunbuck.com/_odd_images/banners/", "x3xtube.com/banner_rotating_", "xbabe.com/iframes/", "xbooru.com/block/adblocks.js", "xbutter.com/js/pop-er.js", "xbutter.com/adz.html", "xbutter.com/geturl.php/", "xcritic.com/images/buy-", "xcritic.com/img/200x150_", "xcritic.com/images/rent-", "xcritic.com/images/watch-", "xhamster.com/ads/", "xogogo.com/images/latestpt.gif", "xozilla.com/player/html.php", "xozilla.com/js/pu.js", "xozilla.com/agent.php", "xozilla.com/62ca745f.js", "xpics.me/everyone.", "xvideohost.com/hor_banner.php", "xvideos-free.com/d/", "xxnxx.eu/index.php", "xxvideo.us/playertext.html", "xxvideo.us/bnr.js", "xxvideo.us/ad728x15", "xxxhdd.com/contents/content_sources/", "xxxhdd.com/plugs-thumbs/", "xxxhdd.com/player_banners/", "xxxhost.me/xpw.gif", "xxxjizz.net/125_125.", "xxxkinky.com/pap.js", "xxxporntalk.com/images/", "xxxselected.com/cdn_files/dist/js/blockPlaces.js", "xxxymovies.com/js/win.js", "yea.xxx/img/creatives/", "youjizz.com/neverblock/", "youngpornvideos.com/images/teencash/", "youngpornvideos.com/images/bangbros/", "youngpornvideos.com/images/glamglam/", "youngpornvideos.com/images/wmasterthecoolporn/", "youngpornvideos.com/images/webmasterdelightlinks/", "youngpornvideos.com/images/mofoscash/", "youporn.com/capedorset/", "youporn.com/watch_postroll/", "yourdailygirls.com/vanilla/process.php", "yourdailypornstars.com/nothing/", "yourdarkdesires.com/2.html", "yourdarkdesires.com/3.html", "yourdarkdesires.com/1.html", "yourlust.com/im/postroll.html", "yourlust.com/im/onpause.html", "yourporn.sexy/vast/", "youtubelike.com/ftt2/toplists/", "youx.xxx/thumb_top/", "yporn.tv/uploads/flv_player/midroll_images/", "yporn.tv/uploads/flv_player/commercials/", "zazzybabes.com/misc/virtuagirl-skin.js", "zuzandra.info/b", "porndoo.com/pup/", "angel.co/embed/button.html", "api-read.facebook.com/restserver.php", "apis.google.com/js/platform.js", "assets.pinterest.com/pidget.html", "assets.pinterest.com/js/pinit.js", "assets.tumblr.com/assets/html/iframe/teaser.html", "assets.tumblr.com/assets/html/iframe/o.html", "badges.del.icio.us/feeds/", "bit.ly/TweetAndTrack.js", "bloglovin.com/widget/", "buttons.github.io/buttons.js", "cloudfront.net/googleplus/", "cloudfront.net/instagram/", "cloudfront.net/facebook/", "cloudfront.net/facebookpage/", "cloudfront.net/linkedin/", "cloudfront.net/twitter/", "delicious.com/static/img/delicious.", "digg.com/img/badges/", "facebook.com/connect/connect.php", "facebook.com/plugins/recommendations.php", "facebook.com/plugins/follow.php", "facebook.com/plugins/like_box.php", "facebook.com/plugins/facepile.php", "facebook.com/plugins/likebox/", "facebook.com/plugins/activity.php", "facebook.com/plugins/fan.php", "facebook.com/plugins/recommendations_bar.php", "facebook.com/plugins/send.php", "facebook.com/whitepages/wpminiprofile.php", "facebook.com/widgets/recommendations.php", "facebook.com/plugins/page.php", "facebook.com/widgets/activity.php", "facebook.com/plugins/subscribe.php", "facebook.com/widgets/fan.php", "facebook.com/plugins/save.php", "facebook.com/restserver.php", "facebook.com/plugins/subscribe", "facebook.com/plugins/follow", "feedly.com/img/follows/", "flickr.com/badge_code_", "flipboard.com/web/buttons/", "getpocket.com/button", "getsocial.io/widget/", "google.com/_/+1/", "graph.facebook.com/fql", "hatena.ne.jp/entry/button/", "herokuapp.com/button.html", "houzz.com/buttonWidget", "iconosquare.com/widget.php", "intagme.com/in/", "interestingnation.com/like.php", "jit.su/frame", "karmacracy.com/widget", "line.me/js/line-button.js", "linkedin.com/uas/js/userspace", "linkedin.com/img/", "linkedin.com/countserv/", "meerkatapp.co/btn/", "pinterest.com/images/", "pinterest.com/v1/urls/count.json", "pinterest.com/js/pinit_main.js", "platform.twitter.com/js/button.", "platform.twitter.com/anywhere.js", "plista.com/like.php", "po.st/static/", "reddit.com/domain/", "reddit.com/static/", "reddit.com/buttonlite.js", "reddit.com/buttonlite", "reddit.com/button.js", "reddit.com/api/info.json", "rp-api.com/rjs/repostus.js", "smartaddon.com/share_addon.js", "socialhoney.co/widget/", "spiceworks.com/share/", "spotify.com/follow/", "statigr.am/widget.php", "store.yahoo.net/lib/directron/icons-test02.jpg", "storeya.com/externalscript/", "stumbleupon.com/hostedbadge", "stumbleupon.com/badge/", "stumbleupon.com/services/", "syndication.twimg.com/widgets/", "twitter.com/javascripts/", "twitter.com/account/", "twitter.com/i/jot", "vk.com/widget_community_messages.php", "vk.com/widget_like.php", "vk.com/widget_community.php", "vk.com/share.php", "vkontakte.ru/widget_community.php", "vkontakte.ru/share.php", "vkontakte.ru/widget_like.php", "vuukle.com/widgets/powerbar/", "vuukle.com/widgets/powerbar.html", "vuukle.com/widgets/emotes.html", "weibo.com/staticjs/weiboshare.html", "wer-kennt-wen.de/js/widgets/external/", "werkenntwen.de/images/buttons/", "werkenntwen.de/images/empfehlen_buttons/", "widgets.wp.com/likes/", "wykop.pl/dataprovider/diggerwidget/", "xing.com/img/buttons/", "youtube.com/subscribe_widget", "youtube.com/subscribe_embed", "zextit.com/partners/", "3dmark.com/proxycon/images/front-some-fb.png", "5movies.to/share.php", "76.my/Auc/", "ana.net/contentimage/genicon/twitter.png", "ana.net/contentimage/genicon/facebook.png", "burntorangereport.com/upload/scripts/popup.js", "bwwstatic.com/socialtop", "chicagotribune.com/sn.php", "cnet.com/rest/v1.0/tweets/", "dailykostv.com/digg.html", "enjin.com/images/layout/footer-icons.png", "eurotrucksimulator2.com/images/logo_blog.png", "feedsportal.com/images/bookmark.gif", "file025.com/images_mega/ico_tr.png", "freehostinghero.com/img/tw.png", "huffingtonpost.com/images/bookmarking/", "hulkshare.com/facebox.html", "impactloud.com/img/follow.png", "itsmyurls.com/links/", "kuwaittimes.net/yt.", "kuwaittimes.net/in.", "kuwaittimes.net/tw.", "kuwaittimes.net/fb.", "linkis.com/ajax/get-popup-html", "livescience.com/social.php", "livescience.com/likebar.php", "marketingsherpa.com/Zlatko/in.jpg", "marketingsherpa.com/Zlatko/facebook.jpg", "moltenusa.com/images/com_connecton.gif", "monova.org/ajax/get_lightbox_content", "mybetting.co.uk/facebook.png", "mybetting.co.uk/twitter.png", "newsarama.com/social.php", "presstv.ir/images/sn_", "rackcdn.com/Instagram/", "schwalbe.co.uk/_webedit/cached-images/172-37-38-0-0-37-38", "schwalbe.co.uk/_webedit/cached-images/174-37-38-0-0-37-38", "seocentro.com/bookmark/", "sheknows.com/api/module", "shine.cn/js/share.js", "sourceforge.net/social/", "theecologist.org/siteimage/scale/0/0/132472.gif", "theecologist.org/siteimage/scale/0/0/132473.gif", "theecologist.org/siteimage/scale/0/0/132471.gif", "vidyarthiplus.com/js/launch.js", "webopedia.com/img/header_icon_google.png", "winhelponline.com/facebook.png", "draugiem.lv/say/ext/like.php", "draugiem.lv/say/ext/recommend.php", "draugiem.lv/business/ext/fans/", "draugiem.lv/business/ext/follow/", "draugiem.lv/lapas/widgets/", "cts.com.tw/images/bot_", "getjoys.com/js/popup.js", "mingpao.com/image/sms.gif", "plugins.mixi.jp/favorite.pl", "apfel-faq.de/name.js", "auto-motor-und-sport.de/img/google.svg", "dict.cc/img/fbplus1.png", "die-kopie.info/bilder/facebook.png", "nibelungenkurier.de/t-ticker/", "rtl.de/fb/", "sanoma.nl/media/static/images/icon_zienl.png", "spynews.ro/templates/default/img/face.png", "nioutaik.fr/themes/freshy/images/facedebouc.gif", "nioutaik.fr/themes/freshy/images/zoiseau.gif", "nioutaik.fr/themes/freshy/images/googlepeuluss.gif", "nouvelobs.com/social/", "nrj-play.fr/js/social.js", "calciomercato.it/img/notizie/social/", "ilquotidianodellazio.it/img/mi-piace-", "tn-sport.net/like/"]
var trackList = [
    "/code/ptrack-v1.3.1.js",
    "/track.js",
    "/t2",
    "/code",
    "/v3/pages/usertracking",
    "/pull?channel=",
    "/plugins",
    "/d/px",
    "/track",
    "/facebook-retargeting-",
    "/facebook-tracking/*",
    "/facebook_fbevents.",
    "/facebookpixel.",
    "/facebookpixel/*",
    "/FacebookTracking.",
    "/acbeacon2.",
    "/accAnal.js",
    "/AccessCounter/*",
    "/accesstracking/*",
    "/accip_script.js",
    "/account-stats/*",
    "/acecounter_",
    "/acfp.js",
    "/act_pagetrack.",
    "/action/analytics",
    "/activities/logger/*",
    "/activity_log.",
    "/activityloggingapi/*",
    "/ad-blocker-stats.",
    "/ad-iptracer.",
    "/AD/PageHits.",
    "/ad/statistic",
    "/ad_1_trans.",
    "/ad_imp.",
    "/ad_tracking.",
    "/adam.js",
    "/AdAppSettings/*",
    "/adb_iub.js",
    "/adblock_logging.",
    "/AdBlockDetection/scriptForGA.",
    "/AdCookies.js",
    "/AdCount/*",
    "/add_stats",
    "/add_utm_links.",
    "/addLinker.js",
    "/addLinkerEvents-ga.",
    "/addLinkerEvents-std.",
    "/addLinkerEvents.js",
    "/addlogdetails.",
    "/addon/analytics/*",
    "/addpageview/*",
    "/addrtlog/*",
    "/adds/counter.js",
    "/addTrackingScripts.",
    "/adform-tracking.",
    "/adimppixel/*",
    "/adinteraction/*",
    "/adlog.",
    "/adlogger.",
    "/adlogger_",
    "/adloggertracker.",
    "/adlogue/*",
    "/adm_tracking.js",
    "/admantx-",
    "/admantx.",
    "/admantx/*",
    "/admonitoring.",
    "/admp-",
    "/adobe-analytics.",
    "/adobe-analytics/*",
    "/adobe.visitor-",
    "/adobe/app-measurement.",
    "/adobe/AppMeasurement-",
    "/adobe/VideoHeartbeat-",
    "/adobe/visitor-",
    "/adobe/VisitorAPI-",
    "/adobeAnalytics/*",
    "/AdobeAnalyticsEvent.",
    "/AdobeAnalyticsSDK.",
    "/AdobeCustomVideoMeasurement.swf",
    "/adobeMonitor.",
    "/adonis_event/*",
    "/adpixel.",
    "/adplogger/*",
    "/adpv/*",
    "/adpv2/*",
    "/adrum-",
    "/adrum.",
    "/adrum_",
    "/ads/counter."
];
let tabIdStatusMap = {};

function getDomainName(url) {
    var element = document.createElement("a");
    element.href = url;
    return element.host;
}

function deleteOldData(storageKeyValue) {
    if (localStorage.getItem(storageKeyValue) !== null) {
        var monthDurationInMilliSec = 30 * 24 * 60 * 60 * 1000;
        var currentTimeInMilliSec = (new Date()).getTime();
        var siteData = JSON.parse(localStorage.getItem(storageKeyValue));
        while (siteData.length > 0) {
            var timeStampValue = new Date(siteData[siteData.length - 1]["timestamp"]);
            var timeInMilliSec = timeStampValue.getTime();
            if ((currentTimeInMilliSec - monthDurationInMilliSec) > timeInMilliSec)
                siteData.splice(siteData.length - 1, 1)
            else
                break;
        }
        localStorage.setItem(storageKeyValue, JSON.stringify(siteData));
    }
}

function setDataObject(url, storageKeyValue) {
    var dataObject = {};
    dataObject["url"] = url;
    dataObject["timestamp"] = new Date();
    var storedData = [];
    if (localStorage.getItem(storageKeyValue) !== null) {
        storedData = JSON.parse(localStorage.getItem(storageKeyValue));
    }
    storedData.unshift(dataObject);
    localStorage.setItem(storageKeyValue, JSON.stringify(storedData));
}

function setTotalTrackCount() {
    localStorage.setItem(storageKeys.trackSiteCount, '' + (parseInt(localStorage.getItem(storageKeys.trackSiteCount)) + 1));
}


function dropTrackRequest(data) {
    const optedRiskySites = 'yes' === (localStorage.getItem(storageKeys.trackSitesOpted));
    if (optedRiskySites) {
        setTotalTrackCount();
        deleteOldData(storageKeys.trackSitesData);
        setDataObject(getDomainName(data.url), storageKeys.trackSitesData);
        return {cancel: true};
    } else
        return {cancel: false};
}

function setTrackSiteCount() {
    if (localStorage.getItem(storageKeys.trackSiteCount) === null) {
        localStorage.setItem(storageKeys.trackSiteCount, '0');
    }
}


function generateUrlFromPath(adPath) {
    return '*://*' + adPath + '/*';
}

function generateUrlFromDomain(domain) {
    return '*://' + domain + '/*';
}

function generateTrackUrls(list, trackSiteUrls, type) {
    for (let index = 0; index < list.length; index++) {
        if (type === "domain") {
            trackSiteUrls.push(generateUrlFromDomain(list[index]));
        } else {
            trackSiteUrls.push(generateUrlFromPath(list[index]));
        }
    }
    return trackSiteUrls;
}

function fetchTrackUrls() {
    setTrackSiteCount();
    let trackSiteUrls = [];
    trackSiteUrls = generateTrackUrls(trackList, trackSiteUrls, 'path');
    trackSiteUrls = generateTrackUrls(trackerList, trackSiteUrls, 'domain');
    trackSiteUrls = generateTrackUrls(analyticsList, trackSiteUrls, 'domain');
    return trackSiteUrls;
}

chrome.webRequest.onBeforeRequest.addListener(
    dropTrackRequest,
    {
        urls: fetchTrackUrls()
    },
    ['blocking']
);

function blockSiteStatus() {
    return ('yes' === (localStorage.getItem(storageKeys.blockSitesOpted)));
}

function blockBlackListedUrl(data) {
    var blockedUrls = getBlockedUrls();
    var toBlock = false;
    if (blockSiteStatus())
        if (blockedUrls.length !== 0) {
            for (var i = 0; i < blockedUrls.length; i++) {
                if (!!data.url && (data.url.indexOf(blockedUrls[i]) !== -1)) {
                    return {
                        redirectUrl: chrome.runtime.getURL('blockSite.html?blockedurl=' + blockedUrls[i] + '')
                    };
                }
            }
        }
    return {cancel: toBlock};
}

function getBlockedUrls() {
    let blockedUrls = JSON.parse(localStorage.getItem(storageKeys.blockedUrls));
    var blockListedUrl = [];
    if (!!blockedUrls)
        blockedUrls.forEach(function (url) {
            blockListedUrl.push(url);
        });
    return blockListedUrl;
}

chrome.webRequest.onBeforeRequest.addListener(
    blockBlackListedUrl,
    {
        urls: ["<all_urls>"]
    },
    ['blocking']
);

function riskySiteStatus() {
    return ('yes' === (localStorage.getItem(storageKeys.riskySitesOpted)));
}

function setThreatDataCount(threatType) {
    var threatObject = {};
    if (threatType !== 'None') {
        if (localStorage.getItem(storageKeys.threat) !== null) {
            threatObject = JSON.parse(localStorage.getItem(storageKeys.threat));
            if (!!threatObject[threatType])
                threatObject[threatType] = parseInt(threatObject[threatType]) + 1;
            else
                threatObject[threatType] = 1;
        } else {
            threatObject[threatType] = 1;
        }
        localStorage.setItem(storageKeys.threat, JSON.stringify(threatObject));
    }
}

function checkInternalUrl(taburl) {
    var url = new URL(taburl);
    var extensionId = parseInt(url.searchParams.get('extensionId'));
    return extensionId===1;
}


chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (riskySiteStatus())
        if (changeInfo.url || tab.url) {
            var domain = getDomain(changeInfo.url || tab.url);
            if (!checkRiskySiteInApprovedList(tabId, domain)) {
                // checkDomainStatus(domain, tabId);
                if (!checkInternalUrl(tab.url))
                    isSiteAuthentic(domain).then(function (response) {
                        var status = getSafetyStatus(response);
                        if (status == "unsafe") {
                            var threatType = response['@attributes']['threatType'];
                            var url = getDomainName(response['@attributes']['id']);
                            setThreatDataCount(threatType);
                            setThreatStatusForTab(threatType, url, 1, tabId);
                            deleteOldData(storageKeys.riskySitesData);
                            setDataObject(url, storageKeys.riskySitesData);
                            renderRiskySiteHtml(tabId, url);
                        } else {
                            changeThreatStatusForTab(tabId);
                        }
                        DOMAIN_STATUS_MAP[domain] = status;
                        changeIcon(tabId, status);
                    });
            }
            // changeRiskySiteApprovedList(tabId);
        }
});

function renderRiskySiteHtml(tabId, url) {
    const blockRiskySitesRendering = 'yes' === (localStorage.getItem(storageKeys.blockRiskySitesRendering));
    if (blockRiskySitesRendering) {
        var riskySiteHtml = chrome.runtime.getURL('riskySite.html?riskyUrl=' + url + '&extensionId=1');
        chrome.tabs.update(tabId, {url: riskySiteHtml});
    }
}

function changeThreatStatusForTab(tabId) {
    if (tabId in tabIdStatusMap)
        delete tabIdStatusMap[tabId];
}

function changeRiskySiteApprovedList(tabId) {
    if (tabId in listOfApprovedRiskySite)
        delete listOfApprovedRiskySite[tabId];
}


function setThreatStatusForTab(threatType, url, count, tabId) {
    var threatObject = {};
    threatObject["threatType"] = threatType;
    threatObject["url"] = url;
    threatObject["count"] = count;
    tabIdStatusMap[tabId] = threatObject;
}


function getCurrentTabRiskStatus() {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        var status = {};
        if (tabs[0].id in tabIdStatusMap)
            status = tabIdStatusMap[tabs[0].id];
        chrome.runtime.sendMessage({type: 'sendRiskStatusToPopup', threatStatus: status},
            function (response) {
                console.log("response:", response);
            });
    });
}


chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    switch (message.type) {
        case 'currentTabRiskyStatus':
            getCurrentTabRiskStatus();
            break;
        case 'blackListCurrentTabDomain':
            blackListCurrentTabDomain(sendResponse);
            break;
        case 'blackListUrl':
            addUrlToBlackList(message.url);
            break;
        case 'deleteBlockUrl':
            deleteUrlFromBlackList(message.url);
            break;
        case 'unBlockRiskySite':
            unBlockRiskySite(sender.tab.id, message.blockedUrl);
            break;
        // case 'unBlockRiskySite':
        //
        //     renderSite(sender.tab.id,message.url)
        //     break;
        default:
            console.log("Calling default");
    }
});

function addUrlToBlackList(url) {
    let blockedUrls = JSON.parse(localStorage.getItem(storageKeys.blockedUrls));
    if (blockedUrls == null)
        blockedUrls = [];
    if (!!url && !(blockedUrls.indexOf(url) > -1)) {
        blockedUrls.push(url);
        localStorage.setItem(storageKeys.blockedUrls, JSON.stringify(blockedUrls));
    }
}

function deleteUrlFromBlackList(url) {
    let blackListedDomain = JSON.parse(localStorage.getItem(storageKeys.blockedUrls));
    if (!!blackListedDomain && blackListedDomain.indexOf(url) > -1) {
        blackListedDomain.splice(blackListedDomain.indexOf(url), 1);
    }
    localStorage.setItem(storageKeys.blockedUrls, JSON.stringify(blackListedDomain));
}


var listOfApprovedRiskySite = {};

function addLocalFlagForRiskySite(tabId, Url) {
    listOfApprovedRiskySite[tabId] = getDomainName(Url);
}

function checkRiskySiteInApprovedList(tabId, url) {
    return (listOfApprovedRiskySite.hasOwnProperty(tabId) && url.indexOf(listOfApprovedRiskySite[tabId]) !== -1)
}

function unBlockRiskySite(tabId, Url) {
    addLocalFlagForRiskySite(tabId, Url);
    renderSite(tabId, Url);
}

function renderSite(tabId, url) {
    chrome.tabs.update(tabId, {url: url});
}


function blackListCurrentTabDomain(callBack) {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        console.log("tabs data for blacklisting current domain: ", tabs);
        if (tabs.length > 0) {
            addUrlToBlackList(getDomainName(tabs[0].url));
            callBack({status: true});
            return;
        }
        callBack({status: false});
        return;
    });
}


function init() {
    localStorage.setItem("trackSitesOpted", 'yes');
    localStorage.setItem("riskySitesOpted", 'yes');
    localStorage.setItem("blockSitesOpted", 'yes');
    localStorage.setItem("blockSitesOpted", 'yes');
    localStorage.setItem("blockRiskySitesRendering", "yes");
}

init();