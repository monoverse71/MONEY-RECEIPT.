import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/hooks/useAuth";

/**
 * Rendered as a sibling to ReceiptPage (see App.tsx), never inside it -
 * ReceiptPage.tsx itself is not modified. Fixed-position so it doesn't
 * affect ReceiptPage's own layout, and reuses the existing .no-print
 * utility class so it's hidden during printing like other UI chrome.
 */
export function LogoutButton() {
  const { user, logout } = useAuth();

  return (
    <div className="no-print fixed right-4 top-4 z-50 flex items-center gap-2 rounded-md border bg-white px-3 py-1.5 text-xs shadow-sm">
      {user?.email && <span className="text-muted-foreground">{user.email}</span>}
      <Button type="button" size="sm" variant="ghost" onClick={() => logout()}>
        <LogOut /> Logout
      </Button>
    </div>
  );
}
