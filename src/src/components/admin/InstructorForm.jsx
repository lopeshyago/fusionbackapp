import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User } from "@/api/entities";

export default function InstructorForm({ isOpen, onOpenChange, instructor, condominiums, onSave }) {
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    phone: "",
    address: "",
    cpf: "",
    condominium_id: "",
    objectives: "",
    physical_restrictions: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (instructor) {
      setFormData({
        email: instructor.email || "",
        full_name: instructor.full_name || "",
        phone: instructor.phone || "",
        address: instructor.address || "",
        cpf: instructor.cpf || "",
        condominium_id: instructor.condominium_id || "",
        objectives: instructor.objectives || "",
        physical_restrictions: instructor.physical_restrictions || ""
      });
    } else {
      setFormData({
        email: "",
        full_name: "",
        phone: "",
        address: "",
        cpf: "",
        condominium_id: "",
        objectives: "",
        physical_restrictions: ""
      });
    }
    setError("");
  }, [instructor, isOpen]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!formData.email || !formData.full_name) {
      setError("Email e nome completo são obrigatórios.");
      return;
    }

    setIsLoading(true);
    try {
      const userData = {
        ...formData,
        user_type: "instructor",
        plan_status: "active"
      };

      if (instructor) {
        await User.update(instructor.id, userData);
      } else {
        // Note: In a real app, you'd need a way to create users with specific emails
        // For now, we assume the instructor already exists and we're just updating
        alert("Para adicionar novos instrutores, eles devem primeiro fazer login no sistema uma vez.");
        onOpenChange(false);
        return;
      }
      
      onSave();
    } catch (error) {
      console.error('Erro ao salvar instrutor:', error);
      setError("Erro ao salvar dados. Tente novamente.");
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {instructor ? 'Editar Instrutor' : 'Novo Instrutor'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-100 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={!!instructor} // Disable email editing for existing users
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">Nome Completo *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={handleInputChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="condominium_id">Condomínio</Label>
            <select
              id="condominium_id"
              value={formData.condominium_id}
              onChange={(e) => setFormData(prev => ({ ...prev, condominium_id: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Selecione um condomínio</option>
              {condominiums.map(condo => (
                <option key={condo.id} value={condo.id}>{condo.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="objectives">Especialidades</Label>
            <Textarea
              id="objectives"
              value={formData.objectives}
              onChange={handleInputChange}
              placeholder="Ex: Musculação, Pilates, Yoga..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="physical_restrictions">Observações</Label>
            <Textarea
              id="physical_restrictions"
              value={formData.physical_restrictions}
              onChange={handleInputChange}
              placeholder="Observações gerais sobre o instrutor..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}