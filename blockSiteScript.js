var url = new URL(window.location.href);
var blockedUrl = url.searchParams.get('blockedurl');
// document.body.innerHTML = blockedUrl + " has been blocked";
var blockedSiteNameElement = document.getElementById('blockedSiteName');
if (blockedSiteNameElement) {
    if (blockedUrl) blockedSiteNameElement.textContent = blockedUrl;
    else blockedSiteNameElement.textContent = 'This website';
}
