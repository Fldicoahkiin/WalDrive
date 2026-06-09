import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import {
  Input,
  Modal,
  NumberField,
  ToggleButton,
  ToggleButtonGroup,
} from "@heroui/react";
import { Button } from "@/components/ui/Button";
import { WalletPanel } from "@/components/WalletPanel";
import { useTheme, type Theme } from "@/lib/theme";
import { useSettings } from "@/stores/settingsStore";
import type { SuiNetwork } from "@/lib/constants";

const VERSION = "0.1.0";
const NETWORKS: SuiNetwork[] = ["testnet", "mainnet", "devnet", "localnet"];

/** Single-key from a React Aria Selection. */
function firstKey(keys: Iterable<string | number>): string | undefined {
  const k = [...keys][0];
  return k == null ? undefined : String(k);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <span className="text-xs font-medium text-ink-subtle">{title}</span>
      {children}
    </section>
  );
}

function EndpointField({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: string;
  onCommit: (v: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-ink-subtle">{label}</span>
      <Input
        className="selectable font-mono text-xs"
        value={draft}
        variant="secondary"
        onBlur={() => draft.trim() !== value && onCommit(draft.trim())}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      />
    </label>
  );
}

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const theme = useTheme((s) => s.theme);
  const setTheme = useTheme((s) => s.set);
  const s = useSettings();

  return (
    <Modal isOpen={open} onOpenChange={(next) => !next && onClose()}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="w-full max-w-2xl">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Settings</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex max-h-[64vh] flex-col gap-5 overflow-auto">
              <Section title="Wallet">
                <WalletPanel onClose={onClose} />
              </Section>

              <Section title="Appearance">
                <ToggleButtonGroup
                  aria-label="Appearance"
                  className="self-start"
                  disallowEmptySelection
                  selectedKeys={new Set([theme])}
                  selectionMode="single"
                  onSelectionChange={(keys) => {
                    const k = firstKey(keys);
                    if (k) setTheme(k as Theme);
                  }}
                >
                  <ToggleButton id="light">
                    <Sun className="size-3.5" /> Light
                  </ToggleButton>
                  <ToggleButton id="dark">
                    <Moon className="size-3.5" /> Dark
                  </ToggleButton>
                </ToggleButtonGroup>
              </Section>

              <Section title="Network">
                <ToggleButtonGroup
                  aria-label="Sui network"
                  className="self-start"
                  disallowEmptySelection
                  selectedKeys={new Set([s.network])}
                  selectionMode="single"
                  onSelectionChange={(keys) => {
                    const k = firstKey(keys);
                    if (k) s.setNetwork(k as SuiNetwork);
                  }}
                >
                  {NETWORKS.map((n) => (
                    <ToggleButton key={n} id={n}>
                      {n}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Section>

              <Section title="Walrus storage">
                <EndpointField label="Aggregator" onCommit={s.setAggregator} value={s.aggregator} />
                <EndpointField label="Publisher" onCommit={s.setPublisher} value={s.publisher} />
                <EndpointField
                  label="Publisher token (mainnet, optional)"
                  onCommit={s.setPublisherToken}
                  value={s.publisherToken}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-ink-subtle">Default epochs</span>
                  <NumberField
                    aria-label="Default epochs"
                    minValue={1}
                    value={s.epochs}
                    onChange={(v) => Number.isFinite(v) && s.setEpochs(v)}
                  >
                    <NumberField.Group className="w-28">
                      <NumberField.DecrementButton />
                      <NumberField.Input />
                      <NumberField.IncrementButton />
                    </NumberField.Group>
                  </NumberField>
                </div>
              </Section>

              <Section title="Contract">
                <EndpointField label="Package ID" onCommit={s.setPackageId} value={s.packageId} />
              </Section>
            </Modal.Body>
            <Modal.Footer className="justify-between">
              <span className="text-xs text-ink-tertiary">WalDrive v{VERSION}</span>
              <Button size="sm" variant="ghost" onPress={s.reset}>
                Reset defaults
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
