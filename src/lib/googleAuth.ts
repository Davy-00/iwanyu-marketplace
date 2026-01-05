import type { AuthUser } from "@/context/auth";

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

type GoogleCredentialResponse = {
  credential: string;
};

type GoogleId = {
  initialize: (options: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void;
  renderButton: (
    element: HTMLElement,
    options: {
      theme?: "outline" | "filled_blue" | "filled_black";
      size?: "large" | "medium" | "small";
      width?: number;
      text?: "signin_with" | "signup_with" | "continue_with" | "signin";
      shape?: "rectangular" | "pill" | "circle" | "square";
    }
  ) => void;
};

type GoogleIdentity = {
  accounts: {
    id: GoogleId;
  };
};

const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src='${GOOGLE_SCRIPT_SRC}']`) as HTMLScriptElement | null;
    if (existing) {
      if (existing.dataset.loaded === "true") return resolve();
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Google script")));
      return;
    }

    const script = document.createElement("script");
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", () => {
      script.dataset.loaded = "true";
      resolve();
    });
    script.addEventListener("error", () => reject(new Error("Failed to load Google script")));
    document.head.appendChild(script);
  });
}

function decodeJwtPayload(token: string): unknown {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const json = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => `%${("00" + c.charCodeAt(0).toString(16)).slice(-2)}`)
      .join("")
  );
  return JSON.parse(json) as unknown;
}

function readString(obj: unknown, key: string): string | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  const value = (obj as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}

export async function renderGoogleButton(params: {
  element: HTMLElement;
  clientId: string;
  onSuccess: (user: AuthUser) => void;
  onError?: (err: Error) => void;
}) {
  const { element, clientId, onSuccess, onError } = params;

  try {
    await loadScript();

    if (!window.google?.accounts?.id) {
      throw new Error("Google Identity Services not available");
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        try {
          const payload = decodeJwtPayload(response.credential);
          const user: AuthUser = {
            id: readString(payload, "sub") ?? "google",
            name: readString(payload, "name"),
            email: readString(payload, "email"),
            picture: readString(payload, "picture"),
          };
          onSuccess(user);
        } catch (e) {
          onError?.(e instanceof Error ? e : new Error(String(e)));
        }
      },
    });

    element.innerHTML = "";
    window.google.accounts.id.renderButton(element, {
      theme: "outline",
      size: "large",
      width: 320,
      text: "signin_with",
      shape: "pill",
    });
  } catch (e) {
    onError?.(e instanceof Error ? e : new Error(String(e)));
  }
}
