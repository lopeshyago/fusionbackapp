import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, X, Upload } from "lucide-react";
import { UploadFile } from "@/api/integrations";

export default function CreatePostModal({ isOpen, onOpenChange, onSubmit, currentUser, post = null }) {
  const [formData, setFormData] = useState({
    content: '',
    media_url: '',
    media_type: '',
    post_type: 'regular', // Sempre será regular por padrão
    tags: []
  });
  
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (post) {
      setFormData({
        content: post.content || '',
        media_url: post.media_url || '',
        media_type: post.media_type || '',
        post_type: 'regular', // Sempre regular
        tags: post.tags || []
      });
    } else {
      setFormData({
        content: '',
        media_url: '',
        media_type: '',
        post_type: 'regular', // Sempre regular
        tags: []
      });
    }
  }, [post]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      const mediaType = file.type.startsWith('image/') ? 'image' : 'video';
      
      setFormData(prev => ({
        ...prev,
        media_url: file_url,
        media_type: mediaType
      }));
    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Erro ao fazer upload da mídia. Tente novamente.');
    }
    setIsUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.content.trim()) {
      alert('Por favor, escreva algo para publicar.');
      return;
    }

    console.log("Enviando dados do formulário:", formData);
    await onSubmit(formData);
    
    // Reset form apenas após sucesso
    setFormData({
      content: '',
      media_url: '',
      media_type: '',
      post_type: 'regular',
      tags: []
    });
  };

  const handleClose = () => {
    if (!post) {
      setFormData({
        content: '',
        media_url: '',
        media_type: '',
        post_type: 'regular',
        tags: []
      });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg w-full mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            {post ? 'Editar Publicação' : 'Nova Publicação'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Conteúdo */}
          <div>
            <Label htmlFor="content">O que você quer compartilhar?</Label>
            <Textarea
              id="content"
              placeholder="Compartilhe sua jornada fitness, uma conquista, ou algo inspirador..."
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Upload de Mídia */}
          <div>
            <Label>Adicionar Foto/Vídeo (Opcional)</Label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileUpload}
                className="hidden"
                id="media-upload"
                disabled={isUploading}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('media-upload').click()}
                disabled={isUploading}
                className="flex-1"
              >
                {isUploading ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    Escolher Mídia
                  </>
                )}
              </Button>
            </div>
            
            {formData.media_url && (
              <div className="mt-2 relative">
                {formData.media_type === 'image' ? (
                  <img src={formData.media_url} alt="Preview" className="w-full h-32 object-cover rounded" />
                ) : (
                  <video src={formData.media_url} className="w-full h-32 object-cover rounded" controls />
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, media_url: '', media_type: '' }))}
                  className="absolute top-1 right-1"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Botões */}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-orange-500 hover:bg-orange-600"
              disabled={!formData.content.trim() || isUploading}
            >
              {post ? 'Atualizar' : 'Publicar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}