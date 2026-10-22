// Shared Firebase settings for all projects (not secret — access is controlled by Firestore rules)
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyDS0g06XzUA08AfVOwqcxeNChiES7jAgE0",
  authDomain: "ziviz-projects.firebaseapp.com",
  projectId: "ziviz-projects",
  storageBucket: "ziviz-projects.firebasestorage.app",
  messagingSenderId: "115708322967",
  appId: "1:115708322967:web:f99079f740c4515bddf5d2"
};

// Google image search inside the ABC cards (key is restricted to this site + Custom Search API only)
window.IMAGE_SEARCH = {
  key: "AIzaSyD2WxhxdjmcU-Go5_DCt_FGhwYYScccKbI",
  cx: "17117da2802a946e2"
};
