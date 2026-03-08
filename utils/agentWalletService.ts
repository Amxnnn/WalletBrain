import * as SecureStore from 'expo-secure-store';
import { Keypair, Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { HELIUS_API_KEY } from '../constants';

const AGENT_SECRET_KEY = 'walletbrain_agent_sk';

// ── Key management ────────────────────────────────────────────────────────────

export async function generateAgentWallet(): Promise<string> {
  const keypair = Keypair.generate();
  const hex = Buffer.from(keypair.secretKey).toString('hex');
  await SecureStore.setItemAsync(AGENT_SECRET_KEY, hex);
  return keypair.publicKey.toBase58();
}

export async function loadAgentKeypair(): Promise<Keypair | null> {
  try {
    const hex = await SecureStore.getItemAsync(AGENT_SECRET_KEY);
    if (!hex) return null;
    return Keypair.fromSecretKey(Uint8Array.from(Buffer.from(hex, 'hex')));
  } catch {
    return null;
  }
}

export async function deleteAgentWallet(): Promise<void> {
  await SecureStore.deleteItemAsync(AGENT_SECRET_KEY);
}

// ── On-chain balance ──────────────────────────────────────────────────────────

export async function getOnChainBalance(
  pubkey: string,
  network: 'mainnet' | 'devnet',
): Promise<number> {
  const rpc =
    network === 'mainnet'
      ? `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
      : 'https://api.devnet.solana.com';
  try {
    const res = await fetch(rpc, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getBalance',
        params: [pubkey],
      }),
    });
    const json = await res.json();
    return (json?.result?.value ?? 0) / LAMPORTS_PER_SOL;
  } catch {
    return 0;
  }
}

// ── Devnet airdrop ────────────────────────────────────────────────────────────

export async function requestDevnetAirdrop(pubkey: string): Promise<string> {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const sig = await connection.requestAirdrop(
    new PublicKey(pubkey),
    1 * LAMPORTS_PER_SOL,
  );
  await connection.confirmTransaction(sig, 'confirmed');
  return sig;
}
