// converts a stage number to human readable text
// used for segment analytics
export function getAnalyticsEventStage(stage: number) {
  switch (stage) {
    case 1:
      return "Approve";
    case 2:
      return "Pre-confirmation";
    case 3:
      return "Post-confirmation";
    default:
      return "Approve";
  }
}

