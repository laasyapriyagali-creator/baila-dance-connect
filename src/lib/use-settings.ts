import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSession } from "@/lib/auth";
import { fetchSettings, saveSettings } from "@/lib/baila-data";
import type { UserSettings } from "@/lib/baila-types";

/** Shared settings query + optimistic patch mutation used across settings pages. */
export function useSettings() {
  const { user } = useSession();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["settings", user?.id],
    enabled: !!user,
    queryFn: () => fetchSettings(user!.id),
  });

  const patch = useMutation({
    mutationFn: (next: Partial<Omit<UserSettings, "user_id">>) => saveSettings(user!.id, next),
    onMutate: async (next) => {
      await qc.cancelQueries({ queryKey: ["settings", user?.id] });
      const prev = qc.getQueryData<UserSettings>(["settings", user?.id]);
      if (prev) qc.setQueryData(["settings", user?.id], { ...prev, ...next });
      return { prev };
    },
    onError: (_err, _next, ctx) => {
      if (ctx?.prev) qc.setQueryData(["settings", user?.id], ctx.prev);
      toast.error("Couldn't save that change. Try again.");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings", user?.id] });
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  return {
    userId: user?.id,
    settings: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    update: patch.mutate,
    isSaving: patch.isPending,
  };
}
