
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Camera, Heart, MessageCircle, Share2, Plus, Users, TrendingUp, MoreHorizontal, Edit, Trash2, Pin, Send, ChevronDown } from "lucide-react";
import { Post } from "@/api/entities";
import { Comment } from "@/api/entities";
import { CommentInteraction } from "@/api/entities";
import { PostInteraction } from "@/api/entities";
import { User } from "@/api/entities";
import { Condominium } from "@/api/entities";
import CreatePostModal from "../components/timeline/CreatePostModal";
import ShareModal from "../components/timeline/ShareModal";
import LikesModal from "../components/timeline/LikesModal";
import BottomNavBar from "../components/student/BottomNavBar";
import InstructorBottomNavBar from "../components/instructor/InstructorBottomNavBar";
import AdminBottomNavBar from "../components/admin/AdminBottomNavBar";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";

export default function Timeline() {
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [userInteractions, setUserInteractions] = useState([]);
  const [users, setUsers] = useState([]);
  const [condominiums, setCondominiums] = useState([]);
  const [editingPost, setEditingPost] = useState(null);
  const [postToShare, setPostToShare] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [likesModalPostId, setLikesModalPostId] = useState(null);

  // Estados para comentários inline
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentInteractions, setCommentInteractions] = useState([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);

  const loadData = async () => {
    console.log("Carregando dados da timeline...");
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      console.log("Usuário carregado:", currentUser);
      setUser(currentUser);

      let [allPosts, interactions, allUsers, allCondos] = await Promise.all([
        Post.list('-created_date'),
        PostInteraction.list().catch(() => []),
        User.list().catch(() => []),
        Condominium.list().catch(() => [])
      ]);
      
      console.log("Posts carregados:", allPosts);

      // Verificação de posts fixados expirados
      const now = new Date();
      const updates = [];
      if (allPosts) {
        for (const post of allPosts) {
          if (post.is_pinned && post.pinned_until && new Date(post.pinned_until) < now) {
            updates.push(Post.update(post.id, { is_pinned: false, pinned_until: null }));
            post.is_pinned = false;
            post.pinned_until = null;
          }
        }
      }
      
      if (updates.length > 0) {
        await Promise.all(updates);
      }

      // Ordenar: posts fixados primeiro, depois por data de criação
      if (allPosts) {
        allPosts.sort((a, b) => {
          if (a.is_pinned && !b.is_pinned) return -1;
          if (!a.is_pinned && b.is_pinned) return 1;
          return new Date(b.created_date).getTime() - new Date(a.created_date).getTime();
        });
      }

      setPosts(allPosts || []);
      setUsers(allUsers || []);
      setCondominiums(allCondos || []);
      
      const userInteractionsFiltered = (interactions || []).filter(i => i.user_id === currentUser.id);
      setUserInteractions(userInteractionsFiltered);
      
    } catch (error) {
      console.error('Erro ao carregar timeline:', error);
      setPosts([]);
      setUsers([]);
      setCondominiums([]);
      setUserInteractions([]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreatePost = async (postData) => {
    console.log("Tentando criar post:", postData);
    try {
      if (!user) {
        alert('Erro: usuário não encontrado');
        return;
      }

      const newPostData = {
        author_id: user.id,
        author_name: user.full_name,
        author_photo_url: user.profile_photo_url,
        content: postData.content,
        post_type: postData.post_type || 'regular',
        media_url: postData.media_url || null,
        media_type: postData.media_type || null,
        tags: postData.tags || [],
        condominium_id: user.condominium_id || '',
        likes_count: 0,
        comments_count: 0,
        shares_count: 0,
        is_pinned: false
      };

      console.log("Dados do post a serem enviados:", newPostData);
      
      if (editingPost) {
        await Post.update(editingPost.id, newPostData);
        setEditingPost(null);
      } else {
        await Post.create(newPostData);
      }
      
      setShowCreatePost(false);
      await loadData(); 
      
    } catch (error) {
      console.error('Erro detalhado ao criar post:', error);
      alert('Erro ao publicar: ' + error.message);
    }
  };

  const handlePostLike = async (postId) => {
    try {
      if (!user) return;
      
      const existingInteraction = userInteractions.find(i => i.post_id === postId && i.interaction_type === 'like');
      const currentPost = posts.find(p => p.id === postId);
      if (!currentPost) return;

      // Atualizar estado local imediatamente para feedback visual instantâneo
      const newPosts = posts.map(p => {
        if (p.id === postId) {
          if (existingInteraction) {
            return { ...p, likes_count: Math.max(0, (p.likes_count || 0) - 1) };
          } else {
            return { ...p, likes_count: (p.likes_count || 0) + 1 };
          }
        }
        return p;
      });
      setPosts(newPosts);

      // Atualizar interações do usuário local
      if (existingInteraction) {
        setUserInteractions(prev => prev.filter(i => i.id !== existingInteraction.id));
      } else {
        const newInteraction = { 
          id: Date.now(), // ID temporário para o feedback instantâneo
          post_id: postId, 
          user_id: user.id, 
          interaction_type: 'like',
          user_name: user.full_name, // Adicionado para LikesModal
          user_photo_url: user.profile_photo_url // Adicionado para LikesModal
        };
        setUserInteractions(prev => [...prev, newInteraction]);
      }

      // Operações de banco de dados em background (sem bloquear a UI)
      if (existingInteraction) {
        await PostInteraction.delete(existingInteraction.id);
        await Post.update(postId, { likes_count: Math.max(0, (currentPost.likes_count || 0) - 1) });
      } else {
        const createdInteraction = await PostInteraction.create({ 
          post_id: postId, 
          user_id: user.id, 
          interaction_type: 'like',
          user_name: user.full_name, // Adicionado para LikesModal
          user_photo_url: user.profile_photo_url // Adicionado para LikesModal
        });
        // Atualizar com o ID real da interação se a criação for bem-sucedida
        setUserInteractions(prev => 
          prev.map(i => (typeof i.id === 'number') ? { ...i, id: createdInteraction.id } : i)
        );
        await Post.update(postId, { likes_count: (currentPost.likes_count || 0) + 1 });
      }
      
    } catch (error) { 
      console.error('Erro ao curtir post:', error);
      // Em caso de erro, reverter o estado local
      await loadData();
    }
  };

  const handleCommentClick = async (postId) => {
    if (activeCommentPostId === postId) {
      setActiveCommentPostId(null);
      setComments([]);
    } else {
      setActiveCommentPostId(postId);
      setShowAllComments(false);
      setIsLoadingComments(true);
      try {
        const [fetchedComments, fetchedInteractions] = await Promise.all([
          Comment.filter({ post_id: postId }, '-created_date'),
          CommentInteraction.list().catch(() => []) // Refetch all comment interactions to ensure local state is consistent
        ]);
        setComments(fetchedComments || []);
        setCommentInteractions(fetchedInteractions || []);
      } catch (error) {
        console.error("Erro ao carregar comentários:", error);
        setComments([]);
      }
      setIsLoadingComments(false);
    }
  };

  const handleSubmitComment = async (postId) => {
    if (!newCommentText.trim() || isSubmittingComment) return;
    setIsSubmittingComment(true);
    try {
      const createdComment = await Comment.create({
        post_id: postId,
        author_id: user.id,
        author_name: user.full_name, // Adicionado
        author_photo_url: user.profile_photo_url, // Adicionado
        content: newCommentText.trim(),
        likes_count: 0
      });

      const post = posts.find(p => p.id === postId);
      if (post) {
        const newCommentsCount = (post.comments_count || 0) + 1;
        await Post.update(postId, { comments_count: newCommentsCount });
        // Atualiza o estado local do post e dos comentários
        setPosts(posts.map(p => p.id === postId ? { ...p, comments_count: newCommentsCount } : p));
        setComments(prev => [createdComment, ...prev]);
      }
      
      setNewCommentText("");
      
      // Recarregar comentários para o post ativo para garantir consistência
      // Isso ainda é importante caso outros usuários tenham adicionado comentários enquanto o formulário estava aberto.
      const [fetchedComments, fetchedInteractions] = await Promise.all([
        Comment.filter({ post_id: postId }, '-created_date'),
        CommentInteraction.list().catch(() => [])
      ]);
      setComments(fetchedComments || []);
      setCommentInteractions(fetchedInteractions || []);

    } catch (error) {
      console.error("Erro ao enviar comentário:", error);
      alert("Falha ao enviar comentário.");
    }
    setIsSubmittingComment(false);
  };
  
  const handleCommentLike = async (commentId) => {
    if(!user) return;
    try {
      const existingLike = commentInteractions.find(ci => ci.comment_id === commentId && ci.user_id === user.id);
      const comment = comments.find(c => c.id === commentId);
      if(!comment) return;

      // Atualizar estado local dos comentários imediatamente
      const newComments = comments.map(c => {
        if (c.id === commentId) {
          if (existingLike) {
            return { ...c, likes_count: Math.max(0, (c.likes_count || 0) - 1) };
          } else {
            return { ...c, likes_count: (c.likes_count || 0) + 1 };
          }
        }
        return c;
      });
      setComments(newComments);

      // Atualizar interações locais
      let newInteraction;
      if(existingLike) {
        setCommentInteractions(prev => prev.filter(ci => ci.id !== existingLike.id));
      } else {
        newInteraction = { 
          id: Date.now(), // ID temporário para o feedback instantâneo
          comment_id: commentId, 
          user_id: user.id, 
          interaction_type: 'like' 
        };
        setCommentInteractions(prev => [...prev, newInteraction]);
      }

      // Operações de banco em background
      if(existingLike) {
        await CommentInteraction.delete(existingLike.id);
        await Comment.update(commentId, {likes_count: Math.max(0, (comment.likes_count || 0) - 1)});
      } else {
        const createdInteraction = await CommentInteraction.create({ 
          comment_id: commentId, 
          user_id: user.id, 
          interaction_type: 'like' 
        });
        // Atualizar com ID real se a criação for bem-sucedida
        setCommentInteractions(prev => 
          prev.map(i => (typeof i.id === 'number' && newInteraction && i.id === newInteraction.id) ? { ...i, id: createdInteraction.id } : i)
        );
        await Comment.update(commentId, {likes_count: (comment.likes_count || 0) + 1});
      }

    } catch(error) {
      console.error("Erro ao curtir comentário:", error);
      // Recarregar comentários em caso de erro para garantir a consistência
      try {
        // Find the specific comment to get its post_id for reloading comments
        const currentComment = comments.find(c => c.id === commentId);
        if (currentComment) {
          const [fetchedComments, fetchedInteractions] = await Promise.all([
            Comment.filter({ post_id: currentComment.post_id }, '-created_date'),
            CommentInteraction.list().catch(() => [])
          ]);
          setComments(fetchedComments || []);
          setCommentInteractions(fetchedInteractions || []);
        } else {
          // If comment not found (e.g., error during initial fetch), reload all posts data
          await loadData();
        }
      } catch (reloadError) {
        console.error("Erro ao recarregar comentários:", reloadError);
      }
    }
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setShowCreatePost(true);
  };

  const handleDeletePost = async (postId) => {
    if (confirm('Tem certeza que deseja excluir esta publicação?')) {
      try {
        await Post.delete(postId);
        setPosts(posts.filter(p => p.id !== postId)); // Atualiza o estado local
      } catch (error) {
        console.error('Erro ao excluir post:', error);
        alert('Erro ao excluir publicação');
      }
    }
  };
  
  const handleShareClick = (post) => {
    setPostToShare(post);
    setIsShareModalOpen(true);
  };

  const handlePinPost = async (post, duration) => {
    try {
      const pinUntil = addDays(new Date(), duration);
      const updatedPost = await Post.update(post.id, {
        is_pinned: true,
        pinned_until: pinUntil.toISOString()
      });

      // Atualiza o estado local e reordena
      const otherPosts = posts.filter(p => p.id !== post.id);
      const newSortedPosts = [updatedPost, ...otherPosts].sort((a, b) => {
          if (a.is_pinned && !b.is_pinned) return -1;
          if (!a.is_pinned && b.is_pinned) return 1;
          return new Date(b.created_date).getTime() - new Date(a.created_date).getTime();
      });
      setPosts(newSortedPosts);

    } catch (error) {
      console.error('Erro ao fixar post:', error);
      alert('Erro ao fixar publicação');
    }
  };

  const handleUnpinPost = async (post) => {
    try {
      const updatedPost = await Post.update(post.id, {
        is_pinned: false,
        pinned_until: null
      });

      // Atualiza o estado local e reordena
      const newPosts = posts.map(p => p.id === post.id ? updatedPost : p);
      newPosts.sort((a, b) => {
          if (a.is_pinned && !b.is_pinned) return -1;
          if (!a.is_pinned && b.is_pinned) return 1;
          return new Date(b.created_date).getTime() - new Date(a.created_date).getTime();
      });
      setPosts(newPosts);

    } catch (error) {
      console.error('Erro ao desfixar post:', error);
      alert('Erro ao desfixar publicação');
    }
  };

  const getPostAuthor = (authorId) => {
    return users.find(u => u.id === authorId) || { 
      full_name: 'Usuário', 
      email: '',
      profile_photo_url: null 
    };
  };

  const getCondominium = (condominiumId) => {
    return condominiums.find(c => c.id === condominiumId);
  };

  const isStudent = user?.user_type === 'student';
  const isInstructor = user?.user_type === 'instructor';
  const isAdmin = user?.user_type === 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 pb-24">
      {/* Header - Mobile Optimized */}
      <header className="bg-black text-white p-3 shadow-xl sticky top-0 z-40">
        <div className="container mx-auto">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2">
              <Camera className="h-6 w-6" />
              <h1 className="text-lg font-bold">Timeline Fusion</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-3">
        {/* Botão Nova Publicação */}
        <div className="mb-6 mt-4">
          <Button 
            onClick={() => {
              setEditingPost(null);
              setShowCreatePost(true);
            }}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 text-base font-semibold"
            size="lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nova Publicação
          </Button>
        </div>

        {/* Posts Feed - Mobile Optimized */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando publicações...</p>
          </div>
        ) : posts.length === 0 ? (
          <Card className="border-orange-200 text-center py-8">
            <CardContent className="p-4">
              <Camera className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhuma publicação ainda</h3>
              <p className="text-sm text-gray-500 mb-6">
                Que tal compartilhar sua primeira conquista?
              </p>
              <Button 
                onClick={() => setShowCreatePost(true)}
                className="bg-orange-500 hover:bg-orange-600"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Publicação
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => {
              const author = getPostAuthor(post.author_id);
              const condominium = getCondominium(post.condominium_id);
              const isAuthor = user?.id === post.author_id;
              const hasLiked = userInteractions.some(i => i.post_id === post.id && i.interaction_type === 'like');
              
              const authorName = post.author_name || author?.full_name;
              const authorPhoto = post.author_photo_url || author?.profile_photo_url;
              const isAdminPost = author?.user_type === 'admin' || (post.author_id === user?.id && user?.user_type === 'admin');

              return (
                <Card key={post.id} className={`border-orange-200 shadow-lg ${post.is_pinned ? 'bg-orange-50 border-orange-300' : 'bg-white'}`}>
                  <CardHeader className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarImage src={authorPhoto} />
                          <AvatarFallback className="bg-orange-100 text-orange-700 text-sm">
                            {authorName ? authorName.substring(0, 2).toUpperCase() : 'US'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <div className="flex items-center gap-1">
                              {isAdminPost && (
                                <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full font-medium">
                                  Admin
                                </span>
                              )}
                              <h3 className={`font-semibold text-gray-900 text-sm truncate ${
                                isAdminPost ? 'text-orange-600 underline decoration-orange-500 decoration-2 underline-offset-2' : ''
                              }`}>
                                {authorName || 'Usuário'}
                              </h3>
                            </div>
                            {post.is_pinned && (
                              <Badge className="bg-orange-500 text-white text-xs flex items-center gap-1 flex-shrink-0">
                                <Pin className="h-3 w-3" />
                                Fixado
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                            <span>{format(new Date(post.created_date), 'dd/MM HH:mm', { locale: ptBR })}</span>
                            {condominium && (
                              <>
                                <span>•</span>
                                <span className="truncate">{condominium.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {(isAuthor || isAdmin) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            {isAuthor && (
                              <>
                                <DropdownMenuItem onClick={() => handleEditPost(post)} className="text-sm">
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeletePost(post.id)} className="text-red-600 text-sm">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </>
                            )}
                            
                            {/* Admin pode excluir qualquer post, mesmo que não seja o autor */}
                            {isAdmin && !isAuthor && (
                              <DropdownMenuItem onClick={() => handleDeletePost(post.id)} className="text-red-600 text-sm">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir Post
                              </DropdownMenuItem>
                            )}
                            
                            {isAdmin && (
                              <>
                                {(isAuthor || !isAuthor) && <DropdownMenuSeparator />}
                                {post.is_pinned ? (
                                  <DropdownMenuItem onClick={() => handleUnpinPost(post)} className="text-sm">
                                    <Pin className="h-4 w-4 mr-2" />
                                    Desfixar
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuSub>
                                    <DropdownMenuSubTrigger className="text-sm">
                                      <Pin className="h-4 w-4 mr-2" />
                                      Fixar Post
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent>
                                      <DropdownMenuItem onClick={() => handlePinPost(post, 1)} className="text-sm">
                                        Por 1 dia
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handlePinPost(post, 2)} className="text-sm">
                                        Por 2 dias  
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handlePinPost(post, 7)} className="text-sm">
                                        Por 1 semana
                                      </DropdownMenuItem>
                                    </DropdownMenuSubContent>
                                  </DropdownMenuSub>
                                )}
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-3 pt-0">
                    <p className="text-gray-800 mb-3 whitespace-pre-wrap text-sm leading-relaxed">{post.content}</p>
                    
                    {/* Media Display - Mobile Optimized */}
                    {post.media_url && (
                      <div className="mb-3 rounded-lg overflow-hidden bg-gray-100">
                        {post.media_type === 'image' ? (
                          <img 
                            src={post.media_url} 
                            alt="Post media" 
                            className="w-full h-auto max-h-80 object-cover cursor-pointer"
                            loading="lazy"
                          />
                        ) : post.media_type === 'video' ? (
                          <video 
                            src={post.media_url} 
                            controls 
                            className="w-full h-auto max-h-80 object-cover"
                            preload="metadata"
                          />
                        ) : null}
                      </div>
                    )}
                    
                    {/* Tags - Mobile Optimized */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {post.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-orange-600 border-orange-300 text-xs px-2 py-1">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {/* Action Buttons - Mobile Optimized */}
                    <div className="flex items-center gap-1 pt-3 border-t border-gray-100">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`gap-2 px-3 py-2 min-h-[44px] ${hasLiked ? 'text-red-600' : 'text-gray-600'} hover:text-red-600`}
                        onClick={() => handlePostLike(post.id)}
                      >
                        <Heart className={`h-4 w-4 ${hasLiked ? 'fill-current' : ''}`} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-sm text-gray-600 hover:underline px-2 py-2 min-h-[44px]" 
                        onClick={() => setLikesModalPostId(post.id)}
                      >
                        {post.likes_count || 0} curtidas
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="gap-2 px-3 py-2 min-h-[44px] text-gray-600 hover:text-blue-600 flex-1"
                        onClick={() => handleCommentClick(post.id)}
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span className="text-sm">{post.comments_count || 0}</span>
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="gap-2 px-3 py-2 min-h-[44px] text-gray-600 hover:text-green-600 flex-1"
                        onClick={() => handleShareClick(post)}
                      >
                        <Share2 className="h-4 w-4" />
                        <span className="text-sm hidden sm:inline">Compartilhar</span>
                      </Button>
                    </div>

                    {/* SEÇÃO DE COMENTÁRIOS INLINE - Mobile Optimized */}
                    {activeCommentPostId === post.id && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        {/* FORMULÁRIO DE NOVO COMENTÁRIO - Mobile Optimized */}
                        <div className="flex gap-2 mb-4">
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={user?.profile_photo_url} />
                            <AvatarFallback className="bg-orange-100 text-orange-700 text-xs">
                              {user?.full_name?.substring(0, 2) || 'EU'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 flex gap-2">
                            <Textarea
                              placeholder="Escreva um comentário..."
                              value={newCommentText}
                              onChange={(e) => setNewCommentText(e.target.value)}
                              className="min-h-[40px] max-h-32 resize-none text-sm"
                              disabled={isSubmittingComment}
                            />
                            <Button 
                              size="sm" 
                              onClick={() => handleSubmitComment(post.id)} 
                              disabled={!newCommentText.trim() || isSubmittingComment}
                              className="bg-orange-500 hover:bg-orange-600 min-h-[44px] px-3 flex-shrink-0"
                            >
                              <Send className="h-4 w-4"/>
                            </Button>
                          </div>
                        </div>

                        {/* LISTA DE COMENTÁRIOS - Mobile Optimized */}
                        {isLoadingComments ? (
                          <p className="text-center text-sm text-gray-500 py-4">Carregando comentários...</p>
                        ) : comments.length === 0 ? (
                          <p className="text-center text-sm text-gray-500 py-4">Nenhum comentário ainda. Seja o primeiro!</p>
                        ) : (
                          <div className="space-y-3">
                            {comments.slice(0, showAllComments ? comments.length : 2).map(comment => {
                              const commentAuthor = getPostAuthor(comment.author_id);
                              const hasLikedComment = commentInteractions.some(ci => ci.comment_id === comment.id && ci.user_id === user.id);
                              const commentAuthorName = comment.author_name || commentAuthor?.full_name || 'Usuário';
                              const commentAuthorPhoto = comment.author_photo_url || commentAuthor?.profile_photo_url;

                              return (
                                <div key={comment.id} className="flex gap-2 items-start">
                                  <Avatar className="h-7 w-7 flex-shrink-0">
                                    <AvatarImage src={commentAuthorPhoto} />
                                    <AvatarFallback className="bg-orange-100 text-orange-700 text-xs">
                                      {commentAuthorName.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 bg-gray-100 rounded-lg p-2.5 min-w-0">
                                    <p className="mb-2 text-sm">
                                      <span className="font-semibold text-gray-800">{commentAuthorName}</span>
                                      <span className="text-gray-600 ml-2 break-words">{comment.content}</span>
                                    </p>
                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                      <span>{format(new Date(comment.created_date), 'dd/MM HH:mm', { locale: ptBR })}</span>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className={`h-auto p-0 text-xs font-medium min-h-[32px] ${hasLikedComment ? 'text-red-600' : 'text-gray-500'} hover:text-red-600`} 
                                        onClick={() => handleCommentLike(comment.id)}
                                      >
                                        Curtir {(comment.likes_count || 0) > 0 && `(${comment.likes_count})`}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            
                            {comments.length > 2 && !showAllComments && (
                              <Button 
                                variant="link" 
                                size="sm" 
                                className="text-orange-600 hover:text-orange-700 p-2 min-h-[44px] w-full"
                                onClick={() => setShowAllComments(true)}
                              >
                                <ChevronDown className="h-4 w-4 mr-1"/>
                                Ver mais comentários ({comments.length - 2})
                              </Button>
                            )}
                            
                            {showAllComments && comments.length > 2 && (
                              <Button 
                                variant="link" 
                                size="sm" 
                                className="text-gray-500 hover:text-gray-700 p-2 min-h-[44px] w-full"
                                onClick={() => setShowAllComments(false)}
                              >
                                Mostrar menos
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Modals */}
        <CreatePostModal
          isOpen={showCreatePost}
          onOpenChange={(open) => {
            setShowCreatePost(open);
            if (!open) setEditingPost(null);
          }}
          onSubmit={handleCreatePost}
          currentUser={user}
          post={editingPost}
        />
        
        <ShareModal 
          isOpen={isShareModalOpen} 
          onOpenChange={setIsShareModalOpen} 
          post={postToShare} 
        />

        <LikesModal
          isOpen={!!likesModalPostId}
          onOpenChange={() => setLikesModalPostId(null)}
          postId={likesModalPostId}
        />
      </div>

      {/* Bottom Navigation */}
      {isStudent && <BottomNavBar activePage="Timeline" />}
      {isInstructor && <InstructorBottomNavBar activePage="Timeline" />}
      {isAdmin && <AdminBottomNavBar activePage="Timeline" />}
    </div>
  );
}
