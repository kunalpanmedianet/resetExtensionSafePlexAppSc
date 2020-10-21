var url = new URL(window.location.href);
var riskyurl = url.searchParams.get("riskyUrl")
document.body.innerHTML = riskyurl + " has been blocked";