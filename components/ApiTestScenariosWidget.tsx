'use client';

import React, { useState, useSyncExternalStore } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { TestScenario } from '@/lib/api/mock/mockState';
import { apiConfig } from '@/lib/api/config';
import {
  Settings,
  Shield,
  UserCheck,
  AlertTriangle,
  RotateCcw,
  RefreshCw,
  Server,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function ApiTestScenariosWidget() {
  const {
    user,
    role,
    apiMode,
    activeScenario,
    switchApiMode,
    setScenario,
    switchSimulatedUser,
    resetMockData,
  } = useAuth();

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [isOpen, setIsOpen] = useState(false);
  const [customApiUrl, setCustomApiUrl] = useState(() => apiConfig.getBaseUrl());
  const [copiedFeedback, setCopiedFeedback] = useState(false);

  const scenarios: { id: TestScenario; label: string; description: string; badge: string }[] = [
    {
      id: 'normal',
      label: 'Normal Flow',
      description: 'Standard successful responses for all endpoints',
      badge: 'Success',
    },
    {
      id: 'expired_access_token',
      label: 'Expired Access Token (Auto-Refresh)',
      description: 'First request fails with 401, auto-refreshes via /auth/refresh/ and retries successfully',
      badge: '401 -> 200',
    },
    {
      id: 'missing_refresh_token',
      label: 'Missing Refresh Token',
      description: 'Refresh endpoint returns 401, session clears and logs user out',
      badge: '401 Logout',
    },
    {
      id: 'invalid_refresh_token',
      label: 'Invalid / Expired Refresh Token',
      description: 'Returns 401 with { detail: "Refresh token is invalid or expired." }',
      badge: '401 Expired',
    },
    {
      id: 'inactive_user',
      label: 'Inactive / Disabled User',
      description: 'Returns 401 with { detail: "User account is disabled." }',
      badge: '401 Disabled',
    },
    {
      id: 'forbidden_admin',
      label: 'Forbidden Admin Endpoint (403)',
      description: 'Returns 403 Forbidden with { detail: "You do not have permission..." }',
      badge: '403 Forbidden',
    },
    {
      id: 'duplicate_address',
      label: 'Duplicate Address Conflict (400)',
      description: 'Returns 400 with { message: "This address already exists." }',
      badge: '400 Duplicate',
    },
    {
      id: 'duplicate_color',
      label: 'Duplicate Color Name Conflict (400)',
      description: 'Returns 400 with { name: ["A color with this name already exists."] }',
      badge: '400 Color',
    },
    {
      id: 'duplicate_product',
      label: 'Product Validation Error (400)',
      description: 'Simulates 400 Bad Request on product creation/update',
      badge: '400 Product',
    },
    {
      id: 'network_error',
      label: 'Simulated Network Failure',
      description: 'Simulates unreachable backend or connection drop',
      badge: 'Network Err',
    },
    {
      id: 'server_error',
      label: 'Backend Server 500 Error',
      description: 'Simulates 500 Internal Server Error response',
      badge: '500 Server',
    },
  ];

  if (!mounted) {
    return null;
  }

  return (
    <div
      className="fixed bottom-4 left-4 z-50 print:hidden font-sans notranslate"
      translate="no"
      suppressHydrationWarning
    >
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-full bg-[#1C1A19] text-white text-[11px] font-medium tracking-wider uppercase shadow-xl hover:bg-[#332F2D] border border-white/20 transition-all hover:scale-105"
          title="Open API & Test Scenarios Console"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>API Mode: {apiMode.toUpperCase()}</span>
          <span className="text-white/60">|</span>
          <span className="text-white/90 truncate max-w-[110px]">
            {user ? `${user.role}: ${user.first_name}` : 'Logged Out'}
          </span>
          <ChevronUp className="w-3.5 h-3.5 text-white/70" />
        </button>
      )}

      {/* Expanded Scenarios Panel */}
      {isOpen && (
        <div className="bg-[#FAF8F5] border border-[#D8CEBF] rounded-2xl shadow-2xl w-[360px] sm:w-[420px] max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-3 duration-200">
          {/* Header */}
          <div className="bg-[#1C1A19] text-white p-4 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-[#D8CEBF]" />
              <div>
                <h3 className="text-xs uppercase tracking-wider font-semibold text-white">
                  DRF Backend & Mock Console
                </h3>
                <p className="text-[10px] text-white/60">Django REST Framework Integration</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(85vh-70px)] text-xs text-[#2C2724]">
            {/* Mode Switcher */}
            <div className="bg-white p-3 rounded-xl border border-[#EAE4DC] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#1C1A19] uppercase tracking-wider text-[11px]">
                  Integration Mode
                </span>
                <span className="text-[10px] text-[#736B63]">
                  {apiMode === 'mock' ? 'In-browser DRF Simulation' : 'Live HTTP API'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => switchApiMode('mock')}
                  className={`py-2 px-3 rounded-lg font-medium text-xs text-center border transition-all ${
                    apiMode === 'mock'
                      ? 'bg-[#1C1A19] text-white border-[#1C1A19] shadow-sm'
                      : 'bg-[#FAF8F5] text-[#736B63] border-[#D8CEBF] hover:bg-[#F0ECE4]'
                  }`}
                >
                  Mock API Mode
                </button>
                <button
                  type="button"
                  onClick={() => switchApiMode('real')}
                  className={`py-2 px-3 rounded-lg font-medium text-xs text-center border transition-all ${
                    apiMode === 'real'
                      ? 'bg-[#1C1A19] text-white border-[#1C1A19] shadow-sm'
                      : 'bg-[#FAF8F5] text-[#736B63] border-[#D8CEBF] hover:bg-[#F0ECE4]'
                  }`}
                >
                  Real API Mode
                </button>
              </div>

              {apiMode === 'real' && (
                <div className="space-y-1 pt-1">
                  <label className="text-[10px] uppercase tracking-wider text-[#736B63]">
                    Backend API URL (credentials: &apos;include&apos;)
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={customApiUrl}
                      onChange={(e) => setCustomApiUrl(e.target.value)}
                      placeholder="http://localhost:8000/api"
                      className="flex-1 text-[11px] p-2 rounded-lg border border-[#D8CEBF] font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        apiConfig.setBaseUrl(customApiUrl);
                        setCopiedFeedback(true);
                        setTimeout(() => setCopiedFeedback(false), 1500);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#1C1A19] text-white text-[10px] uppercase font-medium"
                    >
                      {copiedFeedback ? 'Saved' : 'Save'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Simulated User Role Switcher */}
            <div className="bg-white p-3 rounded-xl border border-[#EAE4DC] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#1C1A19] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-[#643D26]" />
                  Active User & Role
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EFEBE3] text-[#643D26] font-semibold">
                  {role || 'None'}
                </span>
              </div>

              {user ? (
                <p className="text-[11px] text-[#736B63]">
                  Signed in as <strong className="text-[#1C1A19]">{user.first_name} {user.last_name}</strong> ({user.email})
                </p>
              ) : (
                <p className="text-[11px] text-[#9E4A2B]">Currently unauthenticated (no session)</p>
              )}

              <div className="pt-1">
                <span className="text-[10px] uppercase tracking-wider text-[#736B63] block mb-1.5">
                  Quick Switch Test Account:
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => switchSimulatedUser('CUSTOMER')}
                    className={`p-1.5 rounded-md border text-[11px] font-medium text-center transition-all ${
                      role === 'CUSTOMER'
                        ? 'border-[#643D26] bg-[#F5F1EA] text-[#643D26]'
                        : 'border-[#D8CEBF] hover:bg-[#F2EDE4] text-[#736B63]'
                    }`}
                  >
                    Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => switchSimulatedUser('ADMIN')}
                    className={`p-1.5 rounded-md border text-[11px] font-medium text-center transition-all ${
                      role === 'ADMIN'
                        ? 'border-[#643D26] bg-[#F5F1EA] text-[#643D26]'
                        : 'border-[#D8CEBF] hover:bg-[#F2EDE4] text-[#736B63]'
                    }`}
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => switchSimulatedUser('MODERATOR')}
                    className={`p-1.5 rounded-md border text-[11px] font-medium text-center transition-all ${
                      role === 'MODERATOR'
                        ? 'border-[#643D26] bg-[#F5F1EA] text-[#643D26]'
                        : 'border-[#D8CEBF] hover:bg-[#F2EDE4] text-[#736B63]'
                    }`}
                  >
                    Moderator
                  </button>
                </div>
              </div>
            </div>

            {/* Mock Test Scenarios */}
            <div className="bg-white p-3 rounded-xl border border-[#EAE4DC] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#1C1A19] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#B85D38]" />
                  Simulate API Scenarios
                </span>
                <button
                  type="button"
                  onClick={resetMockData}
                  className="text-[10px] text-[#736B63] hover:text-[#1C1A19] flex items-center gap-1"
                  title="Reset simulated users and addresses to defaults"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Data</span>
                </button>
              </div>

              <div className="space-y-1.5">
                {scenarios.map((sc) => {
                  const isSelected = activeScenario === sc.id;
                  return (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => setScenario(sc.id)}
                      className={`w-full text-left p-2 rounded-lg border transition-all flex items-start justify-between gap-2 ${
                        isSelected
                          ? 'border-[#1C1A19] bg-[#F7F4EE] shadow-xs'
                          : 'border-[#EAE4DC] hover:border-[#D8CEBF] hover:bg-[#FAF8F5]'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-semibold text-[11px] ${
                              isSelected ? 'text-[#1C1A19]' : 'text-[#524B45]'
                            }`}
                          >
                            {sc.label}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#736B63] leading-tight">{sc.description}</p>
                      </div>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-medium shrink-0 ${
                          isSelected
                            ? 'bg-[#1C1A19] text-white'
                            : 'bg-[#EFEBE3] text-[#736B63]'
                        }`}
                      >
                        {sc.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
