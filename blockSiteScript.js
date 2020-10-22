var url = new URL(window.location.href);
var blockedUrl = url.searchParams.get("blockedurl")
document.body.innerHTML = blockedUrl + " has been blocked";
