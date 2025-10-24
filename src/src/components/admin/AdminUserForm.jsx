import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { User } from '@/api/entities';
import { Condominium } from '@/api/entities';
import { toast, useToast } from "@/components/ui/use-toast";

export default function AdminUserForm({ isOpen, onOpenChange, user, onSave }) {
  const { register, handleSubmit, reset, setValue } = useForm();
  const [condominiums, setCondominiums] = useState([]);
  const { toast } = useToast();
  const [selectedUserType, setSelectedUserType] = useState(user?.user_type || 'student');

  useEffect(() => {
    async function loadCondos() {
      const condos = await Condominium.list();
      setCondominiums(condos);
    }
    loadCondos();
  }, []);

  useEffect(() => {
    if (user) {
      setValue('full_name', user.full_name);
      setValue('email', user.email);
      setValue('phone', user.phone);
      setValue('condominium_id', user.condominium_id);
      setValue('user_type', user.user_type);
      setSelectedUserType(user.user_type);
    } else {
      reset();
      setSelectedUserType('student');
    }
  }, [user, isOpen, reset, setValue]);

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        user_type: selectedUserType,
      };

      if (user) {
        await User.update(user.id, payload);
        toast({ title: "Sucesso!", description: "Usuário atualizado com sucesso." });
      } else {
        // A criação de usuário não está implementada neste formulário, apenas edição.
        toast({ title: "Ação não suportada", description: "A criação de novos usuários deve ser feita pelo próprio usuário.", variant: "destructive" });
        return;
      }
      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar usuário:", error);
      toast({ title: "Erro", description: "Não foi possível salvar as informações do usuário.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="full_name">Nome Completo</Label>
            <Input id="full_name" {...register('full_name')} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} disabled={!!user} />
          </div>
          <div>
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" {...register('phone')} />
          </div>

          <div>
            <Label htmlFor="user_type">Tipo de Usuário</Label>
            <Select
              value={selectedUserType}
              onValueChange={setSelectedUserType}
            >
              <SelectTrigger id="user_type">
                <SelectValue placeholder="Selecione o tipo de usuário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Aluno</SelectItem>
                <SelectItem value="instructor">Instrutor</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="condominium_id">Condomínio</Label>
            <Select
              onValueChange={(value) => setValue('condominium_id', value)}
              defaultValue={user?.condominium_id}
            >
              <SelectTrigger id="condominium_id">
                <SelectValue placeholder="Selecione o condomínio" />
              </SelectTrigger>
              <SelectContent>
                {condominiums.map(condo => (
                  <SelectItem key={condo.id} value={condo.id}>{condo.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}