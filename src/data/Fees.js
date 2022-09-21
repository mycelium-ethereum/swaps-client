export const SECONDS_PER_WEEK = 60 * 60 * 24 * 7;

const FEES = {
  421611: [],
  42161: [
    {
      from: 1661299200 - SECONDS_PER_WEEK,
      to: 1661299200,
    },
    {
      from: 1662508800 - SECONDS_PER_WEEK,
      to: 1662508800,
    },
    {
      from: 1662508800 - (SECONDS_PER_WEEK * 2), // 1662508800
      to: 1663718400,
    },
  ],
};

export function getFeeHistory(chainId) {
  return FEES[chainId].concat([]).reverse();
}
