import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  TransactionInstruction,
  VersionedTransaction,
} from '@solana/web3.js';
import { HELIUS_API_KEY } from '../constants';

// ── Well-known mainnet token mints ────────────────────────────────────────────

export const TOKEN_MINTS: Record<string, string> = {
  SOL:  'So11111111111111111111111111111111111111112', // wrapped SOL
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  JUP:  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  WIF:  'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
};

export function explorerUrl(sig: string, network: 'mainnet' | 'devnet'): string {
  const base = `https://solscan.io/tx/${sig}`;
  return network === 'devnet' ? `${base}?cluster=devnet` : base;
}

// ── Jupiter (mainnet only) ────────────────────────────────────────────────────

export async function getJupiterQuote(
  fromSymbol: string,
  toSymbol: string,
  amountLamports: number,
  slippageBps = 100,
): Promise<any> {
  const inputMint = TOKEN_MINTS[fromSymbol.toUpperCase()] ?? fromSymbol;
  const outputMint = TOKEN_MINTS[toSymbol.toUpperCase()] ?? toSymbol;
  const url =
    `https://quote-api.jup.ag/v6/quote` +
    `?inputMint=${inputMint}` +
    `&outputMint=${outputMint}` +
    `&amount=${Math.floor(amountLamports)}` +
    `&slippageBps=${slippageBps}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Jupiter quote failed (${res.status})`);
  return res.json();
}

export async function executeJupiterSwap(
  keypair: Keypair,
  quoteResponse: any,
): Promise<string> {
  const connection = new Connection(
    `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`,
    'confirmed',
  );

  const swapRes = await fetch('https://quote-api.jup.ag/v6/swap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quoteResponse,
      userPublicKey: keypair.publicKey.toBase58(),
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: 'auto',
    }),
  });
  if (!swapRes.ok) throw new Error(`Jupiter swap failed (${swapRes.status})`);

  const { swapTransaction } = await swapRes.json();
  const txBuf = Buffer.from(swapTransaction, 'base64');
  const tx = VersionedTransaction.deserialize(new Uint8Array(txBuf));
  tx.sign([keypair]);

  const sig = await connection.sendRawTransaction(tx.serialize(), {
    skipPreflight: false,
    maxRetries: 3,
  });
  await connection.confirmTransaction(sig, 'confirmed');
  return sig;
}

// ── Devnet memo transaction ───────────────────────────────────────────────────
// Jupiter doesn't support devnet. We record the AI decision as a Solana memo
// tx so the trade has a real on-chain signature verifiable on devnet explorer.

const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

export async function executeDevnetMemo(
  keypair: Keypair,
  memo: string,
): Promise<string> {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

  const tx = new Transaction().add(
    new TransactionInstruction({
      programId: MEMO_PROGRAM_ID,
      keys: [{ pubkey: keypair.publicKey, isSigner: true, isWritable: false }],
      data: Buffer.from(memo.slice(0, 566), 'utf-8'),
    }),
  );

  const { blockhash } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = keypair.publicKey;
  tx.sign(keypair);

  const sig = await connection.sendRawTransaction(tx.serialize());
  await connection.confirmTransaction(sig, 'confirmed');
  return sig;
}

// ── Convert SOL lamports for swap ─────────────────────────────────────────────

export function solToLamports(sol: number): number {
  return Math.floor(sol * LAMPORTS_PER_SOL);
}
