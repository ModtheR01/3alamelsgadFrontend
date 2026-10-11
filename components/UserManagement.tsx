'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { userService } from '@/lib/api/services/userService';
import { UserRole, UserManagementUser } from '@/types/auth';
import { normalizeApiError } from '@/lib/api/errors';
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  Lock,
  Calendar,
  Phone,
  Mail,
  AlertTriangle,
} from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function UserManagement() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [userList, setUserList] = useState<UserManagementUser[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'ALL' | UserRole>('ALL');

  const [roleChangeLoadingId, setRoleChangeLoadingId] = useState<number | null>(null);
  const [statusChangeLoadingId, setStatusChangeLoadingId] = useState<number | null>(null);

  // Role Change Confirmation Dialog State
  const [pendingRoleChange, setPendingRoleChange] = useState<{
    targetUser: UserManagementUser;
    newRole: UserRole;
  } | null>(null);

  // Status Change Confirmation Dialog State
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    targetUser: UserManagementUser;
    nextIsActive: boolean;
  } | null>(null);

  const loadUsers = useCallback(async (search?: string) => {
    try {
      setUsersLoading(true);
      setUsersError(null);
      const res = await userService.getUsersPaginated({
        search: search || undefined,
        page_size: 100,
      });
      setUserList(res.results || []);
      setTotalCount(typeof res.count === 'number' ? res.count : (res.results?.length ?? 0));
    } catch (err) {
      const errInfo = normalizeApiError(err);
      if (errInfo.status === 403) {
        setUsersError('غير مصرح لك باستعراض سجل المستخدمين. هذه الصلاحية تتطلب حساب مدير النظام (Admin).');
      } else {
        setUsersError(errInfo.message);
      }
      setUserList([]);
      setTotalCount(null);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  // Debounced Search
  const didMount = useRef(false);
  useEffect(() => {
    const query = userSearchQuery.trim();
    if (!didMount.current) {
      didMount.current = true;
      loadUsers(query);
      return;
    }
    const timer = setTimeout(() => loadUsers(query), 350);
    return () => clearTimeout(timer);
  }, [userSearchQuery, loadUsers]);

  // Client-side filtering by role if requested
  const filteredUsers = useMemo(() => {
    if (selectedRoleFilter === 'ALL') return userList;
    return userList.filter((u) => u.role === selectedRoleFilter);
  }, [userList, selectedRoleFilter]);

  // Trigger Role Change Confirmation
  const requestRoleChange = (targetUser: UserManagementUser, newRole: UserRole) => {
    if (targetUser.role === newRole) return;
    setPendingRoleChange({ targetUser, newRole });
  };

  // Execute Role Change on Confirmation
  const confirmExecuteRoleChange = async () => {
    if (!pendingRoleChange) return;
    const { targetUser, newRole } = pendingRoleChange;

    setRoleChangeLoadingId(targetUser.id);
    setPendingRoleChange(null);

    try {
      await userService.changeUserRole(targetUser.id, newRole);
      // Refresh user list after success to ensure consistency with backend
      await loadUsers(userSearchQuery.trim());
    } catch (err) {
      alert(`فشل تغيير صلاحية المستخدم: ${normalizeApiError(err).message}`);
    } finally {
      setRoleChangeLoadingId(null);
    }
  };

  // Trigger Status Change Confirmation
  const requestStatusChange = (targetUser: UserManagementUser, nextIsActive: boolean) => {
    setPendingStatusChange({ targetUser, nextIsActive });
  };

  // Execute Status Change
  const confirmExecuteStatusChange = async () => {
    if (!pendingStatusChange) return;
    const { targetUser, nextIsActive } = pendingStatusChange;

    setStatusChangeLoadingId(targetUser.id);
    setPendingStatusChange(null);

    try {
      await userService.changeUserStatus(targetUser.id, nextIsActive);
      await loadUsers(userSearchQuery.trim());
    } catch (err) {
      alert(`فشل تعديل حالة الحساب: ${normalizeApiError(err).message}`);
    } finally {
      setStatusChangeLoadingId(null);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <ShieldAlert className="w-3 h-3 text-amber-700" />
            <span>مدير نظام (Admin)</span>
          </span>
        );
      case 'MODERATOR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
            <ShieldCheck className="w-3 h-3 text-blue-700" />
            <span>مشرف (Moderator)</span>
          </span>
        );
      case 'CUSTOMER':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#FAF5EB] text-[#5C4A3E] border border-[#E8DEC0]">
            <UserCheck className="w-3 h-3 text-[#A27B5C]" />
            <span>عميل (Customer)</span>
          </span>
        );
    }
  };

  const isSelfRoleChange = pendingRoleChange?.targetUser.id === user?.id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE3D8]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#241710] tracking-tight">
              إدارة المستخدمين والصلاحيات
            </h1>
            {totalCount !== null && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FAF5EB] text-[#A27B5C] border border-[#E8DEC0]">
                {totalCount} مسجل
              </span>
            )}
          </div>
          <p className="text-xs text-[#8C7A6B] mt-0.5">
            عرض سجل حسابات العملاء والمشرفين والتحكم الآمن في صلاحيات الوصول للوحة التحكم.
          </p>
        </div>

        <button
          onClick={() => loadUsers(userSearchQuery.trim())}
          disabled={usersLoading}
          className="px-3.5 py-2 rounded-xl border border-[#EAE3D8] bg-white hover:bg-[#FAF8F5] text-xs font-bold text-[#241710] flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shrink-0 shadow-xs"
          title="تحديث قائمة المستخدمين"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#A27B5C] ${usersLoading ? 'animate-spin' : ''}`} />
          <span>تحديث السجل</span>
        </button>
      </div>

      {/* Permission Info Banner for Moderators */}
      {!isAdmin && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-3">
          <Lock className="w-4 h-4 text-blue-700 shrink-0" />
          <span>
            أنت مسجل بصلاحية <strong>مشرف (Moderator)</strong>: يحق لك استعراض بيانات الحسابات فقط. تعديل الصلاحيات وتغيير حالات التنشيط محصور بمدراء النظام (Admin).
          </span>
        </div>
      )}

      {/* Toolbar: Search & Role Filter */}
      <div className="p-4 rounded-2xl bg-white border border-[#EAE3D8] shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#8C7A6B] absolute start-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={userSearchQuery}
            onChange={(e) => setUserSearchQuery(e.target.value)}
            placeholder="ابحث بالاسم، رقم الهاتف، أو البريد الإلكتروني..."
            className="w-full ps-9 pe-4 py-2 text-xs rounded-xl bg-[#FAF8F5] border border-[#EAE3D8] text-[#241710] placeholder-[#8C7A6B] focus:outline-none focus:border-[#241710]"
          />
        </div>

        {/* Role Filter Tabs */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <Filter className="w-3.5 h-3.5 text-[#A27B5C] shrink-0" />
          {(
            [
              { id: 'ALL', label: 'الكل' },
              { id: 'ADMIN', label: 'المدراء' },
              { id: 'MODERATOR', label: 'المشرفون' },
              { id: 'CUSTOMER', label: 'العملاء' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedRoleFilter(item.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedRoleFilter === item.id
                  ? 'bg-[#241710] text-[#FAF5EB] shadow-xs'
                  : 'bg-[#FAF8F5] text-[#5C4A3E] border border-[#EAE3D8] hover:bg-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error State */}
      {usersError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2.5 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
          <span>{usersError}</span>
        </div>
      )}

      {/* Loading State */}
      {usersLoading ? (
        <div className="py-20 text-center space-y-3 bg-white rounded-2xl border border-[#EAE3D8]">
          <RefreshCw className="w-6 h-6 animate-spin text-[#A27B5C] mx-auto" />
          <p className="text-xs font-bold text-[#241710]">جاري تحميل سجل المستخدمين من الخادم...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        /* Empty State */
        <div className="py-16 text-center space-y-3 bg-white rounded-2xl border border-[#EAE3D8]">
          <div className="w-12 h-12 rounded-full bg-[#FAF5EB] text-[#A27B5C] flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[#241710]">لا توجد حسابات مطابقة للبحث</h3>
          <p className="text-xs text-[#8C7A6B] max-w-sm mx-auto">
            لم يتم العثور على أي حساب يطابق معايير البحث أو الفلترة المحددة.
          </p>
        </div>
      ) : (
        /* Users Table */
        <div className="bg-white rounded-2xl border border-[#EAE3D8] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-[#FAF8F5] border-b border-[#EAE3D8] text-[#8C7A6B] text-[10px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 text-right">المستخدم</th>
                  <th className="py-3 px-4 text-right">رقم الهاتف</th>
                  <th className="py-3 px-4 text-right">البريد الإلكتروني</th>
                  <th className="py-3 px-4 text-right">حالة الحساب</th>
                  <th className="py-3 px-4 text-right">الصلاحية</th>
                  <th className="py-3 px-4 text-right">تاريخ التسجيل</th>
                  {isAdmin && <th className="py-3 px-4 text-left">إجراءات الحساب</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5EFE6]">
                {filteredUsers.map((u) => {
                  const isCurrentLoggedInUser = u.id === user?.id;
                  const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'مستخدم مسجل';

                  return (
                    <tr key={u.id} className="hover:bg-[#FAF8F5]/70 transition-colors">
                      {/* Name & ID */}
                      <td className="py-3.5 px-4 font-bold text-[#241710]">
                        <div className="flex items-center gap-2">
                          <span>{fullName}</span>
                          {isCurrentLoggedInUser && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                              أنت (الحساب الحالي)
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#8C7A6B] font-mono">معرف #{u.id}</span>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 font-mono text-[#5C4A3E]">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-[#A27B5C]" />
                          <span>{u.phone || '—'}</span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4 font-mono text-[#5C4A3E]">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-[#A27B5C]" />
                          <span className="truncate max-w-[180px]">{u.email || '—'}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            u.is_active
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {u.is_active ? 'نشط' : 'معطل'}
                        </span>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        {isAdmin ? (
                          <div className="flex items-center gap-1.5">
                            <select
                              value={u.role}
                              disabled={roleChangeLoadingId === u.id}
                              onChange={(e) => requestRoleChange(u, e.target.value as UserRole)}
                              className="text-xs p-1.5 rounded-xl border border-[#D8CEBF] bg-[#FAF8F5] text-[#241710] font-bold focus:outline-none focus:border-[#241710]"
                            >
                              <option value="CUSTOMER">عميل (CUSTOMER)</option>
                              <option value="MODERATOR">مشرف (MODERATOR)</option>
                              <option value="ADMIN">مدير نظام (ADMIN)</option>
                            </select>
                            {roleChangeLoadingId === u.id && (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#A27B5C]" />
                            )}
                          </div>
                        ) : (
                          getRoleBadge(u.role)
                        )}
                      </td>

                      {/* Registered Date */}
                      <td className="py-3.5 px-4 text-[#8C7A6B] text-[11px] font-mono">
                        {u.created_at || u.date_joined ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-[#A27B5C]" />
                            <span>
                              {new Date(u.created_at || u.date_joined || '').toLocaleDateString('ar-EG', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Actions (Admin Only) */}
                      {isAdmin && (
                        <td className="py-3.5 px-4 text-left">
                          {isCurrentLoggedInUser ? (
                            <span className="text-[10px] text-[#8C7A6B] italic">الحساب النشط</span>
                          ) : (
                            <button
                              onClick={() => requestStatusChange(u, !u.is_active)}
                              disabled={statusChangeLoadingId === u.id}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors disabled:opacity-50 ${
                                u.is_active
                                  ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200'
                                  : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                              }`}
                            >
                              {statusChangeLoadingId === u.id ? (
                                <RefreshCw className="w-3 h-3 animate-spin inline-block me-1" />
                              ) : null}
                              <span>{u.is_active ? 'تعطيل الحساب' : 'تنشيط الحساب'}</span>
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Role Change Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(pendingRoleChange)}
        title={isSelfRoleChange ? 'تحذير أمني: تعديل صلاحية حسابك الخاص' : 'تأكيد تغيير صلاحية المستخدم'}
        description={
          isSelfRoleChange
            ? `أنت على وشك تغيير صلاحية حسابك الخاص من ADMIN إلى ${pendingRoleChange?.newRole}. في حال تأكيد هذا الإجراء ستفقد الوصول إلى لوحة الإدارة فوراً ولا يمكن استرجاع الصلاحية إلا من خلال مدير نظام آخر. هل أنت متأكد تماماً؟`
            : `هل أنت متأكد من تغيير صلاحية المستخدم «${pendingRoleChange?.targetUser.first_name || pendingRoleChange?.targetUser.phone}» إلى رتبة «${pendingRoleChange?.newRole}»؟`
        }
        confirmLabel="نعم، تطبيق تغيير الصلاحية"
        cancelLabel="إلغاء الأمر"
        variant={isSelfRoleChange ? 'danger' : 'warning'}
        onConfirm={confirmExecuteRoleChange}
        onCancel={() => setPendingRoleChange(null)}
      />

      {/* Status Change Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(pendingStatusChange)}
        title={pendingStatusChange?.nextIsActive ? 'تأكيد تنشيط الحساب' : 'تأكيد تعطيل الحساب'}
        description={
          pendingStatusChange?.nextIsActive
            ? `سيتم إعادة تفعيل حساب المستخدم «${pendingStatusChange?.targetUser.first_name || pendingStatusChange?.targetUser.phone}» والسماح له بتسجيل الدخول وإتمام الطلبات.`
            : `سيتم تعطيل حساب المستخدم «${pendingStatusChange?.targetUser.first_name || pendingStatusChange?.targetUser.phone}» ومنعه من تسجيل الدخول إلى المتجر.`
        }
        confirmLabel={pendingStatusChange?.nextIsActive ? 'تنشيط الحساب' : 'تعطيل الحساب'}
        cancelLabel="إلغاء"
        variant={pendingStatusChange?.nextIsActive ? 'warning' : 'danger'}
        onConfirm={confirmExecuteStatusChange}
        onCancel={() => setPendingStatusChange(null)}
      />
    </div>
  );
}
