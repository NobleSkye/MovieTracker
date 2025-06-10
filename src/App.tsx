import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { MovieDashboard } from "./components/MovieDashboard";
import { CalendarView } from "./components/CalendarView";
import { useState, useEffect } from "react";

export default function App() {
  const [currentView, setCurrentView] = useState<"dashboard" | "calendar">("dashboard");
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Simple error boundary effect
    const handleError = (event: ErrorEvent) => {
      console.error('Application error:', event.error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
          <p className="text-gray-600 mb-4">Please try refreshing the page</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-primary">🎬 MovieTracker</h2>
          <Authenticated>
            <nav className="flex gap-2">
              <button
                onClick={() => setCurrentView("dashboard")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  currentView === "dashboard"
                    ? "bg-primary text-white"
                    : "text-gray-600 hover:text-primary"
                }`}
              >
                Discover
              </button>
              <button
                onClick={() => setCurrentView("calendar")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  currentView === "calendar"
                    ? "bg-primary text-white"
                    : "text-gray-600 hover:text-primary"
                }`}
              >
                My Calendar
              </button>
            </nav>
          </Authenticated>
        </div>
        <SignOutButton />
      </header>
      <main className="flex-1 p-4">
        <Content currentView={currentView} />
      </main>
      <Toaster />
    </div>
  );
}

function Content({ currentView }: { currentView: "dashboard" | "calendar" }) {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <Authenticated>
        {currentView === "dashboard" ? <MovieDashboard /> : <CalendarView />}
      </Authenticated>
      
      <Unauthenticated>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-primary mb-4">🎬 MovieTracker</h1>
            <p className="text-xl text-gray-600 mb-2">
              Discover upcoming movies and track your watchlist
            </p>
            <p className="text-gray-500">Sign in to get started</p>
          </div>
          <div className="w-full max-w-md">
            <SignInForm />
          </div>
        </div>
      </Unauthenticated>
    </div>
  );
}
