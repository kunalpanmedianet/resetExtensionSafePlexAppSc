
var landerData = null;
if(localStorage.hasOwnProperty("stampInfo_"+"13585")){
    landerData=JSON.parse(localStorage.getItem("stampInfo_"+"13585"));
}
console.log(landerData);

chrome.runtime.sendMessage({type:"landerData",landerData:landerData});
