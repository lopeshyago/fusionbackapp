import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Target, Users, Heart } from 'lucide-react';

const achievementIcons = {
  checkin_streak: Trophy,
  workout_completed: Target,
  assessment_milestone: Star,
  social_engagement: Heart,
  custom: Users
};

const achievementColors = {
  checkin_streak: 'from-yellow-400 to-yellow-600',
  workout_completed: 'from-green-400 to-green-600', 
  assessment_milestone: 'from-blue-400 to-blue-600',
  social_engagement: 'from-pink-400 to-pink-600',
  custom: 'from-purple-400 to-purple-600'
};

export default function AchievementCard({ achievement }) {
  const Icon = achievementIcons[achievement.type] || Trophy;
  const bgGradient = achievementColors[achievement.type] || 'from-yellow-400 to-yellow-600';

  return (
    <Card className={`bg-gradient-to-r ${bgGradient} text-white border-0 shadow-lg mt-3`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 rounded-full p-3">
            <Icon className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-lg">🎉 Conquista Desbloqueada!</h3>
            </div>
            <h4 className="font-semibold text-white/90">{achievement.title}</h4>
            <p className="text-white/80 text-sm">{achievement.description}</p>
            {achievement.points && (
              <Badge className="bg-white/20 text-white border-white/30 mt-2">
                +{achievement.points} pontos
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}