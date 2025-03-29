"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletButton } from "../solana/solana-provider";
import { ellipsify } from "../ui/ui-layout";
import { ExplorerLink } from "../cluster/cluster-ui";
import { useJournalProgram } from "./journal-data-access";
import { JournalCreate, JournalList, GlobalStyle } from "./journal-ui";
import { useState, useEffect } from "react";

export default function JournalFeature() {
  const { publicKey } = useWallet();
  const { programId } = useJournalProgram();
  const [isLoaded, setIsLoaded] = useState(false);

  // Add animation effect when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  if (!publicKey) {
    return (
      <div>
        <div
          className={`max-w-6xl mx-auto transition-all duration-1000 transform ${
            isLoaded ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="text-center mb-20">
            <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-500 mb-6">
              Decentralized Journaling
            </h1>
            <p className="text-xl text-indigo-200 max-w-3xl mx-auto mb-12">
              Store your thoughts securely on the Solana blockchain. Create
              private journals, add entries, and manage your personal records
              with complete ownership.
            </p>

            <div className="bg-gradient-to-r from-indigo-900/30 to-blue-900/30 p-12 rounded-2xl backdrop-blur-sm border border-indigo-500/20 shadow-xl inline-block">
              <div className="flex flex-col items-center space-y-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-20 w-20 text-indigo-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
                  />
                </svg>
                <h2 className="text-2xl font-bold text-white mb-4">
                  Connect Your Wallet
                </h2>
                <p className="text-indigo-200 mb-8">
                  Connect your Solana wallet to start creating and managing your
                  journals.
                </p>
                <WalletButton className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-lg font-medium rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-indigo-500/20" />
              </div>
            </div>
          </div>

          <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-10">
            <FeatureCard
              icon={
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
                    strokeWidth="1.5"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              }
              title="Private & Secure"
              description="Your journals are encrypted and securely stored on the Solana blockchain, giving you complete control over your data."
            />
            <FeatureCard
              icon={
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
                    strokeWidth="1.5"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              }
              title="Decentralized"
              description="No central authority controls your content. Your journals exist on the blockchain, free from censorship and third-party control."
            />
            <FeatureCard
              icon={
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
                    strokeWidth="1.5"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              }
              title="Always Available"
              description="Access your journals from anywhere at any time. Your content is always available as long as you have your wallet."
            />
          </div>
        </div>
        <GlobalStyle />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black py-16 px-4 sm:px-6 lg:px-8">
      <div
        className={`max-w-6xl mx-auto transition-all duration-1000 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-500 mb-4">
            Journals
          </h1>

          <div className="flex items-center justify-center mt-4 text-sm text-indigo-300/70 space-x-2">
            <span>Program ID:</span>
            <ExplorerLink
              path={`account/${programId}`}
              label={ellipsify(programId.toString())}
              className="hover:text-indigo-300 transition-colors"
            />
            <span className="text-indigo-400/40">|</span>
            <span>Connected as:</span>
            <ExplorerLink
              path={`account/${publicKey}`}
              label={ellipsify(publicKey.toString())}
              className="hover:text-indigo-300 transition-colors"
            />
          </div>
        </div>

        <JournalCreate />
        <JournalList />
        <GlobalStyle />
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-gradient-to-r from-indigo-900/20 to-blue-900/20 rounded-xl p-8 backdrop-blur-sm border border-indigo-500/10 transition-all duration-300 hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4">{icon}</div>
        <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
        <p className="text-indigo-200/70">{description}</p>
      </div>
    </div>
  );
}
