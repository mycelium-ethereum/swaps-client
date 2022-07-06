export const recordPageVisit = (walletAddress = undefined) => {
  if (window?.analytics?.page) {
    window.analytics.page();
  } else {
    console.error("Tried to record page but analytics.page is undefined");
  }
  if (walletAddress) {
    identifyUser(walletAddress);
  }
}

export const identifyUser = (walletAddress) => {
  if (window?.analytics?.identify) {
    window.analytics.identify(walletAddress, {
      walletAddress
    });
  } else {
    console.error("Tried to record identify but analytics.identify is undefined");
  }
}