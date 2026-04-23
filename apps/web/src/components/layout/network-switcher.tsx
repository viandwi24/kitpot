"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  getSelectedNetwork,
  setSelectedNetwork,
  getLocalConfig,
  saveLocalConfig,
  getDefaultLocalConfig,
  type NetworkKey,
  type LocalConfig,
} from "@/lib/network";

function LocalConfigModal({ onSave, onCancel }: { onSave: (c: LocalConfig) => void; onCancel: () => void }) {
  const defaults = getDefaultLocalConfig();
  const saved = getLocalConfig();
  const init = saved ?? defaults;

  const [rpcUrl, setRpcUrl] = useState(init.rpcUrl);
  const [chainId, setChainId] = useState(String(init.chainId));
  const [circle, setCircle] = useState(init.kitpotCircle);
  const [usdc, setUsdc] = useState(init.mockUSDC);
  const [rep, setRep] = useState(init.reputation);
  const [ach, setAch] = useState(init.achievements);

  function handleSave() {
    onSave({
      rpcUrl,
      chainId: Number(chainId),
      kitpotCircle: circle as `0x${string}`,
      mockUSDC: usdc as `0x${string}`,
      reputation: rep as `0x${string}`,
      achievements: ach as `0x${string}`,
    });
  }

  function handleReset() {
    onSave(defaults);
  }

  const content = (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="w-full max-w-md rounded-t-2xl border border-border bg-background p-6 shadow-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="mb-1 text-base font-semibold">Local Network Config</h2>
        <p className="mb-4 text-xs text-muted-foreground">Disimpan di localStorage, tidak perlu edit .env</p>

        <div className="space-y-3">
          {[
            { label: "RPC URL", value: rpcUrl, onChange: setRpcUrl, placeholder: "http://localhost:8545" },
            { label: "Chain ID", value: chainId, onChange: setChainId, placeholder: "31337" },
            { label: "KitpotCircle", value: circle, onChange: setCircle, placeholder: "0x..." },
            { label: "MockUSDC", value: usdc, onChange: setUsdc, placeholder: "0x..." },
            { label: "Reputation", value: rep, onChange: setRep, placeholder: "0x..." },
            { label: "Achievements", value: ach, onChange: setAch, placeholder: "0x..." },
          ].map(({ label, value, onChange, placeholder }) => (
            <div key={label}>
              <label className="mb-1 block text-xs text-muted-foreground">{label}</label>
              <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-1.5 font-mono text-xs outline-none focus:border-primary"
              />
            </div>
          ))}
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Save & Switch
          </button>
          <button
            onClick={handleReset}
            className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            title="Reset ke nilai dari .env.local"
          >
            Reset
          </button>
          <button
            onClick={onCancel}
            className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

export function NetworkSwitcher() {
  const [current, setCurrent] = useState<NetworkKey>("testnet");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setCurrent(getSelectedNetwork());
  }, []);

  function handleSwitch(key: NetworkKey) {
    if (key === "testnet") {
      if (key === current) return;
      setSelectedNetwork("testnet");
      return;
    }
    // switching to local — always show config modal
    setShowModal(true);
  }

  function handleSaveLocal(config: LocalConfig) {
    saveLocalConfig(config);
    setShowModal(false);
    setSelectedNetwork("local");
  }

  return (
    <>
      <div className="flex items-center gap-1 rounded-full border border-border bg-secondary/50 p-1 text-xs">
        <button
          onClick={() => handleSwitch("local")}
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 transition-colors ${
            current === "local"
              ? "bg-primary text-primary-foreground font-medium"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Local
          {current === "local" && (
            <span
              onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
              className="ml-0.5 opacity-60 hover:opacity-100 cursor-pointer"
              title="Edit config"
            >
              ⚙
            </span>
          )}
        </button>
        <button
          onClick={() => handleSwitch("testnet")}
          className={`rounded-full px-2.5 py-1 transition-colors ${
            current === "testnet"
              ? "bg-primary text-primary-foreground font-medium"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Testnet
        </button>
      </div>

      {showModal && (
        <LocalConfigModal
          onSave={handleSaveLocal}
          onCancel={() => setShowModal(false)}
        />
      )}
    </>
  );
}
