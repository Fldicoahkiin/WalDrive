import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { useWallet } from "@/stores/walletStore";
import { useSettings } from "@/stores/settingsStore";

const MIST_PER_SUI = 1_000_000_000;

/** SUI balance (in SUI, not MIST) for the active wallet, refreshed periodically. */
export function useBalance() {
  const address = useWallet((s) => s.address);
  const network = useSettings((s) => s.network);
  const suiClient = useMemo(() => new SuiClient({ url: getFullnodeUrl(network) }), [network]);

  return useQuery({
    queryKey: ["balance", address, network],
    enabled: Boolean(address),
    refetchInterval: 15_000,
    queryFn: async (): Promise<number> => {
      const { totalBalance } = await suiClient.getBalance({ owner: address as string });
      return Number(totalBalance) / MIST_PER_SUI;
    },
  });
}
