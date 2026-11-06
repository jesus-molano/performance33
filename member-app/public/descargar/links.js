// Where the QR sends each phone. The QR always points to /descargar, so it never has to change:
// when the app is published, fill in its store addresses here and nothing else moves.
window.P33_DOWNLOAD_LINKS = {
  // App Store, e.g. 'https://apps.apple.com/app/id0000000000'. null = not published yet.
  ios: null,
  // Google Play, e.g. 'https://play.google.com/store/apps/details?id=…'. null = not published yet.
  android: null,
  // The web version, installable from the browser: always available.
  web: '/',
}
