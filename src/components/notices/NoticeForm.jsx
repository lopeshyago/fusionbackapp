import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarIcon, Save } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Notice } from "@/api/entities";

export default function NoticeForm({ isOpen, onOpenChange, notice, onSave }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'info',
    target_audience: 'all',
    is_active: true
  });
  const [validUntilDate, setValidUntilDate] = useState(null);

  useEffect(() => {
    if (notice) {
      setFormData(notice);
      setValidUntilDate(notice.valid_until ? new Date(notice.valid_until) : null);
    } else {
      setFormData({
        title: '',
        content: '',
        type: 'info',
        target_audience: 'all',
        is_active: true
      });
      setValidUntilDate(null);
    }
  }, [notice, isOpen]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const dataToSave = { 
      ...formData, 
      valid_until: validUntilDate ? format(validUntilDate, "yyyy-MM-dd") : null 
    };
    
    if (notice && notice.id) {
      await Notice.update(notice.id, dataToSave);
    } else {
      await Notice.create(dataToSave);
    }
    onSave();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{notice ? "Editar Aviso" : "Criar Novo Aviso"}</DialogTitle>
          <DialogDescription>
            Compartilhe informações importantes com alunos e equipe.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label>Título do Aviso</Label>
            <Input 
              placeholder="Ex: Aula cancelada hoje..." 
              value={formData.title} 
              onChange={(e) => handleChange('title', e.target.value)} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo do Aviso</Label>
              <Select value={formData.type} onValueChange={(v) => handleChange('type', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Informativo</SelectItem>
                  <SelectItem value="warning">Atenção</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                  <SelectItem value="celebration">Comemoração</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Público Alvo</Label>
              <Select value={formData.target_audience} onValueChange={(v) => handleChange('target_audience', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar público" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="students">Apenas Alunos</SelectItem>
                  <SelectItem value="teachers">Apenas Professores</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Conteúdo</Label>
            <Textarea 
              placeholder="Digite o conteúdo do aviso..."
              className="min-h-[120px]"
              value={formData.content} 
              onChange={(e) => handleChange('content', e.target.value)} 
            />
          </div>

          <div className="space-y-2">
            <Label>Válido até (opcional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className={cn("w-full justify-start text-left", !validUntilDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {validUntilDate ? format(validUntilDate, "PPP", { locale: ptBR }) : "Selecionar data (opcional)"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar 
                  mode="single" 
                  selected={validUntilDate} 
                  onSelect={setValidUntilDate}
                  initialFocus 
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleChange('is_active', checked)}
            />
            <Label htmlFor="is_active">Aviso ativo</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600">
            <Save className="h-4 w-4 mr-2" />
            {notice ? "Atualizar" : "Criar"} Aviso
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}