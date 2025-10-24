import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, 
  Play, MapPin, Calendar, Trophy, Target 
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function PostCard({ 
  post, 
  author, 
  authorCondominium, 
  currentUser, 
  userInteractions, 
  onInteraction, 
  onUpdate 
}) {
  const [imageError, setImageError] = useState(false);
  
  // Verificar se o usuário atual já interagiu
  const hasLiked = userInteractions.some(i => i.post_id === post.id && i.interaction_type === 'like');
  const hasSaved = userInteractions.some(i => i.post_id === post.id && i.interaction_type === 'save');

  // Função para obter iniciais do nome
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ')
      .slice(0, 2)
      .map(word => word.charAt(0).toUpperCase())
      .join('');
  };

  // Função para obter cor do tipo de post
  const getPostTypeColor = (type) => {
    const colors = {
      regular: 'bg-blue-100 text-blue-700',
      workout: 'bg-green-100 text-green-700',
      achievement: 'bg-yellow-100 text-yellow-700',
      announcement: 'bg-red-100 text-red-700'
    };
    return colors[type] || colors.regular;
  };

  // Função para obter ícone do tipo de post
  const getPostTypeIcon = (type) => {
    const icons = {
      regular: MessageCircle,
      workout: Target,
      achievement: Trophy,
      announcement: Calendar
    };
    const IconComponent = icons[type] || MessageCircle;
    return <IconComponent className="h-3 w-3" />;
  };

  // Função para obter texto do tipo de usuário
  const getUserTypeText = (userType) => {
    const types = {
      student: 'Aluno',
      instructor: 'Instrutor',
      admin: 'Administrador'
    };
    return types[userType] || 'Usuário';
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-white shadow-lg border border-orange-200 hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Avatar className="h-12 w-12 ring-2 ring-orange-200">
              <AvatarImage 
                src={author?.profile_photo_url} 
                alt={author?.full_name}
                onError={() => setImageError(true)}
              />
              <AvatarFallback className="bg-orange-100 text-orange-700 font-semibold">
                {getInitials(author?.full_name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-gray-900 truncate">
                  {author?.full_name || 'Usuário Desconhecido'}
                </h3>
                <Badge variant="outline" className="text-xs bg-orange-50 border-orange-200 text-orange-700">
                  {getUserTypeText(author?.user_type)}
                </Badge>
              </div>
              
              {authorCondominium && (
                <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{authorCondominium.name}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge className={`text-xs ${getPostTypeColor(post.post_type)}`}>
                  {getPostTypeIcon(post.post_type)}
                  <span className="ml-1">
                    {post.post_type === 'regular' && 'Publicação'}
                    {post.post_type === 'workout' && 'Treino'}
                    {post.post_type === 'achievement' && 'Conquista'}
                    {post.post_type === 'announcement' && 'Anúncio'}
                  </span>
                </Badge>
                
                <span className="text-xs text-gray-500">
                  {format(new Date(post.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
            </div>
          </div>
          
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        {/* Conteúdo do Post */}
        {post.content && (
          <p className="text-gray-800 mb-4 leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>
        )}

        {/* Mídia do Post */}
        {post.media_url && !imageError && (
          <div className="mb-4 rounded-lg overflow-hidden bg-gray-100">
            {post.media_type === 'video' ? (
              <div className="relative">
                <video 
                  controls 
                  className="w-full max-h-96 object-contain"
                  poster={post.thumbnail_url}
                >
                  <source src={post.media_url} type="video/mp4" />
                  Seu navegador não suporta vídeo.
                </video>
              </div>
            ) : (
              <img 
                src={post.media_url} 
                alt="Post media" 
                className="w-full max-h-96 object-contain"
                onError={() => setImageError(true)}
              />
            )}
          </div>
        )}

        {/* Tags do Post */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {post.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs bg-blue-50 text-blue-700">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Botões de Interação */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onInteraction(post.id, 'like')}
              className={`gap-2 ${hasLiked ? 'text-red-600 bg-red-50' : 'text-gray-600 hover:text-red-600'}`}
            >
              <Heart className={`h-4 w-4 ${hasLiked ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium">{post.likes_count || 0}</span>
            </Button>
            
            <Button variant="ghost" size="sm" className="gap-2 text-gray-600 hover:text-blue-600">
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm font-medium">{post.comments_count || 0}</span>
            </Button>
            
            <Button variant="ghost" size="sm" className="gap-2 text-gray-600 hover:text-green-600">
              <Share2 className="h-4 w-4" />
              <span className="text-sm font-medium">{post.shares_count || 0}</span>
            </Button>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onInteraction(post.id, 'save')}
            className={`${hasSaved ? 'text-orange-600 bg-orange-50' : 'text-gray-600 hover:text-orange-600'}`}
          >
            <Bookmark className={`h-4 w-4 ${hasSaved ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}