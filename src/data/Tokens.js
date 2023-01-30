import { ethers } from "ethers";
import { getContract } from "../Addresses";

const TOKENS = {
  421613: [
    {
      name: "Bitcoin (WBTC)",
      symbol: "BTC",
      decimals: 18,
      address: "0x4CC823834038c92CFA66C40C7806959529A3D782",
      isShortable: true,
      isEnabledForTrading: true,
    },
    {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
      address: ethers.constants.AddressZero,
      isShortable: true,
      isNative: true,
      isEnabledForTrading: true,
    },
    {
      name: "Wrapped Ethereum",
      symbol: "WETH",
      decimals: 18,
      address: "0x08466D6683d2A39E3597500c1F17b792555FCAB9",
      isWrapped: true,
      baseSymbol: "ETH",
      isEnabledForTrading: true,
    },
    {
      name: "DAI",
      symbol: "DAI",
      decimals: 18,
      address: "0xE5919a1E8Eabc4E819a485A6115b6606E912620F",
      isStable: false,
      isEnabledForTrading: true,
    },
    {
      name: "PP USD",
      symbol: "PPUSD",
      decimals: 18,
      address: "0xd02C071f5ac809795a22ba50dFB91000929b75BE",
      isStable: true,
      isEnabledForTrading: true,
    },
    {
      name: "USD Coin",
      symbol: "USDC",
      decimals: 18,
      address: "0x263f90bcA00A6E987334D55501Bd8C0D081CeE62",
      isStable: true,
      isEnabledForTrading: true,
    },
    {
      name: "Tether",
      symbol: "USDT",
      decimals: 18,
      address: "0x43B552A6A5B97f120788A8751547D5D953eFBBcA",
      isStable: true,
      isEnabledForTrading: true,
    },
    {
      name: "Link",
      symbol: "LINK",
      decimals: 18,
      address: "0x6E7155bde03E582e9920421Adf14E10C15dBe890",
      isShortable: true,
      isEnabledForTrading: true,
    },
    {
      name: "Test Token",
      symbol: "TEST",
      decimals: 18,
      address: "0xf76A36092f52Ea0ad1dFdDB5aced4e9f414524F2",
      isShortable: true,
      isEnabledForTrading: true,
    },
  ],
  42161: [
    {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
      address: ethers.constants.AddressZero,
      isNative: true,
      isShortable: true,
      imageUrl: "https://assets.coingecko.com/coins/images/279/small/ethereum.png?1595348880",
      isEnabledForTrading: true,
    },
    {
      name: "Wrapped Ethereum",
      symbol: "WETH",
      decimals: 18,
      address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
      isWrapped: true,
      baseSymbol: "ETH",
      imageUrl: "https://assets.coingecko.com/coins/images/2518/thumb/weth.png?1628852295",
      isEnabledForTrading: true,
    },
    {
      name: "Bitcoin (WBTC)",
      symbol: "BTC",
      decimals: 8,
      address: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f",
      isShortable: true,
      imageUrl: "https://assets.coingecko.com/coins/images/7598/thumb/wrapped_bitcoin_wbtc.png?1548822744",
      isEnabledForTrading: true,
    },
    {
      name: "Chainlink",
      symbol: "LINK",
      decimals: 18,
      address: "0xf97f4df75117a78c1A5a0DBb814Af92458539FB4",
      isStable: false,
      isShortable: true,
      imageUrl: "https://assets.coingecko.com/coins/images/877/thumb/chainlink-new-logo.png?1547034700",
      isEnabledForTrading: true,
    },
    {
      name: "Uniswap",
      symbol: "UNI",
      decimals: 18,
      address: "0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0",
      isStable: false,
      isShortable: true,
      imageUrl: "https://assets.coingecko.com/coins/images/12504/thumb/uniswap-uni.png?1600306604",
    },
    {
      name: "USD Coin",
      symbol: "USDC",
      decimals: 6,
      address: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
      isStable: true,
      imageUrl: "https://assets.coingecko.com/coins/images/6319/thumb/USD_Coin_icon.png?1547042389",
      isEnabledForTrading: true,
    },
    {
      name: "Tether",
      symbol: "USDT",
      decimals: 6,
      address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
      isStable: true,
      imageUrl: "https://assets.coingecko.com/coins/images/325/thumb/Tether-logo.png?1598003707",
      isEnabledForTrading: true,
    },
    {
      name: "Dai",
      symbol: "DAI",
      decimals: 18,
      address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
      isStable: true,
      imageUrl: "https://assets.coingecko.com/coins/images/9956/thumb/4943.png?1636636734",
      isEnabledForTrading: true,
    },
    {
      name: "Frax",
      symbol: "FRAX",
      decimals: 18,
      address: "0x17FC002b466eEc40DaE837Fc4bE5c67993ddBd6F",
      isStable: true,
      imageUrl: "https://assets.coingecko.com/coins/images/13422/small/frax_logo.png?1608476506",
    },
    {
      name: "Frax Shares",
      symbol: "FXS",
      decimals: 18,
      isShortable: true,
      address: "0x9d2F299715D94d8A7E6F5eaa8E654E8c74a988A7",
      imageUrl: "https://assets.coingecko.com/coins/images/13423/small/frax_share.png?1608478989",
    },
    {
      name: "Balancer",
      symbol: "BAL",
      decimals: 18,
      isShortable: true,
      address: "0x040d1EdC9569d4Bab2D15287Dc5A4F10F56a56B8",
      imageUrl: "https://assets.coingecko.com/coins/images/11683/small/Balancer.png?1592792958",
    },
    {
      name: "Curve DAO",
      symbol: "CRV",
      decimals: 18,
      isShortable: true,
      address: "0x11cDb42B0EB46D95f990BeDD4695A6e3fA034978",
      imageUrl: "https://assets.coingecko.com/coins/images/12124/small/Curve.png?1597369484",
    },
  ],
};

