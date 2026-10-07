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
  cancelLabel = 'إلغاء',
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
    <div dir="rtl" className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-[#EAE3D8] shadow-2xl text-right">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${isDanger ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'}`}>
            <Icon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#241710]">{title}</h3>
        </div>

        <div className="text-xs text-[#524B45] leading-relaxed space-y-3">
          <p>{description}</p>
          {children}
        </div>

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
            className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed ${
              isDanger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            {isLoading ? 'جاري التنفيذ...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}