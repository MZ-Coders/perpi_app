-- Política RLS para permitir que CLIENTES vejam o rastreamento dos seus pedidos
-- E que ENTREGADORES vejam o rastreamento dos pedidos que estão entregando

-- Primeiro, vamos remover políticas antigas se existirem
DROP POLICY IF EXISTS "Cliente pode ver rastreamento dos seus pedidos" ON rastreamento_pedidos;
DROP POLICY IF EXISTS "Entregador pode ver rastreamento dos seus pedidos" ON rastreamento_pedidos;

-- Política para CLIENTES verem o rastreamento dos seus pedidos
-- Usando pedido_id_str para pedidos numéricos (da tabela orders)
CREATE POLICY "Cliente pode ver rastreamento dos seus pedidos" ON rastreamento_pedidos
  FOR SELECT 
  USING (
    -- Verifica se o pedido pertence ao cliente autenticado
    pedido_id_str IN (
      SELECT CAST(id AS TEXT)
      FROM orders
      WHERE customer_uuid = auth.uid()
    )
  );

-- Política para ENTREGADORES verem o rastreamento dos seus pedidos
CREATE POLICY "Entregador pode ver rastreamento dos seus pedidos" ON rastreamento_pedidos
  FOR SELECT 
  USING (
    -- Verifica se o rastreamento pertence ao entregador autenticado
    entregador_id IN (
      SELECT id 
      FROM entregadores 
      WHERE user_id = auth.uid()
    )
  );

-- Verificar se as políticas foram criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'rastreamento_pedidos';
