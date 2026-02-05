"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { superadminApi } from "@/lib/api";
import type { RestrictionConfigResponse } from "@/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

type SuperadminTheme = "dark" | "light";

interface SuperadminSettingsTabProps {
  theme?: SuperadminTheme;
}

const AREA_LABELS: Record<string, string> = {
  wallet: "Wallet",
  withdrawals: "Withdrawals",
  shop: "Shop",
  profile_edit: "Profile edit",
  membership: "Membership",
  referrals: "Referrals",
};

type StatusKey = "hold" | "ban" | "inactive";

export function SuperadminSettingsTab({ theme = "dark" }: SuperadminSettingsTabProps) {
  const isLight = theme === "light";
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["superadmin-restriction-config"],
    queryFn: () => superadminApi.getRestrictionConfig(),
  });

  const [localConfig, setLocalConfig] = useState<RestrictionConfigResponse["config"] | null>(null);

  useEffect(() => {
    if (data?.config) setLocalConfig({ ...data.config });
  }, [data?.config]);

  const updateLocal = (status: StatusKey, area: string, checked: boolean) => {
    setLocalConfig((prev) => {
      if (!prev) return prev;
      const list = prev[status] ?? [];
      const next = checked ? [...list, area] : list.filter((a) => a !== area);
      return { ...prev, [status]: next };
    });
  };

  const save = async () => {
    if (!localConfig) return;
    try {
      await superadminApi.updateRestrictionConfig(localConfig);
      toast.success("Restriction settings saved");
      queryClient.invalidateQueries({ queryKey: ["superadmin-restriction-config"] });
    } catch {
      toast.error("Failed to save");
    }
  };

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className={`w-8 h-8 animate-spin ${isLight ? "text-amber-600" : "text-amber-500/60"}`} />
      </div>
    );
  }

  const config = localConfig ?? data.config;
  const restrictableAreas = data.restrictable_areas ?? [];

  return (
    <div className="space-y-6">
      <p className={`text-sm ${isLight ? "text-slate-600" : "text-slate-400"}`}>
        Choose which areas are blocked for each account status. When a user is on Hold, Ban, or Inactive, the selected areas will show &quot;You are on hold / banned / inactive, you cannot do that.&quot;
      </p>
      <div
        className={`rounded-lg border overflow-hidden ${
          isLight ? "border-slate-200 bg-white shadow-sm" : "border-slate-700/80 bg-[#161b22]/50"
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={isLight ? "border-b border-slate-200 bg-slate-50" : "border-b border-slate-700/80 bg-slate-800/30"}>
                <th className={`text-left py-3 px-4 font-semibold ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                  Area
                </th>
                <th className={`text-left py-3 px-4 font-semibold ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                  Hold
                </th>
                <th className={`text-left py-3 px-4 font-semibold ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                  Ban
                </th>
                <th className={`text-left py-3 px-4 font-semibold ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                  Inactive
                </th>
              </tr>
            </thead>
            <tbody>
              {restrictableAreas.map((area) => (
                <tr
                  key={area}
                  className={isLight ? "border-b border-slate-100 hover:bg-slate-50" : "border-b border-slate-700/50 hover:bg-slate-800/30"}
                >
                  <td className="py-3 px-4 font-medium">{AREA_LABELS[area] ?? area}</td>
                  {(["hold", "ban", "inactive"] as const).map((status) => (
                    <td key={status} className="py-3 px-4">
                      <Checkbox
                        checked={config[status]?.includes(area) ?? false}
                        onCheckedChange={(checked) => updateLocal(status, area, !!checked)}
                        className={isLight ? "" : "border-slate-600 data-[state=checked]:bg-amber-500/20"}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={`flex justify-end p-4 border-t ${isLight ? "border-slate-200 bg-slate-50" : "border-slate-700/80 bg-slate-800/20"}`}>
          <Button
            onClick={save}
            className={`font-mono ${isLight ? "bg-amber-600 hover:bg-amber-700" : "bg-amber-500/80 hover:bg-amber-500"}`}
          >
            <Save className="w-4 h-4 mr-2" />
            Save settings
          </Button>
        </div>
      </div>
    </div>
  );
}
