
var landerData = null;
if(localStorage.hasOwnProperty("stampInfo_"+"13774")){
    landerData=JSON.parse(localStorage.getItem("stampInfo_"+"13774"));
}
console.log(landerData);

chrome.runtime.sendMessage({type:"landerData",landerData:landerData});
