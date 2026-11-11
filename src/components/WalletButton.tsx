"use client";
import { useEffect, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { useSession } from "./Providers";
import { friendlyWalletError, short } from "@/lib/client";
import { CLUSTER } from "@/lib/config";

export default function WalletButton() {
  const { wallet, loading, signIn, signOut, pickerOpen, setPickerOpen } = useSession();
  const { wallets, select, connected, connecting, publicKey } = useWallet();
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const wantSignIn = useRef(false);
  const [menu, setMenu] = useState(false);

  // After the person picks a wallet and it connects, go straight to the sign-in signature.
  useEffect(() => {
    if (connected && publicKey && wantSignIn.current && !wallet) {
      wantSignIn.current = false;
      setBusy(true);
      signIn()
        .then(() => setPickerOpen(false))
        .catch((e) => setErr(friendlyWalletError(e)))
        .finally(() => setBusy(false));
    }
  }, [connected, publicKey, wallet, signIn, setPickerOpen]);

  const installed = wallets.filter(
    (w) => w.readyState === WalletReadyState.Installed || w.readyState === WalletReadyState.Loadable
  );

  async function start() {
    setErr("");
    if (connected && publicKey) {
      setBusy(true);
      try {
        await signIn();
      } catch (e) {
        setErr(friendlyWalletError(e));
        setPickerOpen(true);
      } finally {
        setBusy(false);
      }
      return;
    }
    setPickerOpen(true);
  }

  if (loading) return <span className="wallet-btn ghost" aria-hidden />;

  if (wallet)
    return (
      <div className="wallet-menu">
        <button className="wallet-btn signed" onClick={() => setMenu((m) => !m)} aria-expanded={menu}>
          <span className="dot" aria-hidden />
          {short(wallet)}
        </button>
        {menu && (
          <div className="wallet-pop" role="menu">
            <a href={`/u/${wallet}`} role="menuitem">Your profile</a>
            <a href="/me" role="menuitem">Your gigs</a>
            <button role="menuitem" onClick={() => { setMenu(false); signOut(); }}>Sign out</button>
          </div>
        )}
      </div>
    );

  return (
    <>
      <button className="wallet-btn" onClick={start} disabled={busy || connecting}>
        {busy || connecting ? "Check your wallet…" : "Sign in"}
      </button>
      {pickerOpen && (
        <div className="sheet-backdrop" onClick={() => setPickerOpen(false)}>
          <div className="sheet" role="dialog" aria-label="Choose a wallet" onClick={(e) => e.stopPropagation()}>
            <h2>Sign in with your wallet</h2>
            <p className="muted">
              You&apos;ll sign a message to prove the wallet is yours. It&apos;s free and doesn&apos;t send anything.
            </p>
            {CLUSTER === "devnet" && (
              <p className="hint">
                The site is in test mode on Solana devnet. Switch Phantom to devnet in Settings, Developer settings, Testnet mode.
              </p>
            )}
            {installed.length ? (
              <ul className="wallet-list">
                {installed.map((w) => (
                  <li key={w.adapter.name}>
                    <button
                      onClick={() => {
                        setErr("");
                        wantSignIn.current = true;
                        select(w.adapter.name);
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={w.adapter.icon} alt="" width={28} height={28} />
                      {w.adapter.name}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>
                No Solana wallet found in this browser. Install <a href="https://phantom.com" target="_blank" rel="noreferrer">Phantom</a>, or
                open this site inside your wallet app&apos;s browser on iPhone.
              </p>
            )}
            {err && <p className="error">{err}</p>}
            <button className="text-btn" onClick={() => setPickerOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}
