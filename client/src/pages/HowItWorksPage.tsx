import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Footer } from "@/components/Footer";
import type { HowItWorks } from "@shared/schema";

export default function HowItWorksPage() {
  const { data: howItWorks, isLoading } = useQuery<HowItWorks[]>({
    queryKey: ["/api/how-it-works"],
  });

  const activeSteps = howItWorks
    ?.filter(item => item.isActive)
    .sort((a, b) => a.step - b.step) || [];

  return (
    <div className="min-h-screen bg-[#ffffff]">
      <div className="max-w-undifest mx-auto pb-20">
        <MobileHeader />

        {/* Content */}
        <div className="px-4 py-6 bg-[#16202a] min-h-screen">
          <h2 className="text-xl font-bold text-white mb-4">Cara Kerja</h2>
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-32 bg-gray-800/50 rounded-xl animate-pulse" />
              <div className="h-32 bg-gray-800/50 rounded-xl animate-pulse" />
              <div className="h-32 bg-gray-800/50 rounded-xl animate-pulse" />
              <div className="h-32 bg-gray-800/50 rounded-xl animate-pulse" />
            </div>
          ) : activeSteps.length > 0 ? (
            <div className="space-y-6">
              {activeSteps.map((item) => (
                <Card
                  key={item.id}
                  className="bg-[#1e2a35] border-gray-700 overflow-hidden shadow-sm"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Step Number/Icon */}
                      <div className="flex-shrink-0 w-20 h-20 bg-gradient-to-br from-[#00D4FF] to-[#0099CC] rounded-xl flex items-center justify-center shadow-lg">
                        {item.iconUrl ? (
                          <img
                            src={item.iconUrl}
                            alt={`Step ${item.step}`}
                            className="w-12 h-12 object-contain"
                          />
                        ) : (
                          <span className="text-white text-3xl font-bold">{item.step}</span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[#00D4FF] text-sm font-semibold">
                            Langkah {item.step}
                          </span>
                        </div>
                        <h3 className="text-white font-bold text-xl mb-3">
                          {item.title}
                        </h3>
                        <p className="text-gray-300 text-base leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                <span className="text-4xl">📋</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Belum Ada Informasi
              </h3>
              <p className="text-gray-400">
                Informasi cara kerja akan segera ditambahkan
              </p>
            </div>
          )}
        </div>

        <MobileBottomNav />
        <Footer />
      </div>
    </div>
  );
}

