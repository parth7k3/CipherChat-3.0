import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Laptop,
  Trash2,
  CheckCircle,
  Key,
  ArrowLeft,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { matrixClientManager } from '../../services/matrix/matrixClient';
import { CryptoService } from '../../services/matrix/cryptoService';
import { VerificationService } from '../../services/matrix/verificationService';
import { TrustBadge } from '../common/TrustBadge';
import type { UserDevice } from '../../types';

interface SecurityDashboardProps {
  onBack: () => void;
  currentUserId: string;
}

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({ onBack, currentUserId }) => {
  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadDevices = async () => {
    setIsLoading(true);
    try {
      const devList = await matrixClientManager.getUserDevices();
      setDevices(devList);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const handleRevoke = async (deviceId: string) => {
    if (!confirm(`Are you sure you want to revoke device ${deviceId}? It will no longer have access to this account.`)) {
      return;
    }

    try {
      await matrixClientManager.revokeDevice(deviceId);
      setStatusMessage(`Device ${deviceId} revoked successfully.`);
      await loadDevices();
    } catch (err: any) {
      alert(`Failed to revoke device: ${err.message}`);
    }
  };

  const handleVerify = async (deviceId: string) => {
    try {
      await VerificationService.requestVerification(currentUserId, deviceId);
      setStatusMessage(`Verification request sent to device ${deviceId}.`);
    } catch (err: any) {
      alert(`Verification request failed: ${err.message}`);
    }
  };

  const handleBootstrapCrossSigning = async () => {
    setIsBootstrapping(true);
    try {
      await CryptoService.bootstrapCrossSigning();
      setStatusMessage('Cross-Signing keys generated and published successfully.');
      await loadDevices();
    } catch (err: any) {
      alert(`Cross-signing bootstrap failed: ${err.message}`);
    } finally {
      setIsBootstrapping(false);
    }
  };

  return (
    <div className="flex-1 h-screen bg-cipher-950 overflow-y-auto p-8 select-none">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between pb-6 border-b border-cipher-800">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 text-cipher-400 hover:text-white bg-cipher-900 border border-cipher-800 rounded-lg transition-colors"
              title="Return to Chat"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <span>Security & Device Trust Management</span>
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </h1>
              <p className="text-xs text-cipher-400">
                Manage your active cryptographic sessions, verify trusted devices, and configure cross-signing.
              </p>
            </div>
          </div>

          <button
            onClick={loadDevices}
            className="p-2 text-cipher-400 hover:text-white bg-cipher-900 border border-cipher-800 rounded-lg transition-colors"
            title="Refresh Devices"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {statusMessage && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>{statusMessage}</span>
            </span>
            <button onClick={() => setStatusMessage(null)} className="text-emerald-500 hover:text-emerald-300">
              Dismiss
            </button>
          </div>
        )}

        {/* Cross-Signing Identity Card */}
        <div className="p-6 bg-cipher-900 border border-cipher-800 rounded-2xl shadow-xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-cipher-800 rounded-xl text-emerald-400 border border-cipher-700">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Cryptographic Cross-Signing</h3>
                <p className="text-xs text-cipher-400 max-w-lg mt-0.5">
                  Cross-signing establishes a master cryptographic identity (Ed25519) that signs your authorized devices, allowing contacts to verify you once and trust all your approved devices automatically.
                </p>
              </div>
            </div>

            <button
              onClick={handleBootstrapCrossSigning}
              disabled={isBootstrapping}
              className="py-2 px-4 bg-cipher-800 hover:bg-cipher-700 text-emerald-400 border border-emerald-500/30 text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors"
            >
              {isBootstrapping ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Bootstrapping...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Bootstrap Cross-Signing</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Registered Devices List */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider text-cipher-300">
            Registered Sessions & Devices ({devices.length})
          </h2>

          <div className="space-y-3">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-cipher-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Loading device signatures and trust statuses...</span>
              </div>
            ) : devices.length === 0 ? (
              <div className="p-8 text-center text-xs text-cipher-500 bg-cipher-900 rounded-xl border border-cipher-800">
                No active devices found.
              </div>
            ) : (
              devices.map((device) => (
                <div
                  key={device.deviceId}
                  className="p-4 bg-cipher-900 border border-cipher-800 rounded-xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-cipher-800 rounded-lg text-cipher-300 border border-cipher-700">
                      <Laptop className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{device.displayName}</span>
                        <TrustBadge status={device.trustStatus} showLabel size="sm" />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-cipher-400 mt-1 font-mono">
                        <span>Device ID: {device.deviceId}</span>
                        {device.lastSeenIp && <span>• IP: {device.lastSeenIp}</span>}
                        {device.lastSeenTs && (
                          <span>
                            • Last seen: {new Date(device.lastSeenTs).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {device.trustStatus !== 'verified' && (
                      <button
                        onClick={() => handleVerify(device.deviceId)}
                        className="py-1.5 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Verify (SAS)</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleRevoke(device.deviceId)}
                      className="p-2 text-cipher-400 hover:text-red-400 hover:bg-cipher-800 rounded-lg border border-cipher-800 transition-colors"
                      title="Revoke and delete this device identity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
