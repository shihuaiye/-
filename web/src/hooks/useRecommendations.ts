import { useCallback, useState } from "react";
import { api } from "../services/api.ts";
import type { Product } from "../types";

export function useRecommendations(authHeaders: () => HeadersInit) {
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [recommendReason, setRecommendReason] = useState("为你精选校园好物");

  const loadRecommendations = useCallback(async () => {
    const json = await api.recommendations.list(authHeaders());
    if (!json.success) return;
    setRecommendations(json.data.items);
    setRecommendReason(json.data.reason);
  }, [authHeaders]);

  return { recommendations, recommendReason, loadRecommendations };
}
