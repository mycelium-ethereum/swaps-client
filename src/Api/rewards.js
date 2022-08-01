const BASE_TRACER_URL = 'http://localhost:3030';

export function getTracerServerUrl(chainId, path) {
  if (!chainId) {
    throw new Error("chainId is not provided");
  }

  return `${BASE_TRACER_URL}/trs${path}?network=${chainId}`;
}
