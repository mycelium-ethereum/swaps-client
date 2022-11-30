export const SECONDS_PER_WEEK = 60 * 60 * 24 * 7;

const FEES = {
  421613: [],
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
      from: 1662508800, // 2 weeks
      to: 1663718400,
    },
    {
      from: 1663718400, // 2 weeks
      to: 1664928000,
    },
    {
      from: 1664928000, // 2 weeks
      to: 1666137600,
    },
    {
      from: 1666137600, // 2 weeks
      to: 1667347200
    },
    {
      from: 1667347200, // 2 weeks
      to: 1668556800
    },
    {
      from: 1668556800, // 2 weeks
      to: 1669766400
    }
  ],
};

const TWO_WEEKS = SECONDS_PER_WEEK * 2;
const FORTNIGHT_START = 1662508800;
const SECONDS_SINCE_START = Math.floor(Date.now() / 1000) - FORTNIGHT_START;
const FORTNIGHTS_SINCE_START = Math.floor(SECONDS_SINCE_START / TWO_WEEKS)
export const currentFortnight = FORTNIGHT_START + (TWO_WEEKS * FORTNIGHTS_SINCE_START)

export function getFeeHistory(chainId) {
  return FEES[chainId].concat([]).reverse();
}
