import { useMemo } from "react";
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { useSettings } from "@/stores/settingsStore";
import type { SuiNetwork } from "@/lib/constants";

/**
 * One shared SuiJsonRpcClient per network. Hooks used to each `new` their own
 * instance; this caches a single client per network so the whole app reuses it.
 */
const clients = new Map<SuiNetwork, SuiJsonRpcClient>();

export function getSuiClient(network: SuiNetwork): SuiJsonRpcClient {
  let client = clients.get(network);
  if (!client) {
    client = new SuiJsonRpcClient({ url: getJsonRpcFullnodeUrl(network), network });
    clients.set(network, client);
  }
  return client;
}

/** The shared client for the active network (from settings). */
export function useSuiClient(): SuiJsonRpcClient {
  const network = useSettings((s) => s.network);
  return useMemo(() => getSuiClient(network), [network]);
}
