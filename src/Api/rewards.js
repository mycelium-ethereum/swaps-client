import { ARBITRUM, ARBITRUM_TESTNET } from "../Helpers";

const BASE_TRACER_URL = "https://dev.api.tracer.finance";

export function getTracerServerUrl(chainId, path) {
  if (!chainId) {
    throw new Error("chainId is not provided");
  }
  if (chainId === ARBITRUM_TESTNET) {
    chainId = ARBITRUM;
  }

  return `${BASE_TRACER_URL}/trs${path}?network=${chainId}`;
}
