'use client';

import React from 'react';
import { AlertTriangle, Archive, Trash2, RotateCcw, AlertCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  icon?: 'delete' | 'archive' | 'restore';
  confirmDisabled?: boolean;
  isLoading?: boolean;
  error?: string | null;
  children?: React.ReactNode;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel = 'إلغاء',
  variant = 'danger',
  icon = 'delete',
  confirmDisabled = false,
  isLoading = false,
  error = null,
  children,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  const isWarning = variant === 'warning';
  const Icon = icon === 'archive' ? Archive : icon === 'restore' ? RotateCcw : icon === 'delete' ? Trash2 : AlertTriangle;

  const iconBg = isDanger
    ? 'bg-rose-100 text-rose-700'
    : isWarning
    ? 'bg-amber-100 text-amber-800'
    : 'bg-emerald-100 text-emerald-800';

  const confirmBtnBg = isDanger
    ? 'bg-rose-600 hover:bg-rose-700'
    : isWarning
    ? 'bg-amber-600 hover:bg-amber-700'
    : 'bg-emerald-600 hover:bg-emerald-700';

  return (
    <div dir="rtl" className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-[#EAE3D8] shadow-2xl text-right">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${iconBg}`}>
            <Icon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#241710]">{title}</h3>
        </div>

        <div className="text-xs text-[#524B45] leading-relaxed space-y-3">
          <p>{description}</p>
          {children}
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-bold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="flex-1 leading-normal">{error}</span>
          </div>
        )}

        <div className="pt-3 border-t border-[#EAE3D8] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#736B63] hover:text-[#241710] hover:bg-[#F5EFE6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading || confirmDisabled}
            className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed ${confirmBtnBg}`}
          >
            {isLoading ? 'جاري التنفيذ...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}