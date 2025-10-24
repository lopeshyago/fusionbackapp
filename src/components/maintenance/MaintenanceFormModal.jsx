import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { UploadFile } from '@/api/integrations';
import { MaintenanceItem } from '@/api/entities';
import { Image as ImageIcon, Video, UploadCloud, X, Loader2 } from 'lucide-react';

export default function MaintenanceFormModal({ isOpen, onClose, onSave, condominiumId }) {
  const [equipmentName, setEquipmentName] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!equipmentName || !description) {
      setError('Por favor, preencha o nome do equipamento e a descrição.');
      return;
    }
    setError('');
    setIsSubmitting(true);

    try {
      let mediaUrls = [];
      if (files.length > 0) {
        setIsUploading(true);
        const uploadPromises = files.map(file => UploadFile({ file }));
        const uploadResults = await Promise.all(uploadPromises);
        mediaUrls = uploadResults.map(result => result.file_url);
        setIsUploading(false);
      }
      
      await MaintenanceItem.create({
        equipment_name: equipmentName,
        description: description,
        condominium_id: condominiumId,
        media_urls: mediaUrls,
        status: 'reportado',
      });
      
      onSave();
    } catch (err) {
      console.error("Erro ao criar chamado:", err);
      setError('Ocorreu um erro ao enviar o chamado. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Reportar Problema em Equipamento</DialogTitle>
          <DialogDescription>
            Descreva o problema e anexe mídias para ajudar na manutenção.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="equipmentName">Nome do Equipamento</Label>
            <Input id="equipmentName" value={equipmentName} onChange={(e) => setEquipmentName(e.target.value)} placeholder="Ex: Esteira 2" />
          </div>
          <div>
            <Label htmlFor="description">Descrição do Problema</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Painel não liga, faz barulho estranho ao correr." />
          </div>
          <div>
            <Label>Anexar Fotos ou Vídeos</Label>
            <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
              <div className="text-center">
                <UploadCloud className="mx-auto h-12 w-12 text-gray-300" />
                <div className="mt-4 flex text-sm leading-6 text-gray-600">
                  <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-white font-semibold text-orange-600 focus-within:outline-none hover:text-orange-500">
                    <span>Carregar arquivos</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} accept="image/*,video/*"/>
                  </label>
                  <p className="pl-1">ou arraste e solte</p>
                </div>
                <p className="text-xs leading-5 text-gray-600">PNG, JPG, MP4 até 10MB</p>
              </div>
            </div>
          </div>
          
          {files.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Arquivos selecionados:</h4>
              <div className="flex flex-wrap gap-2">
                {files.map((file, index) => (
                  <div key={index} className="relative group p-2 border rounded-lg flex items-center gap-2 bg-gray-50">
                    {file.type.startsWith('image/') ? <ImageIcon className="h-5 w-5 text-gray-500" /> : <Video className="h-5 w-5 text-gray-500" />}
                    <span className="text-sm text-gray-700 truncate max-w-[120px]">{file.name}</span>
                    <button type="button" onClick={() => removeFile(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting || isUploading} className="fusion-gradient">
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</> : 'Enviar Chamado'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}