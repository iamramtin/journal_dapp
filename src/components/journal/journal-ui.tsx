"use client";

import { PublicKey } from "@solana/web3.js";
import { ellipsify } from "../ui/ui-layout";
import { ExplorerLink } from "../cluster/cluster-ui";
import {
  useJournalProgram,
  useJournalAccount,
  useJournalEntry,
} from "./journal-data-access";
import { useWallet } from "@solana/wallet-adapter-react";
import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { createPortal } from "react-dom";

function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  confirmButtonClass = "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800",
  isLoading = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  confirmButtonClass?: string;
  isLoading?: boolean;
}) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  // Close dialog when escape key is pressed
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  // Focus the cancel button when the dialog opens
  useEffect(() => {
    if (isOpen && cancelButtonRef.current) {
      setTimeout(() => {
        cancelButtonRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Prevent scrolling when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Use createPortal to render dialog at the document body level
  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 backdrop-blur-md rounded-xl overflow-hidden shadow-2xl border border-white/10 w-full max-w-md transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
            <p className="text-indigo-300/70 text-sm mb-4">{message}</p>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                ref={cancelButtonRef}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-black/30 text-indigo-200 border border-white/10 hover:bg-black/40 transition-all duration-200"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className={`
                  px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${
                    !isLoading
                      ? confirmButtonClass
                      : "bg-indigo-800/40 text-indigo-300/50 cursor-not-allowed"
                  }
                `}
                onClick={onConfirm}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  confirmText
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function CreateEntryModal({ journalKey }: { journalKey: PublicKey }) {
  const { createEntryMutation } = useJournalAccount({ journalKey });
  const [content, setContent] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = () => {
    if (content.trim() !== "") {
      createEntryMutation.mutate(content, {
        onSuccess: () => {
          setContent("");
          setIsOpen(false);
        },
      });
    }
  };

  // Close modal when escape key is pressed
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleEsc);

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen]);

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <>
      <button
        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-indigo-600 to-blue-600 text-white border border-indigo-500/30 hover:from-indigo-700 hover:to-blue-700 transition-all duration-200"
        onClick={() => setIsOpen(true)}
      >
        Add Entry
      </button>

      {isOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
              onClick={() => setIsOpen(false)}
            ></div>

            <div className="flex min-h-full items-center justify-center p-4">
              <div
                className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 backdrop-blur-md rounded-xl overflow-hidden shadow-2xl border border-white/10 w-full max-w-md transform transition-all"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-1">
                    New Entry
                  </h3>
                  <p className="text-indigo-300/70 text-sm mb-4">
                    Capture your thoughts, ideas, and memories
                  </p>

                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-indigo-200 mb-1">
                        Content
                      </label>
                      <div className="relative">
                        <textarea
                          className="w-full bg-black/30 border border-indigo-500/30 rounded-lg p-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-indigo-300/50 transition-all duration-200 custom-scrollbar"
                          placeholder="Write your thoughts here..."
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          rows={6}
                          maxLength={280}
                          autoFocus
                        />
                        <div className="absolute right-3 bottom-3 text-xs text-indigo-300/60">
                          {content.length}/280
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-black/30 text-indigo-200 border border-white/10 hover:bg-black/40 transition-all duration-200"
                        onClick={() => {
                          setContent("");
                          setIsOpen(false);
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        className={`
                        px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200
                        ${
                          content.trim() !== "" &&
                          !createEntryMutation.isPending
                            ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-700 hover:to-blue-700"
                            : "bg-indigo-800/40 text-indigo-300/50 cursor-not-allowed"
                        }
                      `}
                        onClick={handleSubmit}
                        disabled={
                          createEntryMutation.isPending || content.trim() === ""
                        }
                      >
                        {createEntryMutation.isPending ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin"></div>
                            <span>Saving...</span>
                          </div>
                        ) : (
                          "Save Entry"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

export function JournalCreate() {
  const { createJournal } = useJournalProgram();
  const { publicKey } = useWallet();
  const [title, setTitle] = useState("");
  const [titleError, setTitleError] = useState("");

  const isFormValid = title.trim() !== "";

  const handleSubmit = () => {
    if (publicKey && isFormValid) {
      setTitleError("");
      createJournal.mutate(
        { title },
        {
          onError: (error: any) => {
            if (error.message?.includes("already exists")) {
              setTitleError(error.message);
            }
          },
        }
      );

      // Only clear input on success (will happen in onSuccess callback)
      if (!createJournal.isError) {
        setTitle("");
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isFormValid) {
      handleSubmit();
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setTitleError("");
  };

  if (!publicKey) {
    return (
      <div className="bg-gradient-to-r from-blue-800/10 to-indigo-800/10 backdrop-blur-sm rounded-xl p-8 text-center shadow-xl border border-white/10">
        <div className="flex flex-col items-center justify-center space-y-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-indigo-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
            />
          </svg>
          <h3 className="text-xl font-semibold text-white">
            Connect Your Wallet
          </h3>
          <p className="text-indigo-200 max-w-md">
            Please connect your wallet to create and manage your journals on the
            Solana blockchain.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 backdrop-blur-sm rounded-xl overflow-hidden shadow-xl border border-white/10 transition-all duration-300 hover:shadow-indigo-500/10 hover:border-indigo-500/20">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Create Journal</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Enter title..."
            value={title}
            onChange={handleTitleChange}
            onKeyDown={handleKeyPress}
            className="w-full mr-12 bg-black/20 border border-indigo-500/30 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-indigo-300/50 transition-all duration-200"
            maxLength={30}
          />
          <div className="absolute right-3 bottom-3 text-xs text-indigo-300/70">
            {title.length}/30
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            className={`
              px-6 py-2.5 rounded-lg font-medium transition-all duration-200
              ${
                isFormValid && !createJournal.isPending
                  ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-700 hover:to-blue-700"
                  : "bg-indigo-800/40 text-indigo-300/50 cursor-not-allowed"
              }
            `}
            onClick={handleSubmit}
            disabled={!isFormValid || createJournal.isPending}
          >
            {createJournal.isPending ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin"></div>
                <span>Creating...</span>
              </div>
            ) : (
              "Create Journal"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function JournalList() {
  const { journals, getProgramAccount } = useJournalProgram();
  const [isLoaded, setIsLoaded] = useState(false);

  // Add a slight delay for animation effects
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  if (getProgramAccount.isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!getProgramAccount.data?.value) {
    return (
      <div className="bg-gradient-to-r from-red-900/20 to-orange-900/20 backdrop-blur-sm rounded-xl p-8 shadow-xl border border-red-500/20 mt-8">
        <div className="flex items-center justify-center space-x-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <h3 className="font-semibold text-white text-lg">
              Program Not Found
            </h3>
            <p className="text-orange-200">
              Make sure you have deployed the program and are connected to the
              correct cluster.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`space-y-8 mt-10 transition-opacity duration-700 ${
        isLoaded ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Your Journals</h2>
        {(journals.data?.length ?? 0) > 0 && (
          <div className="text-indigo-300 text-sm">
            {journals?.data?.length}{" "}
            {journals?.data?.length === 1 ? "journal" : "journals"} found
          </div>
        )}
      </div>

      {journals.isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 backdrop-blur-sm rounded-xl h-48 animate-pulse"
            ></div>
          ))}
        </div>
      ) : journals.data?.length ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {journals.data?.map((journal, index) => (
            <div
              key={journal.publicKey.toString()}
              className={`transition-all duration-500 delay-${
                index * 100
              } transform ${
                isLoaded
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0"
              }`}
            >
              <JournalCard journalKey={journal.publicKey} />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gradient-to-r from-blue-900/10 to-indigo-900/10 backdrop-blur-sm rounded-xl p-10 text-center shadow-xl border border-white/5 transition-all duration-300">
          <div className="flex flex-col items-center justify-center space-y-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 text-indigo-400/60"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <h3 className="text-2xl font-semibold text-white">
              No Journals Yet
            </h3>
            <p className="text-indigo-200 max-w-md">
              Start your journaling journey by creating your first journal
              above.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function JournalCard({ journalKey }: { journalKey: PublicKey }) {
  const { journalQuery, deleteJournalMutation, entriesQuery } =
    useJournalAccount({
      journalKey,
    });
  const [showEntries, setShowEntries] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getGradient = (index: number = 0) => {
    const gradients = [
      "from-blue-900/30 to-indigo-900/30",
      "from-indigo-900/30 to-purple-900/30",
      "from-purple-900/30 to-pink-900/30",
      "from-blue-900/30 to-cyan-900/30",
      "from-emerald-900/30 to-teal-900/30",
    ];
    return gradients[index % gradients.length];
  };

  // Generate a consistent index based on journal title
  const getTitleIndex = (title: string): number => {
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = (hash << 5) - hash + title.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
  };

  const handleDeleteJournal = () => {
    deleteJournalMutation.mutate();
    setShowDeleteConfirm(false);
  };

  if (journalQuery.isLoading) {
    return (
      <div className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 backdrop-blur-sm rounded-xl h-48 animate-pulse"></div>
    );
  }

  if (!journalQuery.data) {
    return null;
  }

  const gradient = getGradient(getTitleIndex(journalQuery.data.title));

  return (
    <div
      className={`bg-gradient-to-r ${gradient} backdrop-blur-sm rounded-xl overflow-hidden shadow-xl border border-white/10 transition-all duration-300 ${
        isHovered ? "shadow-indigo-500/20 border-indigo-500/30 " : ""
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white line-clamp-1">
            {journalQuery.data.title}
          </h2>
          <div className="flex items-center justify-center h-6 min-w-6 bg-indigo-500/20 border border-indigo-500/30 rounded-full px-2">
            <span className="text-xs font-medium text-indigo-200">
              {journalQuery.data.entryCount}
            </span>
          </div>
        </div>

        <div className="mt-4 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent"></div>

        <div className="flex justify-between items-center mt-4">
          <button
            className={`
              px-3 py-1.5 my-2 mr-2 rounded-lg text-sm font-medium transition-all duration-200
              ${
                showEntries
                  ? "bg-indigo-500/20 text-indigo-200 border border-indigo-500/30"
                  : "bg-black/20 text-indigo-300/70 border border-white/5 hover:bg-indigo-500/10 hover:border-indigo-500/20"
              }
            `}
            onClick={() => setShowEntries(!showEntries)}
          >
            {showEntries ? "Hide Entries" : "Show Entries"}
          </button>

          <div className="flex gap-2">
            <CreateEntryModal journalKey={journalKey} />

            <button
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-black/20 text-red-300/70 border border-white/5 hover:bg-red-500/10 hover:border-red-500/20 transition-all duration-200"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleteJournalMutation.isPending}
            >
              {deleteJournalMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-red-300/70 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "Delete"
              )}
            </button>

            <ConfirmationModal
              isOpen={showDeleteConfirm}
              onClose={() => setShowDeleteConfirm(false)}
              onConfirm={handleDeleteJournal}
              title="Delete Journal"
              message={`Are you sure you want to delete "${journalQuery.data.title}"? This will permanently delete the journal and all its entries. This action cannot be undone.`}
              confirmText="Delete Journal"
              confirmButtonClass="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
              isLoading={deleteJournalMutation.isPending}
            />
          </div>
        </div>

        {showEntries && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-indigo-200 font-medium">Journal Entries</h3>
              <div className="text-xs text-indigo-300/70">
                {entriesQuery.data?.length || 0}{" "}
                {entriesQuery.data?.length === 1 ? "entry" : "entries"}
              </div>
            </div>

            {entriesQuery.isLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-indigo-500/50 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : entriesQuery.data?.length ? (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                {entriesQuery.data.map((entry, index) => (
                  <div
                    key={entry.publicKey.toString()}
                    className={`transition-all duration-300 delay-${
                      index * 50
                    } transform ${
                      showEntries
                        ? "translate-y-0 opacity-100"
                        : "translate-y-2 opacity-0"
                    }`}
                  >
                    <EntryCard
                      journalKey={journalKey}
                      entryKey={entry.publicKey}
                      entry={entry}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-black/20 rounded-lg border border-white/5 py-6 px-4 text-center">
                <p className="text-indigo-300/70 text-sm">
                  No entries yet. Add your first entry!
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 text-xs text-indigo-400/50 hover:text-indigo-400/70 transition-colors">
          <ExplorerLink
            path={`account/${journalKey}`}
            label={ellipsify(journalKey.toString())}
          />
        </div>
      </div>
    </div>
  );
}

function EntryCard({
  journalKey,
  entryKey,
  entry,
}: {
  journalKey: PublicKey;
  entryKey: PublicKey;
  entry: any;
}) {
  const { entryQuery, updateEntryMutation, deleteEntryMutation } =
    useJournalEntry({
      journalKey,
      entryKey,
    });

  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(entry.content);
  const [isHovered, setIsHovered] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleUpdate = () => {
    if (content.trim() !== "") {
      updateEntryMutation.mutate(content, {
        onSuccess: () => setIsEditing(false),
      });
    }
  };

  const handleDeleteEntry = () => {
    deleteEntryMutation.mutate();
    setShowDeleteConfirm(false);
  };

  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp * 1000), "MMM d, yyyy • h:mm a");
  };

  return (
    <div
      className={`bg-black/20 backdrop-blur-sm rounded-lg border border-white/5 overflow-hidden transition-all duration-200 ${
        isHovered ? "border-indigo-500/20" : ""
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-4">
        <div className="flex justify-between items-center mb-2">
          <div className="text-xs text-indigo-300/60 font-medium">
            {formatDate(entry.timestamp)}
          </div>

          {!isEditing && (
            <div
              className={`flex space-x-1 opacity-0 transition-opacity duration-200 ${
                isHovered ? "opacity-100" : ""
              }`}
            >
              <button
                className="text-xs text-indigo-300/70 hover:text-indigo-300 transition-colors"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </button>
              <span className="text-indigo-500/30">•</span>
              <button
                className="text-xs text-red-300/70 hover:text-red-300 transition-colors"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleteEntryMutation.isPending}
              >
                {deleteEntryMutation.isPending ? "Deleting..." : "Delete"}
              </button>

              <ConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDeleteEntry}
                title="Delete Entry"
                message="Are you sure you want to delete this journal entry? This action cannot be undone."
                confirmText="Delete Entry"
                confirmButtonClass="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                isLoading={deleteEntryMutation.isPending}
              />
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <textarea
              className="w-full bg-black/30 border border-indigo-500/30 rounded-lg p-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-indigo-300/50 transition-all duration-200 custom-scrollbar"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              maxLength={280}
            />
            <div className="flex justify-between items-center">
              <div className="text-xs text-indigo-300/60">
                {content.length}/280
              </div>
              <div className="flex space-x-2">
                <button
                  className="px-3 py-1.5 rounded text-xs font-medium bg-black/30 text-indigo-300/70 border border-white/5 hover:bg-black/40 transition-all duration-200"
                  onClick={() => {
                    setContent(entry.content);
                    setIsEditing(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="px-3 py-1.5 rounded text-xs font-medium bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 hover:bg-indigo-500/30 transition-all duration-200"
                  onClick={handleUpdate}
                  disabled={
                    updateEntryMutation.isPending || content.trim() === ""
                  }
                >
                  {updateEntryMutation.isPending ? (
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 border-2 border-indigo-300/70 border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving</span>
                    </div>
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-white text-sm whitespace-pre-wrap leading-relaxed">
            {entry.content}
          </p>
        )}
      </div>
    </div>
  );
}

// Add this style element to the end of the file or include it in your global CSS
const GlobalStyle = () => (
  <style jsx global>{`
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }

    .custom-scrollbar::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.1);
      border-radius: 10px;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(79, 70, 229, 0.3);
      border-radius: 10px;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(79, 70, 229, 0.5);
    }
  `}</style>
);

// Export the style component
export { GlobalStyle };
