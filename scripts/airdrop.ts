import * as anchor from "@coral-xyz/anchor";

process.env.ANCHOR_PROVIDER_URL =
  process.env.ANCHOR_PROVIDER_URL || "http://localhost:8899";
process.env.ANCHOR_WALLET =
  process.env.ANCHOR_WALLET || `${process.env.HOME}/.config/solana/id.json`;

(async () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const wallet = provider.wallet;
  const publicKey = wallet.publicKey;

  console.log(`Requesting airdrop for wallet: ${publicKey.toBase58()}`);

  try {
    const airdropSignature = await provider.connection.requestAirdrop(
      publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL // Request 2 SOL
    );

    console.log(`Airdrop transaction signature: ${airdropSignature}`);

    await provider.connection.confirmTransaction(airdropSignature);
    console.log("Airdrop successful!");
  } catch (error) {
    console.error("Error requesting airdrop:", error);
  }
})();
