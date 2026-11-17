import React from 'react';
import { ShieldCheck, ShieldAlert, Lock, Unlock } from 'lucide-react';
import type { TrustStatus } from '../../types';

interface TrustBadgeProps {
  status: TrustStatus;
  isEncrypted?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const TrustBadge: React.FC<TrustBadgeProps> = ({
  status,
  isEncrypted = true,
  size = 'md',
  showLabel = false,
}) => {
  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  if (!isEncrypted) {
    return (
      <span className="inline-flex items-center gap-1 text-slate-400" title="Plaintext / Unencrypted Room">
        <Unlock className={sizeClasses[size]} />
        {showLabel && <span className="text-xs font-medium">Unencrypted</span>}
      </span>
    );
  }

  switch (status) {
    case 'verified':
      return (
        <span
          className="inline-flex items-center gap-1 text-shield-verified bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20"
          title="Cryptographically Verified: Identity signed with trusted cross-signing keys"
        >
          <ShieldCheck className={sizeClasses[size]} />
          {showLabel && <span className="text-xs font-semibold uppercase tracking-wider">Verified</span>}
        </span>
      );
    case 'danger':
      return (
        <span
          className="inline-flex items-center gap-1 text-shield-danger bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20"
          title="Cryptographic Warning: Decryption failed or identity key changed unexpectedly!"
        >
          <ShieldAlert className={sizeClasses[size]} />
          {showLabel && <span className="text-xs font-semibold uppercase tracking-wider">Warning</span>}
        </span>
      );
    case 'unverified':
    default:
      return (
        <span
          className="inline-flex items-center gap-1 text-shield-unverified bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20"
          title="End-to-End Encrypted, but device is not yet verified via SAS or Cross-Signing"
        >
          <Lock className={sizeClasses[size]} />
          {showLabel && <span className="text-xs font-semibold uppercase tracking-wider">Unverified</span>}
        </span>
      );
  }
};
