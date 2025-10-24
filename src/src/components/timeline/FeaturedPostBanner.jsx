import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Star } from 'lucide-react';

export default function FeaturedPostBanner({ featuredInfo }) {
  if (!featuredInfo) return null;

  return (
    <Card className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-white border-0 shadow-lg mb-3">
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 rounded-full p-2">
            <Crown className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-white/20 text-white border-white/30">
                <Star className="h-3 w-3 mr-1" />
                {featuredInfo.reason}
              </Badge>
            </div>
            <p className="text-white/90 text-sm mt-1">
              {featuredInfo.message || "Destacado pela equipe de instrutores"}
            </p>
            <p className="text-white/70 text-xs mt-1">
              Por: {featuredInfo.featured_by_name}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}