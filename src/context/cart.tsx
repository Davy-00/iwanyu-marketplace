/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useAuth } from "@/context/auth";

export type CartItem = {
  productId: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

type DbCartRow = {
  buyer_user_id: string;
  items: unknown;
};

function normalizeItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((x) => x as Partial<CartItem>)
    .filter((x) => typeof x.productId === "string")
    .map((x) => ({
      productId: String(x.productId),
      title: String(x.title ?? ""),
      price: Number(x.price ?? 0),
      image: String(x.image ?? ""),
      quantity: Math.max(1, Number(x.quantity ?? 1)),
    }));
}

function mergeItems(local: CartItem[], remote: CartItem[]): CartItem[] {
  if (local.length === 0) return remote;
  if (remote.length === 0) return local;

  const byId = new Map<string, CartItem>();
  for (const item of remote) byId.set(item.productId, item);
  for (const item of local) {
    const existing = byId.get(item.productId);
    if (!existing) byId.set(item.productId, item);
    else byId.set(item.productId, { ...existing, quantity: existing.quantity + item.quantity });
  }
  return Array.from(byId.values());
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const supabase = getSupabaseClient();
  const { user } = useAuth();

  const [items, setItems] = useState<CartItem[]>([]);
  const [hydratedForUserId, setHydratedForUserId] = useState<string | null>(null);
  const lastSavedJsonRef = useRef<string>("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!supabase || !user) {
        setItems([]);
        setHydratedForUserId(null);
        return;
      }

      const currentUserId = user.id;
      setHydratedForUserId(null);

      const { data, error } = await supabase
        .from("carts")
        .select("buyer_user_id, items")
        .eq("buyer_user_id", currentUserId)
        .maybeSingle();

      if (cancelled) return;
      if (error) {
        // If cart table isn't migrated yet or RLS blocks, don't break the app.
        setHydratedForUserId(currentUserId);
        return;
      }

      const remoteItems = normalizeItems((data as DbCartRow | null)?.items);
      setItems((prev) => mergeItems(prev, remoteItems));
      setHydratedForUserId(currentUserId);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [supabase, user]);

  useEffect(() => {
    async function save() {
      if (!supabase || !user) return;
      if (hydratedForUserId !== user.id) return;

      const json = JSON.stringify(items);
      if (json === lastSavedJsonRef.current) return;
      lastSavedJsonRef.current = json;

      await supabase.from("carts").upsert({
        buyer_user_id: user.id,
        items,
        updated_at: new Date().toISOString(),
      });
    }

    void save();
  }, [items, supabase, user, hydratedForUserId]);

  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items]);

  const value: CartContextValue = useMemo(
    () => ({
      items,
      itemCount,
      subtotal,
      addItem: (item, quantity = 1) => {
        setItems((prev) => {
          const existing = prev.find((x) => x.productId === item.productId);
          if (existing) {
            return prev.map((x) =>
              x.productId === item.productId ? { ...x, quantity: x.quantity + Math.max(1, quantity) } : x
            );
          }
          return [...prev, { ...item, quantity: Math.max(1, quantity) }];
        });
      },
      removeItem: (productId) => setItems((prev) => prev.filter((x) => x.productId !== productId)),
      setQuantity: (productId, quantity) =>
        setItems((prev) =>
          prev
            .map((x) => (x.productId === productId ? { ...x, quantity: Math.max(1, quantity) } : x))
            .filter((x) => x.quantity > 0)
        ),
      clear: () => setItems([]),
    }),
    [items, itemCount, subtotal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
