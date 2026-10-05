import React from 'react';
import { useApp } from '../context/AppContext';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, t } = useApp();

  if (isOnline) return null;

  return (
    <div className="bg-amber-600 text-white text-xs px-4 py-1.5 flex items-center justify-center gap-2 font-medium shadow-sm transition">
      <WifiOff className="w-3.5 h-3.5" />
      <span>{t.offlineNotice}</span>
    </div>
  );
};
