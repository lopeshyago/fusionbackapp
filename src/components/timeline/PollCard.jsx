import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Users, Clock } from 'lucide-react';
import { Poll } from '@/api/entities';
import { PollVote } from '@/api/entities';
import { format, differenceInHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function PollCard({ poll, currentUser, onVote }) {
  const [votes, setVotes] = useState([]);
  const [userVote, setUserVote] = useState(null);
  const [pollData, setPollData] = useState(poll);

  const loadVotes = useCallback(async () => {
    try {
      const pollVotes = await PollVote.filter({ poll_id: poll.id });
      setVotes(pollVotes);
      
      const currentUserVote = pollVotes.find(v => v.user_id === currentUser?.id);
      setUserVote(currentUserVote);
      
      // Atualizar contadores
      const updatedOptions = [...poll.options];
      updatedOptions.forEach((option, index) => {
        option.votes = pollVotes.filter(v => v.option_index === index).length;
      });
      setPollData({ ...poll, options: updatedOptions });
    } catch (error) {
      console.error('Erro ao carregar votos:', error);
    }
  }, [poll.id, poll.options, currentUser?.id]);

  useEffect(() => {
    loadVotes();
  }, [loadVotes]);

  const handleVote = async (optionIndex) => {
    if (userVote && !poll.allow_multiple) return;

    try {
      await PollVote.create({
        poll_id: poll.id,
        user_id: currentUser.id,
        option_index: optionIndex
      });
      
      await loadVotes();
      onVote?.();
    } catch (error) {
      console.error('Erro ao votar:', error);
    }
  };

  const totalVotes = votes.length;
  const isExpired = new Date() > new Date(poll.expires_at);
  const hoursLeft = differenceInHours(new Date(poll.expires_at), new Date());

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 mt-3">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Enquete
        </CardTitle>
        <p className="text-blue-700 font-medium">{poll.question}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {pollData.options.map((option, index) => {
            const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
            const hasVoted = userVote?.option_index === index;

            return (
              <div key={index} className="relative">
                <Button
                  variant={hasVoted ? "default" : "outline"}
                  className={`w-full justify-between h-auto p-3 ${
                    hasVoted 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'border-blue-300 text-blue-700 hover:bg-blue-100'
                  }`}
                  onClick={() => !isExpired && handleVote(index)}
                  disabled={isExpired}
                >
                  <span className="text-left flex-1">{option.text}</span>
                  {totalVotes > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {option.votes} ({percentage.toFixed(0)}%)
                    </Badge>
                  )}
                </Button>
                {totalVotes > 0 && (
                  <div 
                    className="absolute bottom-0 left-0 h-1 bg-blue-500 rounded-b transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-sm text-blue-600 pt-2 border-t border-blue-200">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{totalVotes} votos</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>
              {isExpired 
                ? 'Encerrada' 
                : hoursLeft > 24 
                  ? `${Math.ceil(hoursLeft / 24)} dias restantes`
                  : `${hoursLeft}h restantes`
              }
            </span>
          </div>
        </div>

        {poll.allow_multiple && !isExpired && (
          <p className="text-xs text-blue-600 text-center">
            ✨ Você pode escolher múltiplas opções
          </p>
        )}
      </CardContent>
    </Card>
  );
}