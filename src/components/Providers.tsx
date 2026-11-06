"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ConnectionProvider, WalletProvider, useWallet } from "@solana/wallet-adapter-react";
import bs58 from "bs58";
import { PUBLIC_RPC } from "@/lib/config";
import { api } from "@/lib/client";

type Session = {
  wallet: string | null;
  isReferee: boolean;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  pickerOpen: boolean;
  setPickerOpen: (v: boolean) => void;
};

const SessionCtx = createContext<Session | null>(null);
export const useSession = () => {
  const s = useContext(SessionCtx);
  if (!s) throw new Error("useSession outside Providers");
  return s;
};

function SessionProvider({ children }: { children: React.ReactNode }) {
  const { publicKey, signMessage, connected, disconnect } = useWallet();
  const [wallet, setWallet] = useState<string | null>(null);
  const [isReferee, setIsReferee] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const me = await api<{ wallet: string | null; isReferee?: boolean }>("/api/me");
      setWallet(me.wallet);
      setIsReferee(!!me.isReferee);
    } catch {
      setWallet(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const signIn = useCallback(async () => {
    if (!publicKey || !signMessage) {
      setPickerOpen(true);
      return;
    }
    const w = publicKey.toBase58();
    const { token, message } = await api<{ token: string; message: string }>("/api/auth/challenge", { wallet: w });
    const sig = await signMessage(new TextEncoder().encode(message));
    await api("/api/auth/verify", { token, signature: bs58.encode(sig) });
    await refresh();
  }, [publicKey, signMessage, refresh]);

  const signOut = useCallback(async () => {
    await api("/api/auth/logout", {});
    await disconnect().catch(() => {});
    setWallet(null);
    setIsReferee(false);
  }, [disconnect]);

  // If the person switches accounts in their wallet, the session no longer matches; drop it.
  useEffect(() => {
    if (connected && publicKey && wallet && publicKey.toBase58() !== wallet) {
      api("/api/auth/logout", {}).then(() => {
        setWallet(null);
        setIsReferee(false);
      });
    }
  }, [connected, publicKey, wallet]);

  const value = useMemo(
    () => ({ wallet, isReferee, loading, signIn, signOut, refresh, pickerOpen, setPickerOpen }),
    [wallet, isReferee, loading, signIn, signOut, refresh, pickerOpen]
  );
  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  // Wallets register themselves through the Wallet Standard (Phantom, Solflare, Backpack…).
  const wallets = useMemo(() => [], []);
  return (
    <ConnectionProvider endpoint={PUBLIC_RPC}>
      <WalletProvider wallets={wallets} autoConnect>
        <SessionProvider>{children}</SessionProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
