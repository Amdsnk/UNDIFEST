import { useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { Link } from "wouter";

export function HowItWorksNotif() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-[80px] left-1/2 -translate-x-1/2 max-w-undifest w-full px-4 z-40">
      <Link href="/how-it-works">
        {/* How it works button: smaller height on mobile (py-2.5), original on desktop (py-4) */}
        <div className="bg-gradient-to-r from-[#00D4FF] to-[#7FFF00] rounded-2xl px-6 py-2.5 md:py-4 flex items-center justify-between shadow-lg cursor-pointer hover-elevate">
          <div className="flex items-center gap-3">
            <ArrowRight className="w-6 h-6 text-black" />
            <span className="text-black text-lg font-bold">How it works</span>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsVisible(false);
            }}
            data-testid="button-close-notif"
            className="hover-elevate p-1 rounded-lg"
          >
            <X className="w-6 h-6 text-black" />
          </button>
        </div>
      </Link>
    </div>
  );
}
