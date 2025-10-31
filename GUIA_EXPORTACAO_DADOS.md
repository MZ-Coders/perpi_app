# Guia de Exportação de Dados do Supabase

## ✅ Arquivos Criados

1. **supabase_schema_export.sql** - Schema completo (DDL)
2. **export_data_helper.sql** - Script auxiliar para gerar INSERTs
3. **SCHEMA_EXPORT.md** - Documentação do schema

---

## 📋 Como Exportar os Dados

### Método 1: Usando o SQL Editor do Supabase (RECOMENDADO)

1. **Acesse seu projeto Supabase:**
   - Vá para https://supabase.com/dashboard
   - Selecione o projeto "perpi"
   - Clique em "SQL Editor" no menu lateral

2. **Verifique os dados existentes:**
   ```sql
   -- Execute esta query para ver quantos registros existem
   SELECT 
       'categories' as tabela, COUNT(*) as total FROM categories
   UNION ALL
   SELECT 'products', COUNT(*) FROM products
   UNION ALL
   SELECT 'users_', COUNT(*) FROM users_
   UNION ALL
   SELECT 'entregadores', COUNT(*) FROM entregadores
   UNION ALL
   SELECT 'addresses', COUNT(*) FROM addresses
   UNION ALL
   SELECT 'orders', COUNT(*) FROM orders
   UNION ALL
   SELECT 'order_items', COUNT(*) FROM order_items
   ORDER BY tabela;
   ```

3. **Gere os INSERTs:**
   - Abra o arquivo `export_data_helper.sql`
   - Copie o bloco SELECT de cada tabela (ex: "EXPORTAR DADOS DE CATEGORIES")
   - Cole no SQL Editor do Supabase
   - Execute a query
   - Copie os resultados (serão os comandos INSERT)

4. **Salve os resultados:**
   - Crie um novo arquivo chamado `supabase_data_inserts.sql`
   - Cole todos os INSERTs gerados
   - Adicione este cabeçalho no início:
   ```sql
   -- ============================================================================
   -- DADOS EXPORTADOS DO SUPABASE - PROJETO PERPI
   -- Gerado em: [DATA ATUAL]
   -- ============================================================================

   -- Desabilitar triggers temporariamente (opcional)
   SET session_replication_role = replica;
   ```
   - Adicione este rodapé no final:
   ```sql
   -- Reabilitar triggers
   SET session_replication_role = DEFAULT;

   -- Resetar sequences (IMPORTANTE!)
   SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories), true);
   SELECT setval('products_id_seq', (SELECT MAX(id) FROM products), true);
   SELECT setval('addresses_id_seq', (SELECT MAX(id) FROM addresses), true);
   SELECT setval('orders_id_seq', (SELECT MAX(id) FROM orders), true);
   SELECT setval('order_items_id_seq', (SELECT MAX(id) FROM order_items), true);
   ```

---

### Método 2: Usando pg_dump (Alternativa)

Se preferir usar a ferramenta oficial do PostgreSQL:

```bash
# Instalar PostgreSQL tools (se ainda não tiver)
# Windows: https://www.postgresql.org/download/windows/

# Exportar APENAS os dados (sem schema)
pg_dump "postgresql://postgres:[PASSWORD]@db.venpdlamvxpqnhqtkgrr.supabase.co:5432/postgres" \
  --data-only \
  --inserts \
  --column-inserts \
  --no-owner \
  --no-privileges \
  --file=supabase_data_inserts.sql

# Ou exportar schema + dados juntos
pg_dump "postgresql://postgres:[PASSWORD]@db.venpdlamvxpqnhqtkgrr.supabase.co:5432/postgres" \
  --inserts \
  --column-inserts \
  --no-owner \
  --no-privileges \
  --file=supabase_full_backup.sql
```

**Nota:** Substitua `[PASSWORD]` pela senha do seu projeto Supabase.

---

## 🚀 Como Importar em Nova Base de Dados

### Passo 1: Criar nova base de dados Supabase
1. Vá para https://supabase.com/dashboard
2. Clique em "New Project"
3. Preencha os dados e aguarde a criação

### Passo 2: Importar o schema
1. Abra o SQL Editor do novo projeto
2. Copie e cole o conteúdo de `supabase_schema_export.sql`
3. Execute o script completo
4. Aguarde a conclusão (pode levar alguns segundos)

### Passo 3: Importar os dados
1. No mesmo SQL Editor
2. Copie e cole o conteúdo de `supabase_data_inserts.sql`
3. Execute o script completo
4. Verifique se os dados foram importados:
   ```sql
   SELECT COUNT(*) FROM categories;
   SELECT COUNT(*) FROM products;
   SELECT COUNT(*) FROM users_;
   ```

### Passo 4: Verificar integridade
```sql
-- Verificar foreign keys
SELECT 
    COUNT(*) as produtos_sem_categoria
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE c.id IS NULL;

-- Verificar orders
SELECT 
    COUNT(*) as pedidos_sem_cliente
FROM orders o
LEFT JOIN users_ u ON o.customer_id = u.id
WHERE u.id IS NULL;
```

---

## ⚠️ Considerações Importantes

### 1. **UUIDs de Usuários (Auth)**
- A tabela `users_` contém UUIDs que podem referenciar `auth.users`
- Se estiver migrando para novo projeto, você precisará:
  - Recriar os usuários no Auth do Supabase OU
  - Atualizar os UUIDs nas tabelas para corresponder aos novos IDs

### 2. **Row Level Security (RLS)**
- As políticas RLS estão definidas no schema
- Verifique se funcionam corretamente após importação
- Teste com diferentes perfis de usuário

### 3. **Storage (Imagens)**
- URLs de imagens (foto_perfil, image_url, etc.) apontam para o Storage antigo
- Você precisará:
  - Migrar os arquivos do Storage OU
  - Atualizar as URLs no banco

### 4. **Functions e Triggers**
- Todas as functions estão no `supabase_schema_export.sql`
- Triggers de `updated_at` serão criados automaticamente

---

## 🔍 Verificação Pós-Importação

Execute estas queries para confirmar que tudo foi importado:

```sql
-- 1. Contar registros por tabela
SELECT 
    schemaname,
    tablename,
    n_live_tup as registros
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

-- 2. Verificar sequences
SELECT 
    sequence_name,
    last_value
FROM information_schema.sequences
WHERE sequence_schema = 'public';

-- 3. Verificar integridade referencial
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table
FROM pg_constraint
WHERE contype = 'f'
AND connamespace = 'public'::regnamespace;
```

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs do Supabase SQL Editor
2. Confirme que todas as tabelas foram criadas
3. Verifique se há conflitos de constraints
4. Execute as queries de verificação acima

---

## ✨ Próximos Passos

Após importar schema e dados:

1. ✅ Atualizar configuração do app (URL do Supabase, anon key)
2. ✅ Migrar arquivos do Storage
3. ✅ Testar autenticação
4. ✅ Testar funcionalidades críticas
5. ✅ Configurar backups automáticos
