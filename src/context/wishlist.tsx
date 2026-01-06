/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useAuth } from "@/context/auth";

type WishlistContextValue = {
  productIds: string[];
  count: number;
  contains: (productId: string) => boolean;
  toggle: (productId: string) => Promise<{ added: boolean }>;
  refresh: () => Promise<void>;
};

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

const STORAGE_KEY = "iwanyu:wishlist";

function readLocalWishlist(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x) => typeof x === "string").map(String);
  } catch {
    return [];
  }
}

function writeLocalWishlist(productIds: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(productIds));
  } catch {
    // ignore
  }
}

function uniq(list: string[]): string[] {
  return Array.from(new Set(list.filter(Boolean)));
}

type DbWishlistRow = {
  product_id: string;
};

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const supabase = getSupabaseClient();
  const { user } = useAuth();

  const [productIds, setProductIds] = useState<string[]>([]);
  const hydratedForUserIdRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user || !supabase) {
      hydratedForUserIdRef.current = null;
      setProductIds(uniq(readLocalWishlist()));
      return;
    }

    const localIds = uniq(readLocalWishlist());

    const { data, error } = await supabase
      .from("wishlist_items")
      .select("product_id")
      .eq("user_id", user.id);

    if (error) {
      hydratedForUserIdRef.current = user.id;
      setProductIds(localIds);
      return;
    }

    const remoteIds = uniq(((data ?? []) as DbWishlistRow[]).map((r) => r.product_id));
    const merged = uniq([...remoteIds, ...localIds]);

    // Best-effort: push any local wishlist items into the DB then clear local.
    if (localIds.length > 0) {
      await supabase
        .from("wishlist_items")
        .upsert(localIds.map((pid) => ({ user_id: user.id, product_id: pid })), {
          onConflict: "user_id,product_id",
        });
      writeLocalWishlist([]);
    }

    hydratedForUserIdRef.current = user.id;
    setProductIds(merged);
  }, [user, supabase]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Persist to localStorage when logged out.
  useEffect(() => {
    if (user) return;
    writeLocalWishlist(productIds);
  }, [productIds, user]);

  const contains = useCallback((productId: string) => productIds.includes(productId), [productIds]);

  const toggle = useCallback(
    async (productId: string) => {
      const currentlyInWishlist = productIds.includes(productId);

      // Optimistic update
      setProductIds((prev) => (currentlyInWishlist ? prev.filter((id) => id !== productId) : uniq([...prev, productId])));

      if (!user || !supabase) {
        return { added: !currentlyInWishlist };
      }

      // Ensure we've hydrated at least once for this user
      if (hydratedForUserIdRef.current !== user.id) {
        await refresh();
      }

      if (currentlyInWishlist) {
        const { error } = await supabase
          .from("wishlist_items")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", productId);
        if (error) {
          // Revert
          setProductIds((prev) => uniq([...prev, productId]));
          throw error;
        }
        return { added: false };
      }

      const { error } = await supabase
        .from("wishlist_items")
        .upsert({ user_id: user.id, product_id: productId }, { onConflict: "user_id,product_id" });

      if (error) {
        // Revert
        setProductIds((prev) => prev.filter((id) => id !== productId));
        throw error;
      }

      return { added: true };
    },
    [productIds, refresh, supabase, user]
  );

  const value: WishlistContextValue = useMemo(
    () => ({
      productIds,
      count: productIds.length,
      contains,
      toggle,
      refresh,
    }),
    [contains, productIds, refresh, toggle]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
