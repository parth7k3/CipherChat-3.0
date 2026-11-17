import React from 'react';
import {
  ShieldCheck,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { VerificationService } from '../../services/matrix/verificationService';
import type { VerificationRequestState } from '../../types';

interface VerificationModalProps {
  state: VerificationRequestState | null;
  onClose: () => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({ state, onClose }) => {
  if (!state) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-lg bg-cipher-900 border border-cipher-800 rounded-2xl shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-cipher-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Cryptographic Device Verification</h3>
          </div>
          <button
            onClick={() => {
              VerificationService.cancel();
              onClose();
            }}
            className="p-1 text-cipher-400 hover:text-white rounded-lg hover:bg-cipher-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Peer & Session info */}
        <div className="my-4 p-3 bg-cipher-950 rounded-xl border border-cipher-800 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-cipher-400">Target User:</span>
            <span className="font-mono text-white font-medium">{state.otherUserId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-cipher-400">Target Device ID:</span>
            <span className="font-mono text-emerald-400 font-medium">{state.otherDeviceId}</span>
          </div>
        </div>

        {/* Phase Body */}
        {state.phase === 'requested' && (
          <div className="py-6 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
            <p className="text-sm font-semibold text-white">Verification Requested</p>
            <p className="text-xs text-cipher-400 max-w-xs mx-auto">
              Waiting for the other device to accept the verification request...
            </p>
          </div>
        )}

        {state.phase === 'ready' && (
          <div className="py-4 text-center space-y-4">
            <p className="text-xs text-cipher-300">
              Both devices are ready. Click below to begin interactive Short Authentication String (SAS) comparison.
            </p>
            <button
              onClick={() => VerificationService.startSAS()}
              className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs transition-colors shadow-lg shadow-emerald-950/40"
            >
              Start SAS Verification
            </button>
          </div>
        )}

        {state.phase === 'sas_shown' && state.sas && (
          <div className="py-4 space-y-4">
            <p className="text-xs text-cipher-300 text-center font-medium">
              Compare the emojis and numbers below with the target device. They must match exactly to prevent Man-in-the-Middle attacks.
            </p>

            {/* Emoji Grid */}
            {state.sas.emoji && (
              <div className="grid grid-cols-4 gap-2.5 p-3 bg-cipher-950 rounded-xl border border-cipher-800">
                {state.sas.emoji.map(([symbol, name], idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-cipher-900 border border-cipher-800 rounded-lg text-center flex flex-col items-center justify-center"
                  >
                    <span className="text-2xl mb-1">{symbol}</span>
                    <span className="text-[10px] text-cipher-300 font-medium capitalize truncate w-full">
                      {name}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Decimal Numbers */}
            {state.sas.decimal && (
              <div className="p-3 bg-cipher-950 rounded-xl border border-cipher-800 text-center">
                <span className="text-[10px] text-cipher-400 uppercase tracking-widest block mb-1">
                  Decimal Code
                </span>
                <span className="font-mono text-lg font-bold text-emerald-400 tracking-widest">
                  {state.sas.decimal.join(' - ')}
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => VerificationService.reportSASMismatch()}
                className="flex-1 py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>They Do Not Match</span>
              </button>
              <button
                onClick={() => VerificationService.confirmSASMatch()}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/40"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>They Match</span>
              </button>
            </div>
          </div>
        )}

        {state.phase === 'done' && (
          <div className="py-6 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <p className="text-base font-bold text-white">Verification Complete</p>
            <p className="text-xs text-cipher-400 max-w-xs mx-auto">
              This device has been cryptographically verified and signed by your cross-signing identity.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 bg-cipher-800 hover:bg-cipher-700 text-white font-medium rounded-lg text-xs transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
