'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { GovernorateShipping } from '@/types/shipping';
import { shippingService } from '@/lib/api/services/shippingService';
import {
  Truck,
  Search,
  Edit2,
  Check,
  X,
  RotateCcw,
  AlertCircle,
  Clock,
  MapPin,
  Save,
} from 'lucide-react';

export default function ShippingSection() {
  const [governorates, setGovernorates] = useState<GovernorateShipping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');
  const [editMinDays, setEditMinDays] = useState<string>('2');
  const [editMaxDays, setEditMaxDays] = useState<string>('4');
  const [isUpdating, setIsUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    shippingService
      .getGovernorates()
      .then((data) => {
        if (active) setGovernorates(data);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredGovernorates = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return governorates.filter(
      (g) =>
        !q ||
        g.nameAr.toLowerCase().includes(q) ||
        g.nameEn.toLowerCase().includes(q) ||
        g.id.toLowerCase().includes(q)
    );
  }, [governorates, searchQuery]);

  const handleStartEdit = (gov: GovernorateShipping) => {
    setEditingId(gov.id);
    setEditPrice(String(gov.shippingCost));
    setEditMinDays(String(gov.deliveryDaysMin || 2));
    setEditMaxDays(String(gov.deliveryDaysMax || 4));
  };

  const handleSaveEdit = async (govId: string) => {
    setIsUpdating(true);
    try {
      const updated = await shippingService.updateGovernorate(govId, {
        shippingCost: Number(editPrice),
        deliveryDaysMin: Number(editMinDays),
        deliveryDaysMax: Number(editMaxDays),
      });

      setGovernorates((prev) => prev.map((g) => (g.id === govId ? updated : g)));
      setEditingId(null);
      setToastMessage('Shipping configuration updated successfully.');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: any) {
      alert(err?.message || 'Failed to update shipping price');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Are you sure you want to reset all governorate shipping rates to default factory values?')) {
      const reset = shippingService.resetToDefaults();
      setGovernorates(reset);
      setToastMessage('Reset all governorate shipping rates to defaults.');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#EAE3D8]">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#241710] tracking-tight">
            Governorate Shipping Rates
          </h1>
          <p className="text-xs text-[#8C7A6B]">
            Set shipping fees and delivery day windows for all Egyptian governorates.
          </p>
        </div>

        <button
          onClick={handleResetDefaults}
          className="px-3.5 py-2 rounded-xl bg-white border border-[#EAE3D8] hover:bg-[#F5EFE6] text-xs font-semibold text-[#5C4A3E] flex items-center gap-1.5 transition-colors shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-[#EAE3D8] shadow-xs flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute top-3 start-3 text-[#8C7A6B]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search governorates (Cairo, Alexandria, Mansoura...)"
            className="w-full ps-9 pe-3 py-2 text-xs rounded-xl bg-[#FAF8F5] border border-[#EAE3D8] text-[#241710] placeholder-[#A89A8E] focus:outline-none focus:border-[#241710]"
          />
        </div>

        <span className="text-xs text-[#8C7A6B]">
          Governorates: <strong className="text-[#241710]">{governorates.length}</strong> regions
        </span>
      </div>

      {/* Governorates Table */}
      <div className="rounded-2xl bg-white border border-[#EAE3D8] shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-[#8C7A6B]">Loading shipping rates...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-[#FAF8F5] border-b border-[#EAE3D8] text-[#8C7A6B] uppercase font-bold text-[10px]">
                <tr>
                  <th className="py-3 px-4 text-start">Governorate (المحافظة)</th>
                  <th className="py-3 px-3 text-start">English Name</th>
                  <th className="py-3 px-3 text-start">Shipping Rate (EGP)</th>
                  <th className="py-3 px-3 text-start">Delivery Window</th>
                  <th className="py-3 px-3 text-start">Status</th>
                  <th className="py-3 px-4 text-end">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5EFE6]">
                {filteredGovernorates.map((gov) => {
                  const isEditing = editingId === gov.id;

                  return (
                    <tr key={gov.id} className="hover:bg-[#FAF8F5] transition-colors">
                      {/* Name Arabic */}
                      <td className="py-3 px-4 font-bold text-[#241710]">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-[#A27B5C]" />
                          <span>{gov.nameAr}</span>
                        </div>
                      </td>

                      {/* Name English */}
                      <td className="py-3 px-3 text-[#5C4A3E] font-medium">{gov.nameEn}</td>

                      {/* Shipping Cost */}
                      <td className="py-3 px-3">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5 max-w-[120px]">
                            <input
                              type="number"
                              min={0}
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              className="w-20 px-2 py-1 text-xs rounded border border-[#241710] bg-white font-bold"
                            />
                            <span className="text-[11px] text-[#8C7A6B]">EGP</span>
                          </div>
                        ) : (
                          <span className="font-extrabold text-[#241710] text-sm">
                            {gov.shippingCost} EGP
                          </span>
                        )}
                      </td>

                      {/* Delivery Days */}
                      <td className="py-3 px-3 text-[#5C4A3E]">
                        {isEditing ? (
                          <div className="flex items-center gap-1 max-w-[150px]">
                            <input
                              type="number"
                              min={1}
                              max={14}
                              value={editMinDays}
                              onChange={(e) => setEditMinDays(e.target.value)}
                              className="w-12 px-1.5 py-1 text-xs rounded border border-[#EAE3D8] text-center"
                            />
                            <span>to</span>
                            <input
                              type="number"
                              min={1}
                              max={14}
                              value={editMaxDays}
                              onChange={(e) => setEditMaxDays(e.target.value)}
                              className="w-12 px-1.5 py-1 text-xs rounded border border-[#EAE3D8] text-center"
                            />
                            <span className="text-[10px] text-[#8C7A6B]">days</span>
                          </div>
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#8C7A6B]" />
                            <span>
                              {gov.deliveryDaysMin}–{gov.deliveryDaysMax} business days
                            </span>
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Available
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-end">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              disabled={isUpdating}
                              onClick={() => handleSaveEdit(gov.id)}
                              className="px-2.5 py-1 rounded bg-[#241710] text-white font-bold text-xs hover:bg-[#3D281C]"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 rounded text-[#8C7A6B] hover:bg-[#F5EFE6]"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(gov)}
                            className="px-2.5 py-1 rounded-lg bg-[#FAF5EB] hover:bg-[#F2E8D7] text-[#A27B5C] font-semibold text-xs flex items-center gap-1 ms-auto"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit Rate</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
