import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export default function MediaPreviewModal({ isOpen, onClose, mediaUrl, mediaType }) {
  if (!isOpen || !mediaUrl) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] p-0 bg-black/80 backdrop-blur-sm border-none shadow-2xl flex items-center justify-center">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-10 text-white hover:bg-white/20"
          onClick={onClose}
        >
          <X className="h-6 w-6" />
        </Button>
        
        <div className="w-full h-full flex items-center justify-center p-4">
          {mediaType === 'video' ? (
            <video controls autoPlay className="w-full h-full max-h-[85vh] object-contain">
              <source src={mediaUrl} type="video/mp4" />
              Seu navegador não suporta vídeos.
            </video>
          ) : (
            <img
              src={mediaUrl}
              alt="Visualização de mídia do post"
              className="w-full h-full max-h-[85vh] object-contain"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}