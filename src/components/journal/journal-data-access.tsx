"use client";

import { getJournalProgram, getJournalProgramId } from "@project/anchor";
import { useConnection } from "@solana/wallet-adapter-react";
import { Cluster, PublicKey, SystemProgram } from "@solana/web3.js";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import toast from "react-hot-toast";
import { useCluster } from "../cluster/cluster-data-access";
import { useAnchorProvider } from "../solana/solana-provider";
import { useTransactionToast } from "../ui/ui-layout";

export interface Journal {
  owner: PublicKey;
  title: string;
  entryCount: number;
}

export interface JournalEntry {
  journal: PublicKey;
  id: number;
  timestamp: number;
  content: string;
}

// PDAs helper functions
export const findJournalPDA = (
  owner: PublicKey,
  title: string,
  programId: PublicKey
) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("journal"), owner.toBuffer(), Buffer.from(title)],
    programId
  );
};

export const findEntryPDA = (
  journalKey: PublicKey,
  entryId: number,
  programId: PublicKey
) => {
  // Using a single byte array element like in the test file
  // This is suitable for small numbers (0-255)
  return PublicKey.findProgramAddressSync(
    [Buffer.from("entry"), journalKey.toBuffer(), new Uint8Array([entryId])],
    programId
  );
};

export function useJournalProgram() {
  const { connection } = useConnection();
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const provider = useAnchorProvider();
  const programId = useMemo(
    () => getJournalProgramId(cluster.network as Cluster),
    [cluster]
  );
  const program = useMemo(
    () => getJournalProgram(provider, programId),
    [provider, programId]
  );

  // Fetch all journals
  const journals = useQuery({
    queryKey: ["journal", "all", { cluster }],
    queryFn: () => program.account.journal.all(),
  });

  const getProgramAccount = useQuery({
    queryKey: ["get-program-account", { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  });

  // Create a new journal
  const createJournal = useMutation({
    mutationKey: ["journal", "create", { cluster }],
    mutationFn: async (params: { title: string }) => {
      const { title } = params;

      // Check if a journal with this title already exists
      const [journalPda] = findJournalPDA(provider.publicKey, title, programId);

      try {
        // Try to fetch the journal - if it exists, this won't throw an error
        await program.account.journal.fetch(journalPda);

        // If we reach here, the journal exists
        throw new Error(`A journal with the title "${title}" already exists`);
      } catch (error: any) {
        // If the error is "Account does not exist", that's what we want
        if (error.message?.includes("Account does not exist")) {
          // Create the journal
          return program.methods
            .createJournal(title)
            .accounts({
              owner: provider.publicKey,
            })
            .rpc();
        }

        // Re-throw any other errors, including our custom one
        throw error;
      }
    },
    onSuccess: (signature) => {
      transactionToast(signature);
      toast.success("Journal created successfully!");
      return journals.refetch();
    },
    onError: (error) => toast.error(`Failed to create journal: ${error}`),
  });

  // Delete a journal
  const deleteJournal = useMutation({
    mutationKey: ["journal", "delete", { cluster }],
    mutationFn: async (journalKey: PublicKey) => {
      return program.methods
        .deleteJournal()
        .accounts({
          owner: provider.publicKey,
          journal: journalKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    },
    onSuccess: (signature) => {
      transactionToast(signature);
      toast.success("Journal deleted successfully!");
      return journals.refetch();
    },
    onError: (error) => toast.error(`Failed to delete journal: ${error}`),
  });

  return {
    program,
    programId,
    journals,
    getProgramAccount,
    createJournal,
    deleteJournal,
  };
}

export function useJournalAccount({ journalKey }: { journalKey: PublicKey }) {
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const provider = useAnchorProvider();
  const { program, programId, journals } = useJournalProgram();

  // Fetch a specific journal
  const journalQuery = useQuery({
    queryKey: ["journal", "fetch", { cluster, journalKey }],
    queryFn: () => program.account.journal.fetch(journalKey),
  });

  // Delete a journal
  const deleteJournalMutation = useMutation({
    mutationKey: ["journal", "delete", { cluster, journalKey }],
    mutationFn: () => {
      return program.methods
        .deleteJournal()
        .accounts({
          owner: provider.publicKey,
          journal: journalKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    },
    onSuccess: (tx) => {
      transactionToast(tx);
      toast.success("Journal deleted successfully!");
      return journals.refetch();
    },
    onError: (error) => toast.error(`Failed to delete journal: ${error}`),
  });

  // Fetch all entries for a journal
  const entriesQuery = useQuery({
    queryKey: ["journal-entries", { cluster, journalKey }],
    queryFn: async () => {
      const journal = await program.account.journal.fetch(journalKey);
      const entries: Array<JournalEntry & { publicKey: PublicKey }> = [];

      // Fetch all entries based on their IDs (0 to entryCount-1)
      for (let i = 0; i < journal.entryCount; i++) {
        try {
          const [entryPda] = findEntryPDA(journalKey, i, programId);
          const entryAccount = await program.account.journalEntry.fetch(
            entryPda
          );

          entries.push({
            publicKey: entryPda,
            journal: entryAccount.journal,
            id: entryAccount.id,
            timestamp: entryAccount.timestamp.toNumber(),
            content: entryAccount.content,
          });
        } catch (error) {
          // If the entry was deleted, we skip it
          console.log(`Entry ${i} might have been deleted: ${error}`);
        }
      }

      return entries;
    },
    enabled: !!journalQuery.data,
  });

  // Create a journal entry
  const createEntryMutation = useMutation({
    mutationKey: ["journal-entry", "create", { cluster, journalKey }],
    mutationFn: async (content: string) => {
      // First, fetch the journal to get the current entry count
      const journalAccount = await program.account.journal.fetch(journalKey);
      const entryId = journalAccount.entryCount;

      // Calculate the PDA for the new entry
      const [entryPda] = findEntryPDA(journalKey, entryId, programId);

      // Create the entry using program methods
      return program.methods
        .createJournalEntry(content)
        .accounts({
          owner: provider.publicKey,
          journal: journalKey,
          entry: entryPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    },
    onSuccess: (tx) => {
      transactionToast(tx);
      toast.success("Journal entry created successfully!");
      return Promise.all([journalQuery.refetch(), entriesQuery.refetch()]);
    },
    onError: (error) => toast.error(`Failed to create journal entry: ${error}`),
  });

  return {
    journalQuery,
    deleteJournalMutation,
    entriesQuery,
    createEntryMutation,
  };
}

export function useJournalEntry({
  journalKey,
  entryKey,
}: {
  journalKey: PublicKey;
  entryKey: PublicKey;
}) {
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const provider = useAnchorProvider();
  const { program } = useJournalProgram();

  // Fetch a specific entry
  const entryQuery = useQuery({
    queryKey: ["journal-entry", "fetch", { cluster, entryKey }],
    queryFn: () => program.account.journalEntry.fetch(entryKey),
  });

  // Update an entry
  const updateEntryMutation = useMutation({
    mutationKey: ["journal-entry", "update", { cluster, entryKey }],
    mutationFn: (content: string) => {
      return program.methods
        .updateJournalEntry(content)
        .accounts({
          owner: provider.publicKey,
          journal: journalKey,
          entry: entryKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    },
    onSuccess: (tx) => {
      transactionToast(tx);
      toast.success("Journal entry updated successfully!");
      return entryQuery.refetch();
    },
    onError: (error) => toast.error(`Failed to update journal entry: ${error}`),
  });

  // Delete an entry
  const deleteEntryMutation = useMutation({
    mutationKey: ["journal-entry", "delete", { cluster, entryKey }],
    mutationFn: () => {
      return program.methods
        .deleteJournalEntry()
        .accounts({
          owner: provider.publicKey,
          journal: journalKey,
          entry: entryKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    },
    onSuccess: (tx) => {
      transactionToast(tx);
      toast.success("Journal entry deleted successfully!");
      return entryQuery.refetch();
    },
    onError: (error) => toast.error(`Failed to delete journal entry: ${error}`),
  });

  return {
    entryQuery,
    updateEntryMutation,
    deleteEntryMutation,
  };
}
