'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { userService } from '@/lib/api/services/userService';
import { UserRole, UserManagementUser } from '@/types/auth';
import { normalizeApiError } from '@/lib/api/errors';
import { RefreshCw, AlertCircle } from 'lucide-react';

export default function UserManagement() {
  const { user } = useAuth();

  const [userList, setUserList] = useState<UserManagementUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [roleChangeLoadingId, setRoleChangeLoadingId] = useState<number | null>(null);
  const [statusChangeLoadingId, setStatusChangeLoadingId] = useState<number | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  const loadUsers = useCallback(async (search?: string) => {
    try {
      setUsersLoading(true);
      setUsersError(null);
      const data = await userService.listUsers(search ? { search } : undefined);
      setUserList(data);
    } catch (err) {
      setUsersError(normalizeApiError(err).message);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  // Load immediately on mount, then debounce reloads as the search box changes.
  const didMount = useRef(false);
  useEffect(() => {
    const query = userSearchQuery.trim();
    if (!didMount.current) {
      didMount.current = true;
      loadUsers(query);
      return;
    }
    const handle = setTimeout(() => loadUsers(query), 350);
    return () => clearTimeout(handle);
  }, [userSearchQuery, loadUsers]);

  const handleRoleChange = async (targetUserId: number, newRole: UserRole) => {
    setRoleChangeLoadingId(targetUserId);
    try {
      await userService.changeUserRole(targetUserId, newRole);
      setUserList((prev) =>
        prev.map((u) => (u.id === targetUserId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      alert(`Could not change role: ${normalizeApiError(err).message}`);
    } finally {
      setRoleChangeLoadingId(null);
    }
  };

  const handleStatusChange = async (targetUserId: number, nextIsActive: boolean) => {
    setStatusChangeLoadingId(targetUserId);
    try {
      await userService.changeUserStatus(targetUserId, nextIsActive);
      setUserList((prev) =>
        prev.map((u) => (u.id === targetUserId ? { ...u, is_active: nextIsActive } : u))
      );
    } catch (err) {
      alert(`Could not update status: ${normalizeApiError(err).message}`);
    } finally {
      setStatusChangeLoadingId(null);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[#1C1A19]">
            Registered Users & Access Roles
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={userSearchQuery}
            onChange={(e) => setUserSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="text-xs px-3 py-1.5 rounded-lg border border-[#D8CEBF] bg-white focus:outline-none"
          />
          <button
            onClick={() => loadUsers(userSearchQuery.trim())}
            className="p-2 rounded-lg border border-[#D8CEBF] bg-white text-[#736B63] hover:text-[#1C1A19]"
            title="Refresh User Directory"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${usersLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {usersError && (
        <div className="p-3 rounded-lg bg-[#FDF3F2] border border-[#F5C2C0] text-[#9E4A2B] text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{usersError}</span>
        </div>
      )}

      {usersLoading ? (
        <div className="py-12 text-center text-xs uppercase tracking-wider text-[#736B63]">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#643D26]" />
          Fetching user records...
        </div>
      ) : userList.length === 0 ? (
        <div className="py-12 bg-white rounded-xl border border-[#EAE4DC] text-center text-xs text-[#736B63]">
          No user accounts found.
        </div>
      ) : (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-[#EAE4DC] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] border-b border-[#EAE4DC] text-[10px] uppercase tracking-wider text-[#736B63]">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Role Access</th>
                  <th className="py-3 px-4">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FAF8F5]">
                {userList.map((u) => (
                  <tr key={u.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-[#1C1A19]">
                      {u.first_name} {u.last_name}
                      {u.id === user?.id && (
                        <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded bg-[#EFEBE3] text-[#643D26]">
                          You
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#524B45]">{u.email}</td>
                    <td className="py-3.5 px-4 font-mono text-[#736B63]">{u.phone}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            u.is_active
                              ? 'bg-[#EBF7EE] text-[#155724]'
                              : 'bg-[#FDF3F2] text-[#9E4A2B]'
                          }`}
                        >
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                        {user?.role === 'ADMIN' && u.id !== user?.id && (
                          <button
                            onClick={() => handleStatusChange(u.id, !u.is_active)}
                            disabled={statusChangeLoadingId === u.id}
                            className="text-[10px] px-1.5 py-0.5 rounded border border-[#D8CEBF] text-[#736B63] hover:text-[#1C1A19] disabled:opacity-50"
                          >
                            {statusChangeLoadingId === u.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : u.is_active ? (
                              'Deactivate'
                            ) : (
                              'Activate'
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {user?.role === 'ADMIN' ? (
                        <div className="flex items-center gap-1.5">
                          <select
                            value={u.role}
                            disabled={roleChangeLoadingId === u.id}
                            onChange={(e) =>
                              handleRoleChange(u.id, e.target.value as UserRole)
                            }
                            className="text-[11px] p-1.5 rounded border border-[#D8CEBF] bg-[#FAF8F5] text-[#1C1A19] focus:outline-none focus:border-[#1C1A19]"
                          >
                            <option value="CUSTOMER">CUSTOMER</option>
                            <option value="MODERATOR">MODERATOR</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                          {roleChangeLoadingId === u.id && (
                            <RefreshCw className="w-3 h-3 animate-spin text-[#643D26]" />
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] font-semibold text-[#1C1A19]">
                          {u.role}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#8F8880] text-[11px]">
                      {new Date(u.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
