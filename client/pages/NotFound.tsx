import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AMeetraLogo } from "@/components/AMeetraLogo";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-pink-50 to-orange-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-pink-300 to-rose-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-orange-300 to-amber-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="relative text-center max-w-md mx-auto">
        <div className="inline-flex items-center justify-center mb-6">
          <AMeetraLogo size={64} />
        </div>
        <h1 className="text-7xl font-bold text-slate-900 mb-4">404</h1>
        <p className="text-xl text-slate-700 mb-4 font-semibold">
          Page not found
        </p>
        <p className="text-slate-600 mb-8 flex items-center justify-center gap-1 flex-wrap">
          <Heart className="w-4 h-4 text-rose-500" />
          This page doesn't exist. Let's find you the right connection!
          <Heart className="w-4 h-4 text-rose-500" />
        </p>

        <Link to="/">
          <Button className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <ArrowLeft className="w-5 h-5" />
            Back to aMeetRa
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
