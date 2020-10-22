function setItem(key, value) {
    localStorage.setItem(key, value);
}

function setItemE(key, value) {
    console.log("NEW " + key + value);
    var eventQueue = getItem("e_queue");
    if (eventQueue == null) {
        eventQueue = {};
    } else {
        eventQueue = JSON.parse(eventQueue);
    }
    var newVal = {"value": value, "status": "Queued"};
    if (!eventQueue.hasOwnProperty(key))
        eventQueue[key] = newVal;

    var completedEvents = {};
    for (var jsonKey in eventQueue) {
        var jsonValue = eventQueue[jsonKey];
        console.log(jsonKey + jsonValue["status"]);
        if (jsonValue["status"] == "Fired") {
            console.log(jsonKey);
            completedEvents[jsonKey] = 1;
            delete eventQueue[jsonKey];
        }
    }

    localStorage.setItem("e_queue", JSON.stringify(eventQueue));
    completedEvents = JSON.stringify(completedEvents);
    return completedEvents;
}

function getItem(key) {
    var itemValue = null;
    if (localStorage.hasOwnProperty(key))
        itemValue = localStorage.getItem(key);

    return itemValue;
}



chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        switch (request.task) {
            case "store":
                var completedEvents = setItemE(request.key, request.value);
                sendResponse(completedEvents);
                break;
            default:
                sendResponse();
        }

    }
);

function init() {
    var ele = document.createElement('div');
    ele.setAttribute("id", chrome.runtime.id);
    document.body.appendChild(ele);
}

window.onload = function () {
    init();
};

