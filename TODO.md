# Correção da Migração Fusion Fitness - SQLite

## Problemas Identificados
- [x] Esquema de BD incompleto (só 3 tabelas)
- [x] API backend genérica limitada
- [x] Erro de import no AdminDashboard
- [x] BD vazio
- [x] Estrutura de dados incompatível

## Tarefas de Correção

### 1. Backend - Esquema Completo
- [ ] Atualizar `server/db/init.js` com todas as tabelas necessárias
- [ ] Criar tabelas: bookings, activities, notices, condominiums, classes, etc.
- [ ] Adicionar foreign keys e constraints apropriadas

### 2. Backend - API Melhorada
- [ ] Modificar `server/app.js` para suportar diferentes estruturas de tabelas
- [ ] Implementar endpoints específicos para CRUD completo (GET, POST, PUT, DELETE)
- [ ] Ajustar mapeamento de campos entre frontend e backend

### 3. Frontend - Correções
- [ ] Corrigir import em `src/pages/AdminDashboard.jsx` (entities_new_new -> entities_new)
- [ ] Verificar outros arquivos com imports incorretos

### 4. Dados de Teste
- [ ] Criar script para popular BD com usuários de teste
- [ ] Inserir dados básicos para funcionamento mínimo

### 5. Testes
- [ ] Testar login/registro
- [ ] Testar listagem de usuários
- [ ] Verificar funcionamento das entidades principais