const ADDITIONAL_TOKENS = {
  42161: [
    {
      name: "MYC",
      symbol: "MYC",
      address: getContract(42161, "MYC"),
      decimals: 18,
    },
    {
      name: "Escrowed MYC",
      symbol: "esMYC",
      address: getContract(42161, "ES_MYC"),
      decimals: 18,
    },
    {
      name: "MYC LP",
      symbol: "MLP",
      address: getContract(42161, "MLP"),
      decimals: 18,
    },
  ],
};

const CHAIN_IDS = [42161, 421613];

const TOKENS_MAP = {};
const TOKENS_BY_SYMBOL_MAP = {};

for (let j = 0; j < CHAIN_IDS.length; j++) {
  const chainId = CHAIN_IDS[j];
  TOKENS_MAP[chainId] = {};
  TOKENS_BY_SYMBOL_MAP[chainId] = {};
  let tokens = TOKENS[chainId];
  if (ADDITIONAL_TOKENS[chainId]) {
    tokens = tokens.concat(ADDITIONAL_TOKENS[chainId]);
  }

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    TOKENS_MAP[chainId][token.address] = token;
    TOKENS_BY_SYMBOL_MAP[chainId][token.symbol] = token;
  }
}

const WRAPPED_TOKENS_MAP = {};
const NATIVE_TOKENS_MAP = {};
for (const chainId of CHAIN_IDS) {
  for (const token of TOKENS[chainId]) {
    if (token.isWrapped) {
      WRAPPED_TOKENS_MAP[chainId] = token;
    } else if (token.isNative) {
      NATIVE_TOKENS_MAP[chainId] = token;
    }
  }
}

export function getWrappedToken(chainId) {
  return WRAPPED_TOKENS_MAP[chainId];
}

export function getNativeToken(chainId) {
  return NATIVE_TOKENS_MAP[chainId];
}

export function getTokens(chainId) {
  return TOKENS[chainId];
}

export function isValidToken(chainId, address) {
  if (!TOKENS_MAP[chainId]) {
    throw new Error(`Incorrect chainId ${chainId}`);
  }
  return address in TOKENS_MAP[chainId];
}

export function getToken(chainId, address) {
  if (!TOKENS_MAP[chainId]) {
    throw new Error(`Incorrect chainId ${chainId}`);
  }
  if (!TOKENS_MAP[chainId][address]) {
    throw new Error(`Incorrect address "${address}" for chainId ${chainId}`);
  }
  return TOKENS_MAP[chainId][address];
}

export function getTokenBySymbol(chainId, symbol) {
  const token = TOKENS_BY_SYMBOL_MAP[chainId][symbol];
  if (!token) {
    throw new Error(`Incorrect symbol "${symbol}" for chainId ${chainId}`);
  }
  return token;
}

export function getWhitelistedTokens(chainId) {
  return TOKENS[chainId].filter((token) => token.symbol !== "USDG");
}
