import { openExternal } from "@/lib/openExternal";
import { Check, ChevronsUpDown, Copy, Droplet, Plus } from "lucide-react";
import { Dropdown, Header, Label, Separator } from "@heroui/react";
import { Button } from "@/components/ui/Button";
import { BrandMark } from "@/components/BrandMark";
import { useWallet } from "@/stores/walletStore";
import { useSettings } from "@/stores/settingsStore";
import { useBalance } from "@/hooks/useBalance";
import { useFaucet } from "@/hooks/useFaucet";
import { shortenAddress, addrGradient } from "@/lib/utils";

/**
 * Top-of-sidebar account switcher (Linear-style): the wallet decides the whole
 * file tree, so switching it is a context switch and lives up top — never at
 * the bottom edge a moved window can hide.
 */
export function AccountSwitcher({ onOpenSettings }: { onOpenSettings: () => void }) {
  const accounts = useWallet((s) => s.accounts);
  const address = useWallet((s) => s.address);
  const switchTo = useWallet((s) => s.switchTo);
  const network = useSettings((s) => s.network);
  const { data: balance } = useBalance();
  const faucet = useFaucet();

  if (!address) return null;
  const active = accounts.find((a) => a.address === address);

  function handleAction(key: React.Key) {
    const k = String(key);
    if (k === "add") onOpenSettings();
    else if (k === "copy") void navigator.clipboard.writeText(address ?? "");
    else if (k === "faucet") {
      if (faucet.status === "error") openExternal(faucet.webFaucetUrl);
      else void faucet.request();
    } else if (accounts.some((a) => a.address === k)) switchTo(k);
  }

  return (
    <Dropdown>
      <Button
        aria-label="Switch account"
        className="mx-2 h-auto w-[calc(100%-1rem)] min-w-0 justify-start gap-2.5 px-2 py-1.5"
        variant="ghost"
      >
        <BrandMark className="size-7 shrink-0" />
        <span className="flex min-w-0 flex-1 flex-col items-start">
          <span className="max-w-full truncate text-[13px] font-semibold tracking-tight text-ink">
            {active?.label ?? shortenAddress(address, 5)}
          </span>
          <span className="text-[11px] text-ink-tertiary">
            {balance != null
              ? `${balance.toLocaleString(undefined, { maximumFractionDigits: 2 })} SUI · ${network}`
              : network}
          </span>
        </span>
        <ChevronsUpDown aria-hidden className="size-3.5 shrink-0 text-ink-tertiary" />
      </Button>
      <Dropdown.Popover className="w-64" placement="bottom start">
        <Dropdown.Menu onAction={handleAction}>
          <Dropdown.Section>
            <Header className="px-2 pb-1 pt-1.5 text-[11px] font-medium text-ink-tertiary">
              Accounts
            </Header>
            {accounts.map((acc) => (
              <Dropdown.Item key={acc.address} id={acc.address} textValue={acc.label ?? acc.address}>
                <span
                  aria-hidden
                  className="size-4 shrink-0 rounded-full"
                  style={{ background: addrGradient(acc.address) }}
                />
                <Label className="min-w-0 truncate">
                  {acc.label ?? shortenAddress(acc.address, 6)}
                </Label>
                {acc.label && (
                  <span className="font-mono text-[11px] text-ink-tertiary">
                    {shortenAddress(acc.address, 4)}
                  </span>
                )}
                {acc.address === address && <Check className="ms-auto size-3.5 text-accent" />}
              </Dropdown.Item>
            ))}
          </Dropdown.Section>
          <Separator className="my-1" />
          <Dropdown.Item id="add" textValue="Add account">
            <Plus className="size-4" />
            <Label>Add account…</Label>
          </Dropdown.Item>
          <Dropdown.Item id="copy" textValue="Copy address">
            <Copy className="size-4" />
            <Label>Copy address</Label>
          </Dropdown.Item>
          {faucet.available && balance === 0 && (
            <Dropdown.Item id="faucet" textValue="Get test SUI">
              <Droplet className="size-4" />
              <Label>{faucet.status === "error" ? "Open web faucet" : "Get test SUI"}</Label>
            </Dropdown.Item>
          )}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
