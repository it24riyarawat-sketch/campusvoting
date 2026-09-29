
'use client';

import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain,
} from 'wagmi';

import { monadTestnet } from '../lib/config';
import { useState, useEffect } from 'react';
import CampusVotingArtifact from '../CampusVoting.json';

// Deployed smart contract address
const CONTRACT_ADDRESS = (
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  '0xEb720Feabf4658f6521C9a5c659118cA34D62743'
) as `0x${string}`;

const CONTRACT_ABI = CampusVotingArtifact.abi;

export default function Home() {
  const {
    address,
    isConnected,
    chainId,
  } = useAccount();

  const {
    connectors,
    connect,
    error,
    isError,
  } = useConnect();

  const {
    switchChainAsync,
  } = useSwitchChain();

  const { disconnect } = useDisconnect();

  const {
    data: hash,
    writeContractAsync,
    isPending,
    error: txError,
    isError: isTxError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({
    hash,
    chainId: monadTestnet.id,
  });

  const [mounted, setMounted] = useState(false);
  const [showContract, setShowContract] = useState(false);
  const [proposalName, setProposalName] = useState('');
  const [appError, setAppError] = useState('');

  // Prevent hydration mismatch in Next.js
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch proposals from the configured smart contract
  const {
    data: proposals,
    refetch: refetchProposals,
    isLoading: isLoadingProposals,
    error: readError,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getAllProposals',
    chainId: monadTestnet.id,
    query: {
      enabled: !!isConnected && chainId === monadTestnet.id,
    },
  });

  // Refresh proposals after transaction confirmation
  useEffect(() => {
    if (isConfirmed) {
      refetchProposals();
      setProposalName('');
      setAppError('');
    }
  }, [isConfirmed, refetchProposals]);

  // Switch to Monad Testnet if needed
  const ensureCorrectNetwork = async () => {
    if (chainId !== monadTestnet.id) {
      await switchChainAsync({
        chainId: monadTestnet.id,
      });
    }
  };

  // Connect MetaMask
  const handleConnect = async () => {
    const ethereum = (window as Window & { ethereum?: unknown })?.ethereum;

    if (
      typeof window !== 'undefined' &&
      !ethereum
    ) {
      alert(
        'MetaMask was not detected. Please enable the MetaMask extension and refresh.'
      );
      return;
    }

    const targetConnector = connectors[0];

    if (targetConnector) {
      try {
        setAppError('');

        connect({
          connector: targetConnector,
        });
      } catch (err) {
        console.error('Wallet connection failed:', err);

        setAppError(
          err instanceof Error
            ? err.message
            : 'Wallet connection failed.'
        );
      }
    }
  };

  // Vote on a proposal
  const handleVote = async (proposalId: number) => {
    try {
      setAppError('');

      await ensureCorrectNetwork();

      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'vote',
        args: [BigInt(proposalId)],
        chainId: monadTestnet.id,
      });
    } catch (err) {
      console.error('Voting failed:', err);

      setAppError(
        err instanceof Error
          ? err.message
          : 'Voting failed. Please check MetaMask and the local blockchain.'
      );
    }
  };

  // Add a new proposal
  const handleAddProposal = async () => {
    if (!proposalName.trim()) {
      setAppError('Please enter a proposal name.');
      return;
    }

    try {
      setAppError('');

      // Ensure MetaMask is on Hardhat Localhost
      await ensureCorrectNetwork();

      // Submit the proposal transaction
      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'addProposal',
        args: [proposalName.trim()],
        chainId: monadTestnet.id,
      });
    } catch (err) {
      console.error('Failed to create proposal:', err);

      setAppError(
        err instanceof Error
          ? err.message
          : 'Failed to create proposal. Check your wallet and network.'
      );
    }
  };

  // Avoid rendering before client-side hydration
  if (!mounted) {
    return null;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-24 bg-gray-900 text-white">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm flex flex-col gap-8">

        {/* Page heading */}
        <h1 className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 text-center">
          Campus Voting dApp
        </h1>

        <div className="flex flex-col items-center gap-4 bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-700 w-full max-w-md">

          {!isConnected ? (
            <div className="flex flex-col gap-2 w-full">

              {/* Connect wallet */}
              <button
                onClick={handleConnect}
                className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-lg hover:shadow-blue-500/25 w-full flex items-center justify-center gap-2"
              >
                Connect MetaMask
              </button>

              {isError && (
                <div className="text-red-400 text-xs text-center mt-2 bg-red-400/10 p-2 rounded border border-red-400/20">
                  {error?.message}
                </div>
              )}

            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 w-full">

              {/* Connection status */}
              <div className="flex items-center gap-2 text-emerald-400 font-semibold bg-emerald-400/10 px-4 py-2 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Connection successful
              </div>

              {/* Wallet address */}
              <div className="w-full bg-gray-900/50 p-4 rounded-xl border border-gray-700/50 break-all">
                <p className="text-gray-400 text-xs mb-1">
                  Active Wallet Address
                </p>

                <p className="font-mono text-sm text-emerald-300 font-semibold">
                  {address}
                </p>

                <p className="text-[10px] text-gray-500 mt-1">
                  To change address, switch accounts inside the MetaMask extension.
                </p>
              </div>

              {/* Network status */}
              <div className="w-full bg-gray-900/50 p-4 rounded-xl border border-gray-700/50">
                <p className="text-gray-400 text-xs mb-2">
                  Active Network
                </p>

                {chainId === monadTestnet.id ? (
                  <p className="text-emerald-400 text-sm font-semibold">
                    Monad Testnet (10143)
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    <p className="text-red-400 text-xs">
                      Wrong network. Switch to Monad Testnet to use the voting contract.
                    </p>

                    <button
                      onClick={async () => {
                        try {
                          setAppError('');
                          await ensureCorrectNetwork();
                        } catch (err) {
                          setAppError(
                            err instanceof Error
                              ? err.message
                              : 'Failed to switch network.'
                          );
                        }
                      }}
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs"
                    >
                      Switch to Monad Testnet
                    </button>
                  </div>
                )}
              </div>

              {/* Active Proposals */}
              <div className="w-full bg-gray-900/50 p-4 rounded-xl border border-gray-700/50">
                <p className="text-gray-400 text-xs mb-3 font-semibold">
                  Active Proposals
                </p>

                {chainId !== monadTestnet.id ? (
                  <p className="font-mono text-xs text-yellow-400">
                    Please switch to Monad Testnet to view proposals.
                  </p>
                ) : isLoadingProposals ? (
                  <p className="font-mono text-sm text-gray-400">
                    Loading proposals...
                  </p>
                ) : readError ? (
                  <p className="font-mono text-xs text-red-400 break-words">
                    Failed to load proposals: {readError.message}
                  </p>
                ) : Array.isArray(proposals) &&
                  proposals.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {proposals.map((item: any, index: number) => {
                      const id =
                        item.id !== undefined
                          ? Number(item.id)
                          : index;

                      const name =
                        item.name ||
                        item[0] ||
                        `Proposal #${id}`;

                      const votes =
                        item.voteCount !== undefined
                          ? item.voteCount.toString()
                          : item[1]?.toString() || '0';

                      return (
                        <div
                          key={id.toString()}
                          className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-all"
                        >
                          <div>
                            <p className="font-bold text-white">
                              {name}
                            </p>

                            <p className="text-xs text-blue-400">
                              Votes: {votes}
                            </p>
                          </div>

                          <button
                            onClick={() => handleVote(id)}
                            disabled={
                              isPending || isConfirming
                            }
                            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-md"
                          >
                            {isPending
                              ? 'Confirming...'
                              : isConfirming
                              ? 'Voting...'
                              : 'Vote'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="font-mono text-xs text-gray-400">
                    No active proposals found on this contract. Create one below!
                  </p>
                )}
              </div>

              {/* Create New Proposal */}
              <div className="w-full bg-gray-900/50 p-4 rounded-xl border border-gray-700/50 flex flex-col gap-2">
                <p className="text-gray-400 text-xs font-semibold">
                  Create New Proposal
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={proposalName}
                    onChange={(e) =>
                      setProposalName(e.target.value)
                    }
                    placeholder="Enter proposal name..."
                    className="w-full px-3 py-1.5 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 text-white text-xs"
                  />

                  <button
                    onClick={handleAddProposal}
                    disabled={
                      isPending ||
                      isConfirming ||
                      !proposalName.trim() ||
                      chainId !== monadTestnet.id
                    }
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs transition-all whitespace-nowrap"
                  >
                    {isPending
                      ? 'Confirming...'
                      : isConfirming
                      ? 'Waiting...'
                      : 'Add'}
                  </button>
                </div>
              </div>

              {/* Transaction and application errors */}
              {(appError || isTxError) && (
                <div className="text-red-400 text-xs mt-2 bg-red-400/10 p-2 rounded border border-red-400/20 break-words w-full">
                  {appError || txError?.message}
                </div>
              )}

              {/* Transaction status */}
              {hash && (
                <div className="text-xs text-emerald-400 mt-1 text-center break-all w-full">
                  <p>
                    Transaction submitted:
                  </p>

                  <p className="mt-1 font-mono">
                    {hash}
                  </p>

                  {isConfirming && (
                    <p className="mt-2 text-yellow-400">
                      Waiting for blockchain confirmation...
                    </p>
                  )}

                  {isConfirmed && (
                    <p className="mt-2 text-emerald-400">
                      Transaction confirmed successfully!
                    </p>
                  )}
                </div>
              )}

              {/* Disconnect wallet */}
              <button
                onClick={() => disconnect()}
                className="mt-2 px-6 py-2 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold transition-all border border-red-500/20 w-full"
              >
                Disconnect
              </button>

            </div>
          )}

          {/* Show Contract Details */}
          <div className="w-full mt-4 flex flex-col items-center gap-4 border-t border-gray-700/50 pt-6">

            <button
              onClick={() =>
                setShowContract(!showContract)
              }
              className="px-6 py-2 rounded-full bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 font-semibold transition-all border border-emerald-500/30 text-xs"
            >
              {showContract
                ? 'Hide Contract'
                : 'Show Contract'}
            </button>

            {showContract && (
              <div className="w-full bg-gray-900/50 p-4 rounded-xl border border-gray-700/50 break-all text-center">
                <p className="text-gray-400 text-xs mb-1">
                  Deployed Smart Contract Address
                </p>

                <p className="font-mono text-xs text-emerald-300">
                  {CONTRACT_ADDRESS}
                </p>
              </div>
            )}

          </div>

        </div>
      </div>
    </main>
  );
}