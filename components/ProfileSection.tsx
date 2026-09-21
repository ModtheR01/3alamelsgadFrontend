'use client';

import React, { useState } from 'react';
import { BackendUser, ProfileResponse, ProfileUpdateRequest } from '@/types/auth';
import { normalizeApiError } from '@/lib/api/errors';
import {
  Lock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface ProfileSectionProps {
  user: BackendUser;
  profile: ProfileResponse | null;
  updateProfile: (
    data: ProfileUpdateRequest,
    method?: 'PUT' | 'PATCH'
  ) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

export default function ProfileSection({
  user,
  profile,
  updateProfile,
  deleteAccount,
}: ProfileSectionProps) {
  const [profileFirstName, setProfileFirstName] = useState(
    () => profile?.first_name || user.first_name || ''
  );
  const [profileLastName, setProfileLastName] = useState(
    () => profile?.last_name || user.last_name || ''
  );
  const [profilePhone, setProfilePhone] = useState(
    () => profile?.phone || user.phone || ''
  );
  const [profileUpdateMethod, setProfileUpdateMethod] = useState<'PUT' | 'PATCH'>('PUT');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Soft Delete Modal
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage(null);
    try {
      await updateProfile(
        {
          first_name: profileFirstName,
          last_name: profileLastName,
          phone: profilePhone,
        },
        profileUpdateMethod
      );
      setProfileMessage({ type: 'success', text: 'Client profile updated successfully.' });
      setTimeout(() => setProfileMessage(null), 4000);
    } catch (err) {
      const normalized = normalizeApiError(err);
      setProfileMessage({ type: 'error', text: normalized.message });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleConfirmDeleteAccount = async () => {
    setDeleteAccountLoading(true);
    try {
      await deleteAccount();
      setShowDeleteAccountModal(false);
    } catch (err) {
      const normalized = normalizeApiError(err);
      alert(normalized.message);
    } finally {
      setDeleteAccountLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Profile Card */}
      <div className="p-5 sm:p-8 rounded-xl sm:rounded-2xl bg-white border border-[#EAE4DC] shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-[#EAE4DC] pb-4">
          <div>
            <h3 className="text-sm uppercase tracking-wider font-semibold text-[#1C1A19]">
              Client Credentials & Profile
            </h3>
            <p className="text-xs text-[#736B63]">
              Email is read-only and immutable. Update name and contact details below.
            </p>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F5F1EA] text-[#643D26] font-mono">
            ID: #{user.id}
          </span>
        </div>

        {profileMessage && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
              profileMessage.type === 'success'
                ? 'bg-[#EBF7EE] text-[#155724] border border-[#C3E6CB]'
                : 'bg-[#FDF3F2] text-[#9E4A2B] border border-[#F5C2C0]'
            }`}
          >
            {profileMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{profileMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[11px] uppercase tracking-wider text-[#736B63] font-medium">
                First Name
              </label>
              <input
                type="text"
                required
                value={profileFirstName}
                onChange={(e) => setProfileFirstName(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-[#D8CEBF] bg-[#FAF8F5] text-[#1C1A19] focus:outline-none focus:border-[#1C1A19]"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] uppercase tracking-wider text-[#736B63] font-medium">
                Last Name
              </label>
              <input
                type="text"
                required
                value={profileLastName}
                onChange={(e) => setProfileLastName(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-[#D8CEBF] bg-[#FAF8F5] text-[#1C1A19] focus:outline-none focus:border-[#1C1A19]"
              />
            </div>
          </div>

          {/* Email is READ-ONLY as required */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] uppercase tracking-wider text-[#736B63] font-medium">
                Email Address (Read-Only)
              </label>
              <span className="text-[10px] text-[#8F8880] flex items-center gap-1 font-mono">
                <Lock className="w-3 h-3" /> Immutable
              </span>
            </div>
            <input
              type="email"
              disabled
              value={user.email}
              className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-[#EAE4DC] bg-[#EFEBE3]/60 text-[#736B63] font-mono cursor-not-allowed"
            />
            <p className="text-[10px] text-[#8F8880]">
              Email cannot be changed directly as it acts as your authenticated identifier.
            </p>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] uppercase tracking-wider text-[#736B63] font-medium">
              Mobile Phone Number
            </label>
            <input
              type="tel"
              required
              value={profilePhone}
              onChange={(e) => setProfilePhone(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-[#D8CEBF] bg-[#FAF8F5] text-[#1C1A19] focus:outline-none focus:border-[#1C1A19]"
            />
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#EAE4DC]">
            <div className="flex items-center gap-2 text-[11px] text-[#736B63]">
              <span>Method:</span>
              <button
                type="button"
                onClick={() => setProfileUpdateMethod('PUT')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                  profileUpdateMethod === 'PUT' ? 'bg-[#1C1A19] text-white' : 'bg-[#EAE4DC]'
                }`}
              >
                PUT
              </button>
              <button
                type="button"
                onClick={() => setProfileUpdateMethod('PATCH')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                  profileUpdateMethod === 'PATCH' ? 'bg-[#1C1A19] text-white' : 'bg-[#EAE4DC]'
                }`}
              >
                PATCH
              </button>
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="px-6 py-2.5 rounded-full bg-[#1C1A19] text-white text-xs uppercase tracking-wider font-medium hover:bg-[#332F2D] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {profileLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>

      {/* Account Danger Zone (Soft Delete) */}
      <div className="p-5 sm:p-6 rounded-xl sm:rounded-2xl bg-white border border-[#F5C2C0] shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-[#9E4A2B]">
          <AlertTriangle className="w-4 h-4" />
          <h4 className="text-xs uppercase tracking-wider font-semibold">
            Account Deactivation & Soft Delete
          </h4>
        </div>
        <p className="text-xs text-[#736B63]">
          Soft deletes your client account by setting <code className="text-[#1C1A19] font-mono">is_active = false</code> and recording <code className="text-[#1C1A19] font-mono">deleted_at</code> timestamp. Your authenticated session will be immediately cleared.
        </p>
        <button
          type="button"
          onClick={() => setShowDeleteAccountModal(true)}
          className="px-4 py-2 rounded-full bg-[#FAF3F0] text-[#B85D38] border border-[#F5C2C0] text-xs uppercase tracking-wider font-medium hover:bg-[#FDF3F2] transition-colors"
        >
          Deactivate & Delete Account
        </button>
      </div>

      {/* Confirm Account Delete Modal */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 space-y-4 border border-[#F5C2C0] shadow-xl">
            <div className="flex items-center gap-2 text-[#B85D38]">
              <AlertTriangle className="w-5 h-5" />
              <h4 className="text-sm font-semibold">Confirm Account Deactivation</h4>
            </div>
            <p className="text-xs text-[#736B63] leading-relaxed">
              Are you sure you want to deactivate your profile? This soft deletes your record in the Django REST Framework database. You will be signed out immediately.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#EAE4DC]">
              <button
                type="button"
                onClick={() => setShowDeleteAccountModal(false)}
                className="px-3.5 py-1.5 text-xs uppercase tracking-wider text-[#736B63]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteAccountLoading}
                onClick={handleConfirmDeleteAccount}
                className="px-4 py-1.5 rounded-full bg-[#B85D38] text-white text-xs uppercase tracking-wider font-medium disabled:opacity-50 flex items-center gap-1.5"
              >
                {deleteAccountLoading && <RefreshCw className="w-3 h-3 animate-spin" />}
                <span>Confirm Deactivation</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
