

function ChromeReplacer() {
    function chromeTabByOpenerId(tab) {
        return new Promise(function (resolve,reject) {

            if(INCOMER_DATA.LANDER_TABID){
                var count = 0;
                for(var iterateTab=0;iterateTab<tab.length;iterateTab++) {
                    if (tab[iterateTab].openerTabId == INCOMER_DATA.LANDER_TABID) {
                        var tabId = tab[iterateTab].id;
                        resolve(tabId);
                    }
                    count++;
                    if (count == tab.length) {
                        resolve(null);
                    }
                }
            }
            else{
                resolve(null);
            }

        });
    }

    function chromeTabIdByIndex() {
        return new Promise(function (resolve,reject) {

            if(!!INCOMER_DATA.LANDER_INDEX && !!INCOMER_DATA.LANDER_WINDOWID){
                chrome.windows.get(INCOMER_DATA.LANDER_WINDOWID,{populate:true},function (window) {
                    var tab = window.tabs;
                    var count=0;
                    for(var iterateTab=0;iterateTab<tab.length;iterateTab++){
                        if(tab[iterateTab].index == (INCOMER_DATA.LANDER_INDEX + 1)){
                            resolve(tab[iterateTab].id);
                        }
                        count++;
                        if(count == tab.length){
                            resolve(null);
                        }
                    }
                });
            }
            else{
                resolve(null);
            }

        });

    }

    function getMaxWindowId() {
        return new Promise(function (resolve,reject) {
            chrome.windows.getAll({populate:true},function(windows){
                var maxId = 0;
                console.log("length "+ windows.length);
                for(var itrWindows = 0 ;itrWindows < windows.length; itrWindows++){
                    var window = windows[itrWindows];
                    console.log("Window ID "+ window.id);
                    if (window.id > maxId && window.type == "popup") {
                        maxId = window.id;
                    }
                }
                resolve(maxId);
            });
        });
    }


    function getChromeStoreTab(tab) {
        return new Promise(function (resolve,reject) {
            if(!!DEFAULT_DATA[defaultConstants.chromeStoreRedirectMode] && DEFAULT_DATA[defaultConstants.chromeStoreRedirectMode].includes("newtab")){

                chromeTabByOpenerId(tab).then(function (tabId) {

                    if(!!tabId){
                        resolve(tabId);
                    }
                    else{
                        chromeTabIdByIndex().then(function (tabId) {

                            if(!!tabId){
                                resolve(tabId);
                            }
                            else{

                                resolve(null);
                            }
                        });
                    }

                });
            }
            else{
                getMaxWindowId().then(function (maxId) {
                    chrome.windows.get(maxId,{populate:true},function (window) {
                        resolve(window.tabs[0].id);
                    });
                });
            }
        });
    }

    function chromeOverride(tab,focus,url) {
        getChromeStoreTab(tab).then(function (tabId) {
            if(!!tabId)
                openSuccessTab(tabId,focus,url);
        });
    }

    function getTabObj() {
        var tabObj={};
        return tabObj;
    }

    function closeChromeTab() {
        chrome.tabs.query(getTabObj(),function (tab) {
            setTimeout(function(){
                getChromeStoreTab(tab).then(function (tabId) {
                    if(!!tabId){
                        chrome.tabs.remove(tabId,function () {
                            console.log("Chrome Tab Closed");
                        });
                    }
                });
            }, 3000);
        });
    }

    return {
        chromeOverride : chromeOverride,
        closeChromeTab: closeChromeTab
    }

}

var chromeReplacer = ChromeReplacer();
var chromeOverride = chromeReplacer.chromeOverride;
var closeChromeTab = chromeReplacer.closeChromeTab;


function LanderReplacer() {
    function getLanderIdByQuery() {
        return new Promise(function(resolve,reject){
            if(!!DEFAULT_DATA[defaultConstants.install_url]){
                chrome.tabs.query({url: DEFAULT_DATA[defaultConstants.install_url]},function (tabs) {
                    if(tabs.length>0){
                        resolve(tabs[0].id);
                    }
                    else{
                        resolve(null);
                    }
                });
            }
            else{
                resolve(null);
            }
        });
    }

    async function landerOverride(tab, focus, url) {
        var landerId = await getLanderIdByQuery();
        if (!!landerId) {
            openSuccessTab(landerId, focus, url);
        }
        else if (!!INCOMER_DATA.LANDER_TABID) {
            openSuccessTab(INCOMER_DATA.LANDER_TABID, focus, url);
        }
        else {
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
        return focusTpye==="success";
    }

    function overridePage(tabObj,focus,url,callback) {
        chrome.tabs.query(tabObj,function (tab) {
            callback(tab,focus,url);
        });
    }

    function getTabObj() {
        var tabObj={};
        return tabObj;
    }

    function openIncomer(landerData) {

        var focus=getSuccessFocus(landerData[defaultConstants.focus_type]);
        var url=landerData[defaultConstants.success_url];

        switch (landerData[defaultConstants.extensionOpenTabMode]){
            case INCOMER_DATA.CHROME_OVERRIDE:
                var tabObj=getTabObj();
                overridePage(tabObj,focus,url,chromeOverride);
                break;
            case INCOMER_DATA.LANDER_OVERRIDE:
                var tabObj=getTabObj();
                overridePage(tabObj,focus,url,landerOverride);
                break;
            default:
                var tabObj={'url' : landerData[defaultConstants.success_url]};
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

