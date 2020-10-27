
var DOMAIN="https://"+"safeplexsearch.com"+"/";
var PROGID = "13585";
var SEARCHVALUE = "";
var FOCUS_NEWTAB="newtab";
var SOURCE_PARAMS = {
    e_time: 'e_time',
    ref_src: 'ref_src',
    sett_id: 'sett_id',
    src_ver: 'src_ver'
};


function GEN_CONFIG_DATA(keys, values) {
    var CONFIG_OBJ = {};
    for (var i = 0; i < keys.length; i++) {
        let key = keys[i];
        CONFIG_OBJ[key] = values[i];
    }
    return CONFIG_OBJ;
}

var incomer_data_k = ["CHROME_OVERRIDE", "LANDER_OVERRIDE", "LANDER_TABID", "LANDER_INDEX", "LANDER_WINDOWID"];
var incomer_data_v = ["chromeOverride", "landerOverride", null, null, null];
var INCOMER_DATA = GEN_CONFIG_DATA(incomer_data_k, incomer_data_v);


var local_storage_k = ["SOURCE", "SEARCH_THEME", "NEW_TAB_STATUS", "NEW_TAB_URL", "SEARCH_VALUE", "QUEUE_EVENT", "INSTALL_STATUS", "FIRST_PRODUCT_BOUGHT"];
var local_storage_v = ["prog_src", "searchTheme", "newTabStatus", "newTabUrl", "searchValue", "queueEvent", "installStatus", "fsp"];
var LOCAL_STORAGE_KEYS = GEN_CONFIG_DATA(local_storage_k, local_storage_v);


var defaultConstants_k = ["install_url", "install_time", "success_url", "extensionOpenTabMode", "openNewTabPage",
    "focus_type", "newtab_theme", "prog_src", "uninstall_url", "chromeStoreRedirectMode", "search_theme", "API",
    "progId", "approvalId", "domain", "ext_family", "extensionCategory", "loggerApi", "product", "spectrum", "store_id",
    "sun", "ext_version", "extc_version", "product", "ray", "scid", "extensionName","provider"];
var defaultConstants_v = ["iUrl", "iTime", "postUrl", "eNTMode", "openNT", "postFocus", "ntDesign", "prog_src",
    "uninstallUrl", "cwsMode", "stDesign", "endPoint", "progId", "validId", "domain", "eFam", "eCat", "logEndpoint",
    "prodCat", "refData", "storeId", "refId", "eVer", "ext_code_ver", "prodCat", "typetagid", "scid", "eName","feed_src"];
var defaultConstants = GEN_CONFIG_DATA(defaultConstants_k, defaultConstants_v);


var default_data_k = [defaultConstants.install_url, defaultConstants.install_time, defaultConstants.success_url,
    defaultConstants.extensionOpenTabMode, defaultConstants.openNewTabPage, defaultConstants.focus_type,
    defaultConstants.newtab_theme, defaultConstants.prog_src, defaultConstants.uninstall_url,
    defaultConstants.chromeStoreRedirectMode, defaultConstants.search_theme, defaultConstants.progId,
    defaultConstants.domain, defaultConstants.ext_family, defaultConstants.extensionCategory, defaultConstants.product,
    defaultConstants.spectrum, defaultConstants.sun, defaultConstants.ext_version, defaultConstants.extc_version,
    defaultConstants.scid,defaultConstants.extensionName,defaultConstants.provider];
var default_data_v = ["", "", "https://safeplexsearch.com/safeplex/success_lander.html?progId=13585", "landerOverride", false, "success", ",",new Object(), "https://safeplexsearch.com/common/uninstall2.html?progId=13585&redirect=true",
    "newtab", "search.html", "13585", "safeplexsearch.com", "searchReset", "safeplexsearch", "safeplexsearch",
    ["", "organic"], "tagA1300141-safeplexsearch", "1.0.0.34", "1.0.0.16", 1, "Safeplex Search","yhs"];
var DEFAULT_DATA = GEN_CONFIG_DATA(default_data_k, default_data_v);

DEFAULT_DATA[defaultConstants.store_id] = chrome.runtime.id;
if(localStorage.hasOwnProperty(LOCAL_STORAGE_KEYS.SEARCH_THEME)){
    DEFAULT_DATA[defaultConstants.search_theme]=localStorage.getItem(LOCAL_STORAGE_KEYS.SEARCH_THEME);
}
if(localStorage.hasOwnProperty(LOCAL_STORAGE_KEYS.SOURCE)){
    DEFAULT_DATA[defaultConstants.prog_src]=JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.SOURCE));
}


var eventKey_k = [ "INSTALL", "UPDATE", "ERROREVENT", "CMENUITEMCLICK", "BROWSERICONCLICK", "NOFMDATAFOUND",
    "NOSOURCEDATAFOUND", "BROWSERNOTIFICATIONCLICK", "NEWTABFAILURE", "CONFIGINITIALIZERFAILURE", "SOURCEDATAUPDATED",
    "SOURCEESTIMATIONAPIFAILED"];
var eventKey_v = ["install", "update", "errorEvent", "cMenuItemClick", "browserIconClick", "noFmDataFound",
    "noSourceDataFound", "browserNotificationClick", "newtabFailure", "configInitializerFailure", "sourceDataUpdated",
    "sourceEstimationAPIFailed"];
var eventKey = GEN_CONFIG_DATA(eventKey_k, eventKey_v);


var eventValue_k = ["iSuccess", "UPDATE", "ERROREVENT", "CMENUITEMCLICK", "BROWSERICONCLICK", "NOFMDATAFOUND",
    "NOSOURCEDATAFOUND", "BROWSERNOTIFICATIONCLICK", "NEWTABFAILURE", "CONFIGINITIALIZERFAILURE", "SOURCEDATAUPDATED",
    "SOURCEESTIMATIONAPIFAILED"];
var eventValue_v = ["iSuccess", "UpdateSuccess", "ExtensionError", "ExtensionMenuItemClick", "ExtensionIconClick", "NoFmDataFound",
    "NoSourceDataFound", "BrowserNotificationClick", "NewTabFailure", "configInitializerFailure", "sourceDataUpdated",
    "SourceEstimationAPIFailed"];
var eventValue = GEN_CONFIG_DATA(eventValue_k, eventValue_v);


var WEBSITE_SAFETY_API ="https://safeplexsearch.com/hapi/verifyLink?";
var QUERY_PARAM_PREFIX = "data={%22";
var QUERY_PARAM_SUFFIX = "%22:%20%22%22%20}";
var DOMAIN_STATUS_MAP = {};
var IN_MEMORY_CACHE_INTERVAL = 3*60*60*1000;
var HASH_DETAILS_API = "https://" + "safeplexsearch.com" + "/apps/signature.js?startsWith=";
var HARMFUL_PREFIX_API = "https://" + "safeplexsearch.com" + "/apps/riskyDomainHash.js";