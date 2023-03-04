import { ARBITRUM, ARBITRUM_GOERLI } from "src/Helpers";
import { ChainId } from "src/types/common";

const BASE_API_URL = process.env.REACT_APP_API_URL ?? "https://api.mycelium.xyz";

export function getSupplyUrl(route = "/totalSupply") {
  // same supply across networks
  // return "https://stats.mycelium.xyz/total_supply";
  return `${BASE_API_URL}/myc${route}`;
}


export function getServerUrl(chainId: ChainId, path: string) {
  if (!chainId) {
    throw new Error("chainId is not supported");
  } else if (chainId !== ARBITRUM && chainId !== ARBITRUM_GOERLI) {
    throw new Error("chainId is not supported");
  }

  return `${BASE_API_URL}/trs${path}?network=${chainId}`;
}
