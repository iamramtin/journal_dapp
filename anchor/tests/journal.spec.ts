import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { Journal } from "../target/types/journal";

describe("journal", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Journal as Program<Journal>;
  const owner = provider.wallet as anchor.Wallet;

  console.log(`Program ID: ${program.programId.toString()}`);
  console.log(`Owner public key: ${owner.publicKey.toString()}`);

  // Test data
  const journalTitle = "My Journal";
  const entryContent = "This is a journal entry!";
  const updatedContent = "This is an updated journal entry.";

  // PDAs and accounts
  let journalPda: PublicKey;
  let entryPda: PublicKey;

  function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Find PDA for journal
  beforeAll(async () => {
    console.log("Setting up test environment...");

    const initialBalance = await getBalanceInSol(provider, owner.publicKey);
    console.log(`Initial balance: ${initialBalance} SOL`);

    await requestAirdrop(provider, owner.publicKey, 1);
    const finalBalance = await getBalanceInSol(provider, owner.publicKey);
    console.log(`Final balance: ${finalBalance} SOL`);

    expect(finalBalance).toBeGreaterThan(initialBalance);
    console.log("✅ Balance verification successful!");

    [journalPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("journal"),
        owner.publicKey.toBuffer(),
        Buffer.from(journalTitle),
      ],
      program.programId
    );

    console.log("Journal PDA:", journalPda.toBase58());
  });

  it("Creates a new journal", async () => {
    console.log("Running journal creation test...");

    try {
      const tx = await program.methods
        .createJournal(journalTitle)
        .accounts({
          owner: owner.publicKey,
        })
        .rpc();

      console.log("Transaction signature:", tx);

      // Add a small delay to ensure transaction is processed
      await delay(1000);

      // Fetch the journal account
      const journalAccount = await program.account.journal.fetch(journalPda);

      // Verify the journal properties
      expect(journalAccount.owner.toString()).toEqual(
        owner.publicKey.toString()
      );
      expect(journalAccount.title).toEqual(journalTitle);
      expect(journalAccount.entryCount).toEqual(0);

      console.log("✅ Journal created successfully!");
    } catch (error) {
      console.error("❌ Error creating journal:", error);
      throw error;
    }
  });

  it("Creates a new journal entry", async () => {
    console.log("Running journal entry creation test...");

    try {
      // Fetch the journal to get the current entry count
      const journalAccount = await program.account.journal.fetch(journalPda);
      const entryId = journalAccount.entryCount;

      // Find PDA for the entry
      [entryPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("entry"),
          journalPda.toBuffer(),
          new Uint8Array([entryId]),
        ],
        program.programId
      );

      console.log("Entry PDA:", entryPda.toBase58());

      // Create the entry
      const tx = await program.methods
        .createJournalEntry(entryContent)
        .accounts({
          owner: owner.publicKey,
          journal: journalPda,
          entry: entryPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("Transaction signature:", tx);

      // Add a small delay to ensure transaction is processed
      await delay(1000);

      // Fetch the updated journal account
      const updatedJournalAccount = await program.account.journal.fetch(
        journalPda
      );

      // Fetch the entry account
      const entryAccount = await program.account.journalEntry.fetch(entryPda);

      // Verify the entry properties
      expect(entryAccount.id).toEqual(entryId);
      expect(entryAccount.content).toEqual(entryContent);
      expect(entryAccount.journal.toString()).toEqual(journalPda.toString());

      // Verify the journal entry count was incremented
      expect(updatedJournalAccount.entryCount).toEqual(entryId + 1);

      console.log("✅ Journal entry created successfully!");
    } catch (error) {
      console.error("❌ Error creating journal entry:", error);
      throw error;
    }
  });

  it("Updates a journal entry", async () => {
    console.log("Running journal entry update test...");

    try {
      // Update the entry
      const tx = await program.methods
        .updateJournalEntry(updatedContent)
        .accounts({
          owner: owner.publicKey,
          journal: journalPda,
          entry: entryPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("Transaction signature:", tx);

      // Add a small delay to ensure transaction is processed
      await delay(1000);

      // Fetch the updated entry account
      const entryAccount = await program.account.journalEntry.fetch(entryPda);

      // Verify the updated entry properties
      expect(entryAccount.content).toEqual(updatedContent);

      console.log("✅ Journal entry updated successfully!");
    } catch (error) {
      console.error("❌ Error updating journal entry:", error);
      throw error;
    }
  });

  it("Deletes a journal entry", async () => {
    console.log("Running journal entry deletion test...");

    try {
      // Delete the entry
      const tx = await program.methods
        .deleteJournalEntry()
        .accounts({
          owner: owner.publicKey,
          journal: journalPda,
          entry: entryPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("Transaction signature:", tx);

      // Add a small delay to ensure transaction is processed
      await delay(1000);

      // Attempt to fetch the entry account to confirm deletion
      try {
        await program.account.journalEntry.fetch(entryPda);
        throw new Error("Entry account still exists when it should be deleted");
      } catch (fetchError: any) {
        if (fetchError.message.includes("Account does not exist")) {
          console.log("Entry account successfully deleted");
        } else {
          throw fetchError;
        }
      }

      console.log("✅ Journal entry deleted successfully!");
    } catch (error) {
      console.error("❌ Error deleting journal entry:", error);
      throw error;
    }
  });

  it("Deletes a journal", async () => {
    console.log("Running journal deletion test...");

    try {
      const tx = await program.methods
        .deleteJournal()
        .accounts({
          owner: owner.publicKey,
          journal: journalPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("Transaction signature:", tx);

      // Add a small delay to ensure transaction is processed
      await delay(1000);

      // Attempt to fetch the journal account to confirm deletion
      try {
        await program.account.journal.fetch(journalPda);
        throw new Error(
          "Journal account still exists when it should be deleted"
        );
      } catch (fetchError: any) {
        if (fetchError.message.includes("Account does not exist")) {
          console.log("Journal account successfully deleted");
        } else {
          throw fetchError;
        }
      }

      console.log("✅ Journal deleted successfully!");
    } catch (error) {
      console.error("❌ Error deleting journal:", error);
      throw error;
    }
  });
});

async function requestAirdrop(
  provider: anchor.AnchorProvider,
  publicKey: PublicKey,
  amountInSol: number
) {
  console.log(
    `Requesting airdrop of ${amountInSol} SOL to ${publicKey.toBase58()}...`
  );
  const airdropSignature = await provider.connection.requestAirdrop(
    publicKey,
    amountInSol * anchor.web3.LAMPORTS_PER_SOL
  );
  console.log(`Airdrop transaction signature: ${airdropSignature}`);
  await provider.connection.confirmTransaction(airdropSignature);
  console.log("Airdrop confirmed.");
}

async function getBalanceInSol(
  provider: anchor.AnchorProvider,
  publicKey: PublicKey
) {
  return (
    (await provider.connection.getBalance(publicKey)) /
    anchor.web3.LAMPORTS_PER_SOL
  );
}
