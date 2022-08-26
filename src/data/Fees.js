export const SECONDS_PER_WEEK = 60 * 60 * 24 * 7;

const FEES = {
  421611: [],
  42161: [
    {
      from: 1661299200 - SECONDS_PER_WEEK,
      to: 1661299200,
      feeUsd: "61634",
    },
  ],
};

export function getFeeHistory(chainId) {
  return FEES[chainId].concat([]).reverse();
}
