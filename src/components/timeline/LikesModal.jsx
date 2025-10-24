import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { PostInteraction } from '@/api/entities';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Heart } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

export default function LikesModal({ isOpen, onOpenChange, postId }) {
  const [likers, setLikers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && postId) {
      const fetchLikers = async () => {
        setIsLoading(true);
        try {
          const interactions = await PostInteraction.filter(
            { post_id: postId, interaction_type: 'like' },
            '-created_date'
          );
          setLikers(interactions || []);
        } catch (error) {
          console.error("Erro ao buscar quem curtiu:", error);
          setLikers([]);
        } finally {
          setIsLoading(false);
        }
      };

      fetchLikers();
    }
  }, [isOpen, postId]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[90%] rounded-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Curtidas
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <LoadingSpinner text="Carregando..." />
          ) : likers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Ninguém curtiu esta publicação ainda.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {likers.map((like) => (
                <li key={like.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50">
                  <Avatar>
                    <AvatarImage src={like.user_photo_url} />
                    <AvatarFallback className="bg-orange-100 text-orange-600">
                      {like.user_name ? like.user_name.substring(0, 2).toUpperCase() : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-gray-800">{like.user_name || 'Usuário'}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}