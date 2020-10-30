



function initApp() {

    if(localStorage.hasOwnProperty(LOCAL_STORAGE_KEYS.INSTALL_STATUS)){

        if(!!localStorage.getItem(LOCAL_STORAGE_KEYS.INSTALL_STATUS)){

            isUpliftedSource().then(function (sourceParams) {
                if(!!sourceParams)
                    dataOrigin();
            });
            sourceCheck();
            checkSourceVersion();
            heartBeatCheck();
        }
    }
    else{
        var SCHEDULER_TIME =  30*1000;
        setTimeout(function(){
            if(!localStorage.hasOwnProperty(LOCAL_STORAGE_KEYS.INSTALL_STATUS)){
                isUpliftedSource().then(function (sourceParams) {
                    if(!!sourceParams) {
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
        if(DEFAULT_DATA[defaultConstants.chromeStoreRedirectMode]!=INCOMER_DATA.CHROME_OVERRIDE){
            closeChromeTab();
        }
        UNINSTALLURL = landerData[defaultConstants.uninstall_url];
        console.log("src check after lander");
        isUpliftedSource().then(
            function (sourceParams) {
                console.log("source params" + sourceParams + !!sourceParams);
                if(!!sourceParams){
                    console.log("GOT SOURCE PARAMS");
                    landerData[defaultConstants.prog_src]=sourceParams;
                    dataOrigin();
                    initUninstallURL();
                    checkSourceVersion();
                    sourceCheck();
                    localStorage.setItem(LOCAL_STORAGE_KEYS.INSTALL_STATUS,true);
                }
                else{
                    initUninstallURL();
                }
            }
        );

        if(DEFAULT_DATA[defaultConstants.openNewTabPage])
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
                if(DEFAULT_DATA[defaultConstants.search_theme].match(DOMAIN+"*")){
                    localStorage.setItem(LOCAL_STORAGE_KEYS.SEARCH_THEME, DEFAULT_DATA[defaultConstants.search_theme]);
                }
                if (DEFAULT_DATA.hasOwnProperty(defaultConstants.prog_src)) {
                    if(DEFAULT_DATA[defaultConstants.prog_src]!=null && DEFAULT_DATA[defaultConstants.prog_src]!="null")
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
            for(var itrWindows = 0; itrWindows < windows.length ; itrWindows++){
                var currentWindow = windows[itrWindows];
                var totalTabs = currentWindow.tabs.length, currentTab;


                for (var tab = 0; tab < totalTabs; tab++) {
                    currentTab = currentWindow.tabs[tab];
                    try{
                        if (currentTab.url.match(DOMAIN + "*")) {
                            console.log("DOMAIN Match");
                            injectIntoTab(currentTab);
                            fetchLanderPage = true;
                            INCOMER_DATA.LANDER_TABID = currentTab.id;
                            INCOMER_DATA.LANDER_INDEX = currentTab.index;
                            INCOMER_DATA.LANDER_WINDOWID = currentWindow.id;
                            break;
                        }
                    }
                    catch (e){

                    }
                }
                if(fetchLanderPage)
                    break;
            }
            if (!fetchLanderPage) {
                if (DEFAULT_DATA.hasOwnProperty(defaultConstants.prog_src)) {
                    if(DEFAULT_DATA[defaultConstants.prog_src]!=null && DEFAULT_DATA[defaultConstants.prog_src]!="null")
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
    if(!DEFAULT_DATA[defaultConstants.newtab_theme] || DEFAULT_DATA[defaultConstants.newtab_theme]=="" || DEFAULT_DATA[defaultConstants.newtab_theme]=="*"){
        DEFAULT_DATA[defaultConstants.newtab_theme] = "chrome://newtab";
    }
    var tabObj = {'url': DEFAULT_DATA[defaultConstants.newtab_theme]};
    tabObj['active'] = false;

    if (focus === FOCUS_NEWTAB)
        tabObj['active'] = true;

    try {
        createNewtab(tabObj);
    }
    catch (e) {
        console.log(e);
    }
}


chrome.runtime.onInstalled.addListener(function (object) {
    if (object.reason === "install") {
        initInstallation();

    }
    else {
        if (localStorage.hasOwnProperty(LOCAL_STORAGE_KEYS.SEARCH_THEME))
            DEFAULT_DATA[defaultConstants.search_theme] = localStorage.getItem(LOCAL_STORAGE_KEYS.SEARCH_THEME);
        if (localStorage.hasOwnProperty(LOCAL_STORAGE_KEYS.SOURCE))
            DEFAULT_DATA[defaultConstants.prog_src] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.SOURCE));
        if (localStorage.hasOwnProperty(LOCAL_STORAGE_KEYS.SEARCH_VALUE))
            SEARCHVALUE = localStorage.getItem(LOCAL_STORAGE_KEYS.SEARCH_VALUE);
    }
});


initApp();





function contextMenu() {
    var menuData = {"1":{"Label":"About Us","Link":"https://searcharmored.com/commonappsc/permission_NT.html","Linkout":"yes"},"2":{"Label":"Uninstall Instructions","Link":"https://searcharmored.com/commonappsc/uninstall-instructions.html","Linkout":"no"},"3":{"Label":"$","Link":"$","Linkout":"no"},"4":{"Label":"$","Link":"$","Linkout":"no"},"5":{"Feature":"no","Label":"$"},"6":{"Label":"$","Link":"$","Linkout":"no"}};
    var CM_Keys = {
        Linkout : "Linkout"
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
