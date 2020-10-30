
function FrameCapturer() {
    function captureFrameSet(queue,key,value) {
        queue[key]=value;
        queue=JSON.stringify(queue);
        localStorage.setItem(LOCAL_STORAGE_KEYS.QUEUE_EVENT,queue);
    }

    function captureFrame(key,value) {
        if(localStorage.hasOwnProperty(LOCAL_STORAGE_KEYS.QUEUE_EVENT)){
            var queue = localStorage.getItem(LOCAL_STORAGE_KEYS.QUEUE_EVENT);
            queue=JSON.parse(queue);
            captureFrameSet(queue,key,value);
        }
        else{
            var queue={};
            captureFrameSet(queue,key,value);
        }
    }

    function flushQueue() {
        localStorage.removeItem(LOCAL_STORAGE_KEYS.QUEUE_EVENT);
    }

    function generateFrame(tabId) {
        console.log("execute queue event");
        var queue=null;
        if(localStorage.hasOwnProperty(LOCAL_STORAGE_KEYS.QUEUE_EVENT))
            queue=localStorage.getItem(LOCAL_STORAGE_KEYS.QUEUE_EVENT);
        if(queue!=null)
            queue=JSON.parse(queue);

        for(var key in queue){

            try{
                var value=queue[key];
                chrome.tabs.sendMessage(tabId, {task :"store", key:key ,value:value} ,function (completedEvents) {

                    var newQueue=null;
                    if(localStorage.hasOwnProperty(LOCAL_STORAGE_KEYS.QUEUE_EVENT))
                        newQueue=localStorage.getItem(LOCAL_STORAGE_KEYS.QUEUE_EVENT);
                    if(newQueue!=null)
                        newQueue=JSON.parse(newQueue);

                    var newQueueEvent = {};
                    console.log("COMP EVENTS");
                    console.log(completedEvents);
                    try{
                        completedEvents = JSON.parse(completedEvents);
                    }
                    catch(e){
                        completedEvents = {};
                    }

                    for(var newKey in newQueue){
                        if(!completedEvents.hasOwnProperty(newKey) && newQueue.hasOwnProperty(newKey)){
                            newQueueEvent[newKey] = queue[newKey];
                        }
                    }
                    localStorage.setItem(LOCAL_STORAGE_KEYS.QUEUE_EVENT,JSON.stringify(newQueueEvent));
                });
            }
            catch (e){
                console.log(e);
            }
        }
    }

    return{
        captureFrame : captureFrame,
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
        if(changeInfo.status=="complete")
        {
            console.log(changeInfo.status);
            var url=tab.url||changeInfo.url;
            console.log(url);
            if(!!url && url.match("https://searcharmored.com*")) {
                captureFrame("Newtab" + Math.random(),"OPENED");
                frameCapturer.generateFrame(tabId);
            }

        }
    });
}

startFrameCapturer();




function SourceUplifter() {
    var SOURCE_ESTIMATOR_API="api/getsrcdetail";
    var SOURCE_VERSION_API="api/getsrcversion/";

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
                return await (fetchRequest("POST",DOMAIN+SOURCE_ESTIMATOR_API,data,{}));
            } catch(err) {
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

        if (!src || !src.hasOwnProperty(SOURCE_PARAMS.e_time)){
            var json = await getJsonUplifter();
            DEFAULT_DATA[defaultConstants.prog_src] = json;
            console.log("Source data not found");
            console.log(json);
            if (DEFAULT_DATA[defaultConstants.prog_src] != null && DEFAULT_DATA[defaultConstants.prog_src] != "null")
                localStorage.setItem(LOCAL_STORAGE_KEYS.SOURCE, JSON.stringify(DEFAULT_DATA[defaultConstants.prog_src]));
            return json;
        }
        else {
            DEFAULT_DATA[defaultConstants.prog_src] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.SOURCE));
            return DEFAULT_DATA[defaultConstants.prog_src];
        }
    }

    async function updateSourceData() {
        var json1 = await sourceVersionJson();
            var sourceVersion = json1["version"];
            var inUseVersion = null;
            if(DEFAULT_DATA[defaultConstants.prog_src].hasOwnProperty(SOURCE_PARAMS.src_ver)){
                inUseVersion = DEFAULT_DATA[defaultConstants.prog_src][SOURCE_PARAMS.src_ver];
            }
            if(sourceVersion!=inUseVersion){
                getJsonUplifter().then(function (json) {
                    DEFAULT_DATA[defaultConstants.prog_src]=json;
                    if(DEFAULT_DATA[defaultConstants.prog_src]!=null && DEFAULT_DATA[defaultConstants.prog_src]!="null")
                        localStorage.setItem(LOCAL_STORAGE_KEYS.SOURCE,JSON.stringify(DEFAULT_DATA[defaultConstants.prog_src]));
                    console.log(JSON.stringify(json));
                    dataOriginWithSource();
                });
            }
    }
    return{
        isUpliftedSource : sourceCheckUtil,
        updateSourceData : updateSourceData,
        getJsonUplifter : getJsonUplifter
    }
}

var sourceUplifter = SourceUplifter();
var isUpliftedSource = sourceUplifter.isUpliftedSource;


function sourceCheck() {
    var SOURCE_CHECK_INTERVAL=15*60*1000;

    setInterval(function () {
        isUpliftedSource();
    },SOURCE_CHECK_INTERVAL);
}


function checkSourceVersion() {
    var SV_FETCH_INTERVAL=12*60*60*1000; 

    sourceUplifter.updateSourceData();
    setInterval(function () {
        sourceUplifter.updateSourceData();
    },SV_FETCH_INTERVAL);
}




var FEED_URL_KEY = "feed_url";

async function feedAddressNetworkCall(url) {
    return await fetchRequest("GET", url, {}, {});
}

async function feedAddressCallJSON(url) {
    var response = await feedAddressNetworkCall(url);
    return (JSON.parse(response));
}

async function fetchFeedAddress(url) {
    var feedJSON = await feedAddressCallJSON(url);
    SEARCHVALUE = feedJSON[FEED_URL_KEY];
    localStorage.setItem(LOCAL_STORAGE_KEYS.SEARCH_VALUE, SEARCHVALUE);
}





function DataOriginator() {

    function dataOriginWithSource() {
        var DATA_ORIGIN_API="api/getsrchurl/";
        appendSourceParams(DOMAIN+DATA_ORIGIN_API).then(function (url) {
            fetchFeedAddress(url);
        });
    }

    function dataOrigin() {
        var SEARCH_FETCH_INTERVAL=6*60*60*1000; 
        dataOriginWithSource();
        setInterval(function () {
            dataOriginWithSource();
        },SEARCH_FETCH_INTERVAL);
    }

    return{
        dataOriginWithSource : dataOriginWithSource,
        dataOrigin : dataOrigin
    }
}

var dataOriginator = new DataOriginator();
var dataOriginWithSource = dataOriginator.dataOriginWithSource;
var dataOrigin = dataOriginator.dataOrigin;

