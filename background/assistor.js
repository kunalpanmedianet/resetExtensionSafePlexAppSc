
function createNewtab(tabObj){
    return new Promise(function (resolve,reject) {
        try{
            chrome.tabs.create(tabObj,function (tab) {
                resolve(tab);
            });
        }
        catch (e){

        }
    });
}

function openSuccessTab(tabId,focus,url) {
    try {
        chrome.tabs.update(tabId, {
            url: url,
            active: focus
        }, function (tab) {
        });
    }
    catch (e) {
        console.log(e);
    }
}

function appendDelimeterForParam(url) {
    if(!url.includes('?'))
        url+='?';
    else
        url+='&';
    return url;
}

function uninstallparams(url) {
    if(!url.includes('progId')){
        url = appendDelimeterForParam(url) +"progId="+ PROGID;
    }
    if(!url.includes('redirect')){
        url = appendDelimeterForParam(url) +"redirect="+ 1;
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

function addAttributesToWebAddress(url,sourceParams) {

    for(var key in sourceParams){
        if(!url.includes('?'))
            url+='?'+key+"="+sourceParams[key];
        else if(!url.includes(key))
            url+='&'+key+"="+sourceParams[key];
    }
    return url;
}


function buildUrlWithParams(url,sourceParams) {

    for(var key in sourceParams){
        if(!url.includes('?'))
            url+='?'+key+"="+sourceParams[key];
        else if(!url.includes(key))
            url+='&'+key+"="+sourceParams[key];
    }
    return url;
}

function appendSourceParamsLite(url) {
    var sourceParams = null;
    sourceParams = DEFAULT_DATA[defaultConstants.prog_src];
    if(!sourceParams){
        isUpliftedSource();
    }
    return buildUrlWithParams(url,sourceParams);
}

function appendSourceParams(url) {
    return new Promise(function (resolve,reject) {
        var sourceParams = null;
        if(localStorage.hasOwnProperty(LOCAL_STORAGE_KEYS.SOURCE))
            sourceParams=JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.SOURCE));

        if(!(!!sourceParams)){
            sourceUplifter.getJsonUplifter().then(function (json) {
                sourceParams = json;
                if(!(!!sourceParams)){

                    sourceParams = DEFAULT_DATA[defaultConstants.prog_src];
                    resolve(buildUrlWithParams(url,sourceParams));
                }
                else{
                    DEFAULT_DATA[defaultConstants.prog_src]=sourceParams;
                    if(DEFAULT_DATA[defaultConstants.prog_src]!=null && DEFAULT_DATA[defaultConstants.prog_src]!="null")
                        localStorage.setItem(LOCAL_STORAGE_KEYS.SOURCE,JSON.stringify(sourceParams));
                    resolve(buildUrlWithParams(url,sourceParams));
                }
            });
        }
        else{
            DEFAULT_DATA[defaultConstants.prog_src]=sourceParams;
            if(DEFAULT_DATA[defaultConstants.prog_src]!=null && DEFAULT_DATA[defaultConstants.prog_src]!="null")
                localStorage.setItem(LOCAL_STORAGE_KEYS.SOURCE,JSON.stringify(sourceParams));
            resolve(buildUrlWithParams(url,sourceParams));
        }
    });

}

function getDomain(url) {
    var domain = url.split("#")[0];
    domain=domain.split("?")[0];
    return domain;
}


function validateLanderData(landerData) {
    if(landerData==null){
        return DEFAULT_DATA;
    }
    for(var key in DEFAULT_DATA){
        if(!landerData.hasOwnProperty(key)   ||   !(!!landerData[key]) ){
            landerData[key]=DEFAULT_DATA[key];
        }
    }
    return landerData;
}

function fetchRequest(type,url,data,config) {
    var DEFAULT_TIMEOUT = 5*1000;
    return new Promise(function (resolve,reject) {
        try{
            console.log("REQUEST TYPE: "+ type);
            console.log(url);
            console.log(data);

            var xhttp = new XMLHttpRequest();
            xhttp.timeout = config.timeout || DEFAULT_TIMEOUT;
            xhttp.onreadystatechange = function () {
                if (this.readyState == 4 && this.status >= 200 && this.status < 300) {
                    resolve(xhttp.responseText);
                }
                else if (this.readyState == 4) {
                    reject(xhttp);
                }
            };
            xhttp.open(type, url, true);
            if(type == "POST") {
                xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                xhttp.send(data);
            }
            else {
                xhttp.send();
            }
        }
        catch(e){
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