import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { SUI_NETWORK, type SuiNetwork } from "./constants";

/** Build a SuiClient for the given network (defaults to the configured one). */
export function createSuiClient(network: SuiNetwork = SUI_NETWORK): SuiClient {
  return new SuiClient({ url: getFullnodeUrl(network) });
}
