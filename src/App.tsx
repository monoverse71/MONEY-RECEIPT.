import ReceiptPage from "@/pages/ReceiptPage";
import { AuthProvider, useAuth } from "@/features/auth/hooks/useAuth";
import { LoginPanel } from "@/features/auth/components/LoginPanel";
import { LogoutButton } from "@/features/auth/components/LogoutButton";

function AppGate() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPanel />;
  }

  return (
    <>
      <LogoutButton />
      <ReceiptPage />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppGate />
    </AuthProvider>
  );
}

export default App;
