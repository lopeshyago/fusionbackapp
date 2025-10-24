
import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Plus, Edit, Users, Mail, Phone, ArrowLeft, UserCheck, Search, SlidersHorizontal, Trash2, UserCog,
  MoreHorizontal, UserPlus, FileDown, ArrowUpDown, CheckCircle, AlertCircle, UserX
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from '@/utils';
import { User } from "@/api/entities";
import AdminUserForm from "../components/admin/AdminUserForm";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import { base44 } from '@/api/base44Client';

// Helper maps for user types
const userTypeMap = {
  student: 'Aluno',
  instructor: 'Instrutor',
  admin: 'Admin'
};

const userTypeColor = {
  student: 'bg-blue-100 text-blue-800',
  instructor: 'bg-green-100 text-green-800',
  admin: 'bg-purple-100 text-purple-800' // Keeping purple for admin for consistency with original UI
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [cpfSearch, setCpfSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'full_name', direction: 'ascending' });
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // CORREÇÃO: Usa a função de backend segura para buscar os usuários
      const response = await base44.functions.invoke('getAllUsers');
      if (response.data && Array.isArray(response.data)) {
        setUsers(response.data);
      } else {
        throw new Error(response.data?.error || "Resposta inválida do servidor.");
      }
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
      setError(e.message || "Não foi possível carregar os usuários. Verifique suas permissões.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    await fetchData();
    setIsFormOpen(false);
    setEditingUser(null);
    toast({
      title: "Sucesso!",
      description: "Usuário salvo com sucesso.",
      variant: "success",
    });
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleDelete = async (userId, userName) => {
    if (confirm(`Tem certeza que deseja excluir a conta de ${userName}? Esta ação não pode ser desfeita.`)) {
      try {
        await User.delete(userId);
        await fetchData(); // Recarrega a lista após exclusão
        toast({
          title: "Sucesso!",
          description: "Usuário excluído com sucesso.",
          variant: "success",
        });
      } catch (e) {
        console.error('Erro ao excluir usuário:', e);
        toast({
          title: "Erro ao excluir",
          description: e.message || "Erro ao excluir usuário. Verifique se ele não possui dados vinculados.",
          variant: "destructive",
        });
      }
    }
  };

  const handleCreateNew = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const handleRoleChange = async (user, newRole) => {
    const roleLabel = userTypeMap[newRole];

    if (confirm(`Tem certeza que deseja alterar o tipo de "${user.full_name}" para ${roleLabel}?`)) {
      try {
        await User.update(user.id, { user_type: newRole });
        await fetchData();
        toast({
          title: "Sucesso!",
          description: `Tipo de usuário de "${user.full_name}" alterado para ${roleLabel}.`,
          variant: "success",
        });
      } catch (e) {
        console.error("Erro ao alterar tipo de usuário:", e);
        toast({
          title: "Erro ao alterar tipo de usuário",
          description: e.message || "Falha ao alterar o tipo do usuário.",
          variant: "destructive",
        });
      }
    }
  };

  const handleCpfSearch = (value) => {
    const cpfValue = value.replace(/\D/g, '');
    const formattedCpf = cpfValue
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
    setCpfSearch(formattedCpf);
  };

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedUsers = useMemo(() => {
    let sortableUsers = [...users];
    if (sortConfig.key) {
      sortableUsers.sort((a, b) => {
        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableUsers;
  }, [users, sortConfig]);

  const filteredAndSortedUsers = useMemo(() => {
    return sortedUsers.filter(user => {
      const searchMatch =
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const cleanCpfSearch = cpfSearch.replace(/\D/g, '');
      const cpfMatch = cleanCpfSearch === "" || (user.cpf && user.cpf.replace(/\D/g, '').includes(cleanCpfSearch));

      const roleMatch = filterRole === "all" || user.user_type === filterRole;

      return searchMatch && roleMatch && cpfMatch;
    });
  }, [sortedUsers, searchTerm, cpfSearch, filterRole]);

  const getUserTypeBadge = (userType) => {
    return { label: userTypeMap[userType] || userType, color: userTypeColor[userType] || "bg-gray-100 text-gray-800" };
  };

  // Condominium name display is removed as the Condominium entity is no longer imported and fetched here.
  // The AdminUserForm will receive an empty array for `condominiums`.

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <header className="bg-black text-white p-4 shadow-lg">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 md:h-8 md:w-8" />
              <h1 className="text-lg md:text-2xl font-bold">Usuários</h1>
            </div>
            <Link to={createPageUrl("Index")}>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                <ArrowLeft className="h-4 w-4 mr-1 md:mr-2" />
                <span className="hidden md:inline">Voltar</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4">
        {/* Filtros e Ações */}
        <div className="mb-6 space-y-4">
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-orange-200"
              />
            </div>
            <Input
              placeholder="Buscar por CPF..."
              value={cpfSearch}
              onChange={(e) => handleCpfSearch(e.target.value)}
              className="border-orange-200"
              maxLength={14}
            />
            <div className="flex gap-2">
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="flex-1 border-orange-200">
                  <SelectValue placeholder="Filtrar por tipo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="student">Alunos</SelectItem>
                  <SelectItem value="instructor">Instrutores</SelectItem>
                  <SelectItem value="admin">Administradores</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleCreateNew}
                className="bg-orange-500 hover:bg-orange-600 px-4"
              >
                <Plus className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Novo</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Cards de Resumo - Mobile Otimizado */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card className="border-orange-200">
            <CardContent className="p-3 text-center">
              <Users className="h-6 w-6 mx-auto mb-2 text-orange-600" />
              <p className="text-lg md:text-2xl font-bold text-orange-700">{users.length}</p>
              <p className="text-xs text-gray-600">Total</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardContent className="p-3 text-center">
              <UserCheck className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <p className="text-lg md:text-2xl font-bold text-blue-700">
                {users.filter(u => u.user_type === 'student').length}
              </p>
              <p className="text-xs text-gray-600">Alunos</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardContent className="p-3 text-center">
              <UserCheck className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <p className="text-lg md:text-2xl font-bold text-green-700">
                {users.filter(u => u.user_type === 'instructor').length}
              </p>
              <p className="text-xs text-gray-600">Instrutores</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardContent className="p-3 text-center">
              <UserCheck className="h-6 w-6 mx-auto mb-2 text-purple-600" />
              <p className="text-lg md:text-2xl font-bold text-purple-700">
                {users.filter(u => u.user_type === 'admin').length}
              </p>
              <p className="text-xs text-gray-600">Admins</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Usuários (Tabela) */}
        <Card className="mb-6 border-orange-200">
          <CardHeader>
            <CardTitle>Lista Completa de Usuários</CardTitle>
            <CardDescription>Gerencie todos os usuários do sistema.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="py-12 flex justify-center items-center">
                <LoadingSpinner />
              </div>
            ) : error ? (
              <div className="py-12 flex justify-center items-center">
                <ErrorMessage message={error} />
              </div>
            ) : filteredAndSortedUsers.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <Users className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-base md:text-lg font-semibold text-gray-700 mb-2">
                  {searchTerm || cpfSearch || filterRole !== "all" ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}
                </h3>
                <p className="text-sm text-gray-500 mb-4 px-4">
                  {searchTerm || cpfSearch || filterRole !== "all" ? "Tente buscar com outros termos ou filtros." : "Crie o primeiro usuário."}
                </p>
                {(!searchTerm && !cpfSearch && filterRole === "all") && (
                  <Button
                    onClick={handleCreateNew}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Usuário
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('full_name')}>
                      Nome
                      {sortConfig.key === 'full_name' && (
                        sortConfig.direction === 'ascending' ? <ArrowUpDown className="ml-1 h-3 w-3 inline" /> : <ArrowUpDown className="ml-1 h-3 w-3 inline rotate-180" />
                      )}
                    </TableHead>
                    <TableHead className="hidden md:table-cell cursor-pointer" onClick={() => handleSort('email')}>
                      Email
                      {sortConfig.key === 'email' && (
                        sortConfig.direction === 'ascending' ? <ArrowUpDown className="ml-1 h-3 w-3 inline" /> : <ArrowUpDown className="ml-1 h-3 w-3 inline rotate-180" />
                      )}
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">CPF</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('user_type')}>
                      Tipo
                      {sortConfig.key === 'user_type' && (
                        sortConfig.direction === 'ascending' ? <ArrowUpDown className="ml-1 h-3 w-3 inline" /> : <ArrowUpDown className="ml-1 h-3 w-3 inline rotate-180" />
                      )}
                    </TableHead>
                    <TableHead className="hidden sm:table-cell text-center">Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedUsers.map((user) => {
                    const userTypeBadge = getUserTypeBadge(user.user_type);

                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.profile_photo_url} alt={user.full_name} />
                            <AvatarFallback className="bg-orange-100 text-orange-700 text-xs">
                              {user.full_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-medium">
                          {user.full_name}
                          <div className="text-xs text-gray-500 md:hidden">{user.email}</div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {user.cpf ? user.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${userTypeBadge.color}`}>
                            {userTypeBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-center">
                          {user.plan_status === 'active' ? (
                            <CheckCircle className="h-5 w-5 text-green-500 mx-auto" title="Ativo" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-red-500 mx-auto" title="Inativo" />
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              {user.user_type === 'student' && (
                                <DropdownMenuItem asChild>
                                  <Link to={createPageUrl(`AdminStudentDetail?student_id=${user.id}`)} className="flex items-center">
                                    <SlidersHorizontal className="mr-2 h-4 w-4" /> Ver Detalhes Aluno
                                  </Link>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleEdit(user)} className="flex items-center">
                                <Edit className="mr-2 h-4 w-4" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>Mudar Tipo</DropdownMenuLabel>
                              <DropdownMenuItem
                                disabled={user.user_type === 'admin'}
                                onClick={() => handleRoleChange(user, 'admin')}
                                className="flex items-center"
                              >
                                <UserCog className="mr-2 h-4 w-4" /> Tornar Administrador
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={user.user_type === 'instructor'}
                                onClick={() => handleRoleChange(user, 'instructor')}
                                className="flex items-center"
                              >
                                <UserPlus className="mr-2 h-4 w-4" /> Tornar Instrutor
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={user.user_type === 'student'}
                                onClick={() => handleRoleChange(user, 'student')}
                                className="flex items-center"
                              >
                                <UserCheck className="mr-2 h-4 w-4" /> Tornar Aluno
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(user.id, user.full_name)}
                                className="flex items-center text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <AdminUserForm
          isOpen={isFormOpen}
          onOpenChange={setIsFormOpen}
          user={editingUser}
          condominiums={[]} // Condominiums are no longer fetched in this component.
          onSave={handleSave}
        />
      </div>
    </div>
  );
}
