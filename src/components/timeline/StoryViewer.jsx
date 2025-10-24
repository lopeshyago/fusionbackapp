import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

// Componente preparado para futura implementação de Stories
export default function StoryViewer({ isOpen, onClose, stories }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm h-[80vh] p-0 bg-black">
        <div className="relative h-full flex items-center justify-center">
          <Button
            variant="ghost" 
            size="icon"
            className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>
          
          <div className="text-white text-center">
            <p>Stories em breve!</p>
            <p className="text-sm opacity-75">Funcionalidade em desenvolvimento</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}