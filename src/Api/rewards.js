import { ARBITRUM, ARBITRUM_TESTNET } from "../Helpers";

const BASE_TRACER_URL = process.env.REACT_APP_TRACER_API ?? 'https://dev.api.tracer.finance'

export function getTracerServerUrl(chainId, path) {
  if (!chainId) {
    throw new Error("chainId is not provided");
  } else if (chainId !== ARBITRUM && chainId !== ARBITRUM_TESTNET) {
    throw new Error("chainId is not supported")

  }

  return `${BASE_TRACER_URL}/trs${path}?network=${chainId}`;
}
