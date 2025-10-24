import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bookmark, Heart, MessageCircle, ArrowLeft, Trash2, Calendar } from 'lucide-react';
import { PostInteraction } from '@/api/entities';
import { Post } from '@/api/entities';
import { User } from '@/api/entities';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import BottomNavBar from '../components/student/BottomNavBar';

export default function SavedPosts() {
  const [savedPosts, setSavedPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSavedPosts = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);

      // Buscar interações de save do usuário
      const saveInteractions = await PostInteraction.filter({
        user_id: user.id,
        interaction_type: 'save'
      }, '-created_date');

      // Buscar os posts salvos
      const postsData = [];
      for (const interaction of saveInteractions) {
        try {
          const posts = await Post.filter({ id: interaction.post_id });
          if (posts.length > 0) {
            const post = posts[0];
            // Buscar autor do post
            const authors = await User.filter({ id: post.author_id });
            if (authors.length > 0) {
              postsData.push({
                ...post,
                author: authors[0],
                saved_at: interaction.created_date
              });
            }
          }
        } catch (error) {
          console.error(`Erro ao carregar post ${interaction.post_id}:`, error);
        }
      }

      setSavedPosts(postsData);
    } catch (error) {
      console.error('Erro ao carregar posts salvos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSavedPosts();
  }, []);

  const handleUnsave = async (postId) => {
    try {
      // Encontrar a interação de save e removê-la
      const interactions = await PostInteraction.filter({
        post_id: postId,
        user_id: currentUser.id,
        interaction_type: 'save'
      });
      
      if (interactions.length > 0) {
        await PostInteraction.delete(interactions[0].id);
        // Remover da lista local
        setSavedPosts(prev => prev.filter(post => post.id !== postId));
      }
    } catch (error) {
      console.error('Erro ao remover post salvo:', error);
    }
  };

  const formatPostTime = (dateString) => {
    try {
      const date = new Date(dateString);
      const brasiliaDate = new Date(date.getTime() - (3 * 60 * 60 * 1000));
      return format(brasiliaDate, "dd MMM 'às' HH:mm", { locale: ptBR });
    } catch (error) {
      return 'Data inválida';
    }
  };

  const getAuthorBadge = (userType) => {
    const badges = {
      student: { label: 'Aluno', color: 'bg-blue-100 text-blue-800' },
      instructor: { label: 'Instrutor', color: 'bg-green-100 text-green-800' },
      admin: { label: 'Admin', color: 'bg-purple-100 text-purple-800' }
    };
    return badges[userType] || badges.student;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-200 border-t-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando posts salvos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 h-16">
            <Link to={createPageUrl('Timeline')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Posts Salvos</h1>
              <p className="text-sm text-gray-500">{savedPosts.length} posts salvos</p>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <div className="container mx-auto py-4 px-2 sm:px-4">
        <div className="max-w-lg mx-auto space-y-6">
          {savedPosts.length === 0 ? (
            <div className="text-center py-12">
              <Bookmark className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum post salvo</h3>
              <p className="text-gray-500 mb-4">
                Quando você salvar posts interessantes, eles aparecerão aqui.
              </p>
              <Link to={createPageUrl('Timeline')}>
                <Button className="bg-orange-500 hover:bg-orange-600">
                  Explorar Timeline
                </Button>
              </Link>
            </div>
          ) : (
            savedPosts.map((post) => {
              const authorBadge = getAuthorBadge(post.author?.user_type);
              
              return (
                <Card key={post.id} className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={post.author?.profile_photo_url} />
                          <AvatarFallback className="bg-orange-100 text-orange-700">
                            {post.author?.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-800">{post.author?.full_name}</p>
                            <Badge className={`text-xs ${authorBadge.color}`}>
                              {authorBadge.label}
                            </Badge>
                          </div>
                          <div className="flex items-center text-xs text-gray-500 gap-1">
                            <Calendar className="h-3 w-3" />
                            Salvo em {formatPostTime(post.saved_at)}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleUnsave(post.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    {post.content && (
                      <p className="text-gray-800 mb-4 text-sm">{post.content}</p>
                    )}
                    
                    {post.media_url && (
                      <div className="rounded-lg overflow-hidden bg-gray-100 mb-4">
                        {post.media_type === 'video' ? (
                          <video controls className="w-full max-h-64 object-cover">
                            <source src={post.media_url} type="video/mp4" />
                          </video>
                        ) : (
                          <img
                            src={post.media_url}
                            alt="Post media"
                            className="w-full max-h-64 object-cover"
                          />
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{post.likes_count || 0} curtidas</span>
                      <span>Postado em {formatPostTime(post.created_date)}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {currentUser?.user_type === 'student' && <BottomNavBar activePage="SavedPosts" />}
    </div>
  );
}