declare global {
  interface Window {
    FlutterwaveCheckout?: (options: Record<string, unknown>) => void;
  }
}

let flutterwaveScriptPromise: Promise<void> | null = null;

export function loadFlutterwaveScript(): Promise<void> {
  if (flutterwaveScriptPromise) return flutterwaveScriptPromise;

  flutterwaveScriptPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("Not in browser"));
    if (window.FlutterwaveCheckout) return resolve();

    const existing = document.querySelector('script[src="https://checkout.flutterwave.com/v3.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Flutterwave script")));
      return;
    }

    const s = document.createElement("script");
    s.src = "https://checkout.flutterwave.com/v3.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Flutterwave script"));
    document.head.appendChild(s);
  });

  return flutterwaveScriptPromise;
}

export type FlutterwaveInlineParams = {
  publicKey: string;
  txRef: string;
  amount: number;
  currency: "RWF";
  customer: {
    email: string;
    name?: string;
    phone_number?: string;
  };
  paymentOptions?: string; // e.g. "card,mobilemoney"
  customizations?: {
    title?: string;
    description?: string;
    logo?: string;
  };
};

export async function openFlutterwaveInline(params: FlutterwaveInlineParams): Promise<{ transactionId: number } | null> {
  await loadFlutterwaveScript();

  if (!window.FlutterwaveCheckout) throw new Error("FlutterwaveCheckout is not available");

  return await new Promise((resolve) => {
    window.FlutterwaveCheckout!({
      public_key: params.publicKey,
      tx_ref: params.txRef,
      amount: params.amount,
      currency: params.currency,
      payment_options: params.paymentOptions ?? "card,mobilemoney",
      customer: params.customer,
      customizations: {
        title: params.customizations?.title ?? "iwanyu",
        description: params.customizations?.description ?? "Marketplace payment",
        logo: params.customizations?.logo,
      },
      callback: (response: { transaction_id?: number }) => {
        if (typeof response?.transaction_id === "number") {
          resolve({ transactionId: response.transaction_id });
        } else {
          resolve(null);
        }
      },
      onclose: () => resolve(null),
    });
  });
}
