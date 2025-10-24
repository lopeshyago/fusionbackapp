import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Save, Plus, X } from "lucide-react";
import { Condominium } from "@/api/entities";

export default function CondominiumForm({ isOpen, onOpenChange, condominium, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    cep: '',
    invite_code: '',
    areas: [],
    rules: '',
    is_active: true
  });
  const [newArea, setNewArea] = useState('');

  useEffect(() => {
    if (condominium) {
      setFormData(condominium);
    } else {
      setFormData({
        name: '',
        address: '',
        cep: '',
        invite_code: generateInviteCode(),
        areas: [],
        rules: '',
        is_active: true
      });
    }
  }, [condominium, isOpen]);

  const generateInviteCode = () => {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addArea = () => {
    if (newArea.trim() && !formData.areas.includes(newArea.trim())) {
      setFormData(prev => ({
        ...prev,
        areas: [...prev.areas, newArea.trim()]
      }));
      setNewArea('');
    }
  };

  const removeArea = (areaToRemove) => {
    setFormData(prev => ({
      ...prev,
      areas: prev.areas.filter(area => area !== areaToRemove)
    }));
  };

  const handleSave = async () => {
    if (condominium && condominium.id) {
      await Condominium.update(condominium.id, formData);
    } else {
      await Condominium.create(formData);
    }
    onSave();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{condominium ? "Editar Condomínio" : "Novo Condomínio"}</DialogTitle>
          <DialogDescription>
            Configure as informações do local e suas áreas disponíveis.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome do Condomínio *</Label>
              <Input
                placeholder="Ex: Residencial Vila Verde"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="border-orange-200"
              />
            </div>

            <div className="space-y-2">
              <Label>CEP</Label>
              <Input
                placeholder="00000-000"
                value={formData.cep}
                onChange={(e) => handleChange('cep', e.target.value)}
                className="border-orange-200"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Endereço Completo *</Label>
            <Input
              placeholder="Rua, número, bairro, cidade - UF"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="border-orange-200"
            />
          </div>

          <div className="space-y-2">
            <Label>Código de Convite</Label>
            <div className="flex gap-2">
              <Input
                value={formData.invite_code}
                onChange={(e) => handleChange('invite_code', e.target.value)}
                className="border-orange-200"
              />
              <Button 
                type="button" 
                variant="outline"
                onClick={() => handleChange('invite_code', generateInviteCode())}
              >
                Gerar Novo
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Áreas Disponíveis</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: Academia, Piscina, Quadra..."
                value={newArea}
                onChange={(e) => setNewArea(e.target.value)}
                className="border-orange-200"
                onKeyPress={(e) => e.key === 'Enter' && addArea()}
              />
              <Button type="button" onClick={addArea} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.areas.map((area, index) => (
                <Badge key={index} variant="outline" className="border-orange-200">
                  {area}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-4 w-4 p-0"
                    onClick={() => removeArea(area)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Regras e Observações</Label>
            <Textarea
              placeholder="Regras específicas do condomínio, horários de funcionamento, etc..."
              value={formData.rules}
              onChange={(e) => handleChange('rules', e.target.value)}
              className="min-h-[100px] border-orange-200"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleChange('is_active', checked)}
            />
            <Label htmlFor="is_active">Condomínio ativo</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600">
            <Save className="h-4 w-4 mr-2" />
            {condominium ? "Atualizar" : "Criar"} Condomínio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}