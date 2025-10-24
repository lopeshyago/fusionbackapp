import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { User } from '@/api/entities';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function DebugPage() {
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['debug_all_users'],
    // Usando User.list() para buscar os usuários. A visibilidade depende das permissões do usuário logado.
    queryFn: () => User.list('-created_date'), 
    initialData: [],
  });

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle>Página de Depuração: Tabela `public.users`</CardTitle>
          <CardDescription>
            Esta tabela exibe os dados da entidade 'User' (usuários).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && <LoadingSpinner text="Carregando usuários..." />}
          {error && <p className="text-red-500">Erro ao carregar usuários: {error.message}</p>}
          {!isLoading && !error && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">Email</TableHead>
                    <TableHead className="font-bold">Role (user_type)</TableHead>
                    <TableHead className="font-bold">ID do Usuário</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length > 0 ? (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.user_type === 'admin' ? 'bg-purple-100 text-purple-800' :
                            user.user_type === 'instructor' ? 'bg-green-100 text-green-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {user.user_type || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{user.id}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan="3" className="text-center">Nenhum usuário encontrado.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}