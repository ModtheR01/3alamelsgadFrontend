'use client';

import React from 'react';
import { AlertTriangle, Archive, Trash2 } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
  icon?: 'delete' | 'archive';
  confirmDisabled?: boolean;
  isLoading?: boolean;
  children?: React.ReactNode;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  variant = 'danger',
  icon = 'delete',
  confirmDisabled = false,
  isLoading = false,
  children,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  const Icon = icon === 'archive' ? Archive : icon === 'delete' ? Trash2 : AlertTriangle;

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-[#EAE4DC] shadow-2xl">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${isDanger ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'}`}>
            <Icon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-[#1C1A19]">{title}</h3>
        </div>

        <div className="text-xs text-[#524B45] leading-relaxed space-y-3">
          <p>{description}</p>
          {children}
        </div>

        <div className="pt-3 border-t border-[#EAE4DC] flex justify-end gap-2.5">
          <button type="button" onClick={onCancel} disabled={isLoading} className="px-4 py-2 text-xs uppercase tracking-wider text-[#736B63] hover:text-[#1C1A19] disabled:opacity-50 disabled:cursor-not-allowed">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading || confirmDisabled}
            className={`px-5 py-2 rounded-full text-white text-xs uppercase tracking-wider font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isDanger ? 'bg-rose-700 hover:bg-rose-800' : 'bg-amber-700 hover:bg-amber-800'
            }`}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}