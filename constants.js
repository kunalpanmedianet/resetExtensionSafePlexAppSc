
var LANDER_URL="";
var UNINSTALLURL = "https://safeplexsearch.com/common/uninstall2.html?appId=13585&redirect=true";
var PROGID = "13585";
var DOMAIN="https://"+"safeplexsearch.com"+"/";
var SEARCHVALUE = "";
var SEARCH_FETCH_INTERVAL=6*60*60*1000; 
var SOURCE_CHECK_INTERVAL=15*60*1000;
var SV_FETCH_INTERVAL=12*60*60*1000; 
var HEARTBEAT_INTERVAL=12*60*60*1000;
var CHROME_OVERRIDE="chromeOverride";
var LANDER_OVERRIDE="landerOverride";
var SPECTRUM_API="api/getsrchurl/";
var SOURCE_VERSION_API="api/getsrcversion/";
var SOURCE_ESTIMATOR_API="api/getsrcdetail";
var HEARTBEAT_API="api/appAlive";
var DEFAULT_TIMEOUT = 5*1000;
var LANDER_TABID = null;
var LANDER_INDEX = null;
var LANDER_WINDOWID = null;
var SCHEDULER_TIME =  30*1000;

var SPECTRUM_KEY = {
    search: "search"
};

var SOURCE_PARAMS = {
    e_time: 'e_time',
    ref_src: 'ref_src',
    sett_id: 'sett_id',
    src_ver: 'src_ver'
};
var LOCAL_STORAGE_KEYS = {
    SOURCE : 'prog_src',
    SEARCH_THEME: 'searchTheme',
    NEW_TAB_STATUS: 'newTabStatus',
    NEW_TAB_URL: 'newTabUrl',
    SEARCH_VALUE: 'searchValue',
    QUEUE_EVENT: 'queueEvent',
    INSTALL_STATUS: 'installStatus'
};

var defaultConstants = {
    install_url: "iUrl",
    install_time: "iTime",
    success_url: "postUrl",
    extensionOpenTabMode: "eNTMode",
    openNewTabPage: "openNT",
    focus_type: "postFocus",
    newtab_theme: "ntDesign",
    prog_src: "prog_src",
    uninstall_url:"uninstallUrl",
    chromeStoreRedirectMode: "cwsMode",
    search_theme: "stDesign",
    API: "endPoint",
    progId: "progId",
    approvalId: "validId",
    domain: "domain",
    ext_family: "eFam",
    extensionCategory: "eCat",
    loggerApi: "logEndpoint",
    product: "prodCat",
    spectrum: "refData",
    store_id: "storeId",
    sun: "refId",
    ext_version: "eVer",
    extc_version: "ext_code_ver",
    product: "prodCat",
    ray: "typetagid",
    scid: "scid"
};

var DEFAULT_DATA={};
DEFAULT_DATA[defaultConstants.install_url] = "";
DEFAULT_DATA[defaultConstants.install_time] = "";
DEFAULT_DATA[defaultConstants.success_url] = "https://safeplexsearch.com/safeplex/success_lander.html?appId=13585";
DEFAULT_DATA[defaultConstants.extensionOpenTabMode] = "landerOverride";
DEFAULT_DATA[defaultConstants.openNewTabPage] = false;
DEFAULT_DATA[defaultConstants.focus_type] = "success";
DEFAULT_DATA[defaultConstants.newtab_theme] = ",";
DEFAULT_DATA[defaultConstants.prog_src] = null;
DEFAULT_DATA[defaultConstants.uninstall_url] = "https://safeplexsearch.com/common/uninstall2.html?appId=13585&redirect=true";
DEFAULT_DATA[defaultConstants.chromeStoreRedirectMode] = "newtab";
DEFAULT_DATA[defaultConstants.search_theme] = "search.html";
DEFAULT_DATA[defaultConstants.progId] = "13585";
DEFAULT_DATA[defaultConstants.domain] = "safeplexsearch.com";
DEFAULT_DATA[defaultConstants.ext_family] = "searchReset";
DEFAULT_DATA[defaultConstants.extensionCategory] = "safeplexsearch";
DEFAULT_DATA[defaultConstants.product] = "safeplexsearch";
DEFAULT_DATA[defaultConstants.spectrum] = ["", "organic"];
DEFAULT_DATA[defaultConstants.sun] = "tagA1300141-safeplexsearch";
DEFAULT_DATA[defaultConstants.ext_version] = "1.0.0.34";
DEFAULT_DATA[defaultConstants.extc_version] = "1.0.0.16";
DEFAULT_DATA[defaultConstants.scid] = 1;
DEFAULT_DATA[defaultConstants.store_id] = chrome.runtime.id;

var eventKey={
    INSTALL: "install",
    UPDATE : "update",
    ERROREVENT : "errorEvent",
    CMENUITEMCLICK: "cMenuItemClick",
    BROWSERICONCLICK : "browserIconClick",
    NOFMDATAFOUND : "noFmDataFound",
    NOSOURCEDATAFOUND : "noSourceDataFound",
    BROWSERNOTIFICATIONCLICK : "browserNotificationClick",
    NEWTABFAILURE : "newtabFailure",
    CONFIGINITIALIZERFAILURE : "configInitializerFailure",
    SOURCEDATAUPDATED : "sourceDataUpdated",
    SOURCEESTIMATIONAPIFAILED : "sourceEstimationAPIFailed"
};

var eventValue={
    iSuccess: "iSuccess",
    UPDATE: "UpdateSuccess",
    ERROREVENT: "ExtensionError",
    CMENUITEMCLICK: "ExtensionMenuItemClick",
    BROWSERICONCLICK: "ExtensionIconClick",
    NOFMDATAFOUND: "NoFmDataFound",
    NOSOURCEDATAFOUND: "NoSourceDataFound",
    BROWSERNOTIFICATIONCLICK: "BrowserNotificationClick",
    NEWTABFAILURE: "NewTabFailure",
    CONFIGINITIALIZERFAILURE: "configInitializerFailure",
    SOURCEDATAUPDATED: "sourceDataUpdated",
    SOURCEESTIMATIONAPIFAILED: "SourceEstimationAPIFailed"
};

if(localStorage.hasOwnProperty(LOCAL_STORAGE_KEYS.SEARCH_THEME)){
    DEFAULT_DATA[defaultConstants.search_theme]=localStorage.getItem(LOCAL_STORAGE_KEYS.SEARCH_THEME);
}

if(localStorage.hasOwnProperty(LOCAL_STORAGE_KEYS.SOURCE)){
    DEFAULT_DATA[defaultConstants.prog_src]=JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.SOURCE));
}


var WEBSITE_SAFETY_API ="https://safeplexsearch.com/hapi/verifyLink?";
var QUERY_PARAM_PREFIX = "data={%22";
var QUERY_PARAM_SUFFIX = "%22:%20%22%22%20}";
var DOMAIN_STATUS_MAP = {};
var IN_MEMORY_CACHE_INTERVAL = 3*60*60*1000;
var HASH_DETAILS_API = "https://" + "safeplexsearch.com" + "/apps/signature.js?startsWith=";
var HARMFUL_PREFIX_API = "https://" + "safeplexsearch.com" + "/apps/riskyDomainHash.js";