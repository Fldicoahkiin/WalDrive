import { create } from "zustand";
import { persist } from "zustand/middleware";
import { WALRUS, SUI_NETWORK, CONTRACT, setAggregatorBase, type SuiNetwork } from "@/lib/constants";

interface SettingsState {
  network: SuiNetwork;
  aggregator: string;
  publisher: string;
  epochs: number;
  packageId: string;
  setNetwork: (network: SuiNetwork) => void;
  setAggregator: (aggregator: string) => void;
  setPublisher: (publisher: string) => void;
  setEpochs: (epochs: number) => void;
  setPackageId: (packageId: string) => void;
  reset: () => void;
}

const DEFAULTS = {
  network: SUI_NETWORK,
  aggregator: WALRUS.AGGREGATOR,
  publisher: WALRUS.PUBLISHER,
  epochs: WALRUS.EPOCHS_DEFAULT,
  packageId: CONTRACT.PACKAGE_ID,
};

/**
 * Runtime configuration (network, Walrus endpoints, epochs, contract), persisted
 * to localStorage. Env values seed the defaults; the user can override them in
 * Settings without rebuilding. blobUrl() reads the aggregator via setAggregatorBase.
 */
export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setNetwork: (network) => set({ network }),
      setAggregator: (aggregator) => {
        setAggregatorBase(aggregator);
        set({ aggregator });
      },
      setPublisher: (publisher) => set({ publisher }),
      setEpochs: (epochs) => set({ epochs }),
      setPackageId: (packageId) => set({ packageId }),
      reset: () => {
        setAggregatorBase(DEFAULTS.aggregator);
        set({ ...DEFAULTS });
      },
    }),
    {
      name: "waldrive-settings-v2",
      onRehydrateStorage: () => (state) => {
        if (state) setAggregatorBase(state.aggregator);
      },
    },
  ),
);
