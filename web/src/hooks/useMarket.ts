import { useMemo, useState } from "react";
import type { Category, Product } from "../types";
import { PAGE_SIZE, distanceKm, getProductLocation } from "../utils.ts";

export function useMarket(
  marketProducts: Product[],
  userLocation: { latitude: number; longitude: number } | null,
) {
  const [keyword, setKeyword] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all");
  const [sortBy, setSortBy] = useState<
    "default" | "distance" | "price-asc" | "price-desc" | "time"
  >("time");
  const [page, setPage] = useState(1);

  const filteredMarket = useMemo(() => {
    const byKeyword = marketProducts.filter((p) =>
      `${p.title}${p.description}${p.campus}`
        .toLowerCase()
        .includes(keyword.toLowerCase()),
    );
    let result =
      categoryFilter === "all"
        ? byKeyword
        : byKeyword.filter((p) => p.category === categoryFilter);
    if (sortBy === "price-asc") {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      result = [...result].sort((a, b) => b.price - a.price);
    } else if (sortBy === "time") {
      result = [...result].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    } else if (sortBy === "distance" && userLocation) {
      result = [...result].sort((a, b) => {
        const locA = getProductLocation(a);
        const locB = getProductLocation(b);
        if (!locA && !locB) return 0;
        if (!locA) return 1;
        if (!locB) return -1;
        return distanceKm(userLocation, locA) - distanceKm(userLocation, locB);
      });
    }
    return result;
  }, [marketProducts, keyword, categoryFilter, sortBy, userLocation]);

  const pagedMarket = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredMarket.slice(start, start + PAGE_SIZE);
  }, [filteredMarket, page]);

  const pageCount = Math.max(1, Math.ceil(filteredMarket.length / PAGE_SIZE));

  return {
    keyword,
    setKeyword,
    categoryFilter,
    setCategoryFilter,
    sortBy,
    setSortBy,
    page,
    setPage,
    filteredMarket,
    pagedMarket,
    pageCount,
  };
}
