export const recordPageVisit = (walletAddress = undefined) => {
  if (window?.analytics?.page) {
    window.analytics.page();
  } else {
    console.error("Tried to record page but analytics.page is undefined");
  }
  if (walletAddress && window?.analytics?.identify) {
    window.analytics.identify(walletAddress);
  }
}

export const identifyUser = (walletAddress) => {
  if (window?.analytics?.identify) {
    console.log("IDENTIFY USER", walletAddress);
    window.analytics.identify(walletAddress);
  } else {
    console.error("Tried to record identify but analytics.identify is undefined");
  }
}