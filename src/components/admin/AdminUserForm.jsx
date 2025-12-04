import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { User, Condominium } from '@/api/entities_new';

export default function AdminUserForm({ isOpen, onOpenChange, user, onSave }) {
  const { register, handleSubmit, reset, setValue } = useForm();
  const [condominiums, setCondominiums] = useState([]);
  const [selectedUserType, setSelectedUserType] = useState('student');

  useEffect(() => {
    // Load condominiums once dialog is opened
    const loadCondos = async () => {
      try {
        const list = await Condominium.list();
        setCondominiums(list || []);
      } catch (e) {
        console.error('Erro ao carregar condomínios:', e);
      }
    };

    if (isOpen) {
      loadCondos();
    }
  }, [isOpen]);

  useEffect(() => {
    // Prefill form when editing; otherwise reset defaults
    if (user) {
      setValue('full_name', user.full_name || '');
      setValue('email', user.email || '');
      setValue('phone', user.phone || '');
      setValue('condominium_id', user.condominium_id != null ? String(user.condominium_id) : '');
      setSelectedUserType(user.user_type || 'student');
    } else {
      reset();
      setSelectedUserType('student');
    }
  }, [user, reset, setValue]);

  const onSubmit = async (data) => {
    try {
      const payload = {
        full_name: data.full_name || '',
        email: user ? (user.email || '') : (data.email || ''),
        phone: data.phone || '',
        user_type: selectedUserType,
        condominium_id: data.condominium_id ? Number(data.condominium_id) : null,
      };

      if (user) {
        await User.update(user.id, payload);
      } else {
        const token = localStorage.getItem('fusion_token');
        await fetch('/admin/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        });
      }

      if (onSave) onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
          <DialogDescription>Preencha os dados e salve</DialogDescription>
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
            <Select value={selectedUserType} onValueChange={setSelectedUserType}>
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
              defaultValue={user?.condominium_id != null ? String(user.condominium_id) : undefined}
            >
              <SelectTrigger id="condominium_id">
                <SelectValue placeholder="Selecione o condomínio" />
              </SelectTrigger>
              <SelectContent>
                {condominiums.map((condo) => (
                  <SelectItem key={condo.id} value={String(condo.id)}>
                    {condo.name}
                  </SelectItem>
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
