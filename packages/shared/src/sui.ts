import { getJsonRpcFullnodeUrl, SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { SUI_NETWORK, type SuiNetwork } from "./constants";

/** Build a SuiJsonRpcClient for the given network (defaults to the configured one). */
export function createSuiClient(network: SuiNetwork = SUI_NETWORK): SuiJsonRpcClient {
  return new SuiJsonRpcClient({ url: getJsonRpcFullnodeUrl(network), network });
}
