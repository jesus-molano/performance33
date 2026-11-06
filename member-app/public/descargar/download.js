// Sends the phone to its store, or to the web version while the app is not published there.
// No inline script: the page's Content-Security-Policy only allows scripts from this site.
(function () {
  var links = window.P33_DOWNLOAD_LINKS || { ios: null, android: null, web: '/' }
  var agent = navigator.userAgent || ''
  // iPads on iPadOS 13+ say they are a Mac: a touch screen tells them apart.
  var isIos = /iPhone|iPad|iPod/.test(agent) || (/Macintosh/.test(agent) && navigator.maxTouchPoints > 1)
  var isAndroid = /Android/.test(agent)
  var target = (isIos && links.ios) || (isAndroid && links.android) || links.web
  document.getElementById('continue').setAttribute('href', target)
  window.location.replace(target)
})()
