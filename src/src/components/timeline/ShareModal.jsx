import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Check, Share2 } from 'lucide-react';

// Função para tentar usar a API de compartilhamento nativa do navegador
const nativeShare = (shareData) => {
  if (navigator.share) {
    navigator.share(shareData)
      .then(() => console.log('Compartilhado com sucesso!'))
      .catch((error) => console.log('Erro ao compartilhar:', error));
    return true;
  }
  return false;
};

export default function ShareModal({ isOpen, onOpenChange, post }) {
  const [copied, setCopied] = useState(false);
  
  // Constrói um link compartilhável.
  const shareUrl = post ? `${window.location.origin}${window.location.pathname}?postId=${post.id}` : '';
  const shareText = post ? `Confira esta publicação no app Fusion Fitness: ${post.content}` : '';

  useEffect(() => {
    // Tenta o compartilhamento nativo assim que o modal abre em dispositivos móveis
    if (isOpen && post && /Mobi|Android/i.test(navigator.userAgent)) {
      const shared = nativeShare({
        title: 'Publicação Fusion Fitness',
        text: shareText,
        url: shareUrl,
      });
      // Se o compartilhamento nativo foi acionado, fecha o modal
      if (shared) {
        onOpenChange(false);
      }
    }
    // Reseta o estado 'copied' sempre que o modal for aberto com um novo post
    setCopied(false);
  }, [isOpen, post, shareUrl, shareText, onOpenChange]);

  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const socialShareLinks = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
  };

  if (!post) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Compartilhar Publicação
          </DialogTitle>
          <DialogDescription>
            Compartilhe esta publicação com seus amigos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div>
            <Label htmlFor="share-link">Link para Compartilhar</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input id="share-link" value={shareUrl} readOnly />
              <Button size="icon" onClick={handleCopyLink}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
             <Button asChild variant="outline" className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700">
              <a href={socialShareLinks.whatsapp} target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
            </Button>
            <Button asChild variant="outline" className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700">
              <a href={socialShareLinks.telegram} target="_blank" rel="noopener noreferrer">
                Telegram
              </a>
            </Button>
             <Button asChild variant="outline" className="bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700">
              <a href={socialShareLinks.twitter} target="_blank" rel="noopener noreferrer">
                Twitter/X
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}