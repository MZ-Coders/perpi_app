# Schema da Base de Dados - Perpi
**Projeto:** perpi  
**Região:** eu-west-3  
**PostgreSQL:** 17.4.1.054  
**Data de Exportação:** 30/10/2025

---

## 📊 Tabelas Principais

### 1. **users_** (Usuários)
- **PK:** id (uuid)
- **Campos:**
  - email, full_name, password_hash
  - user_role: customer | driver | admin
  - is_verified (boolean)
  - celular, cidade, provincia, pais
  - endereco, latitude, longitude
  - profile_picture_url
  - created_at, updated_at

### 2. **entregadores** (Entregadores)
- **PK:** id (uuid)
- **FK:** user_id → auth.users
- **Campos:**
  - nome_completo, telefone, email
  - data_nascimento, numero_bi, numero_passaporte
  - endereco
  - foto_perfil, foto_bi, foto_passaporte
  - status_verificacao: pendente | aprovado | rejeitado
  - aceite_termos (boolean)
  - veiculo_tipo: moto | bicicleta | carro | pe
  - veiculo_placa, conta_bancaria
  - disponivel (boolean)
  - avaliacao_media, total_entregas

### 3. **products** (Produtos)
- **PK:** id (int)
- **FK:** category_id → categories
- **Campos:**
  - name, description, price
  - stock_quantity, unidade
  - image_url
  - is_active (boolean)
  - created_at, updated_at

### 4. **categories** (Categorias)
- **PK:** id (int)
- **FK:** parent_id → categories (self-reference)
- **Campos:**
  - name (unique)
  - img_url
  - created_at, updated_at

### 5. **orders** (Pedidos)
- **PK:** id (int)
- **FK:** 
  - customer_id → users_
  - delivery_address_id → addresses
  - entregador_id → entregadores
- **Campos:**
  - total_amount
  - order_status: pending | preparing | sent | delivered | cancelled
  - payment_method: mpesa | emola | credit_card
  - payment_status: pending | completed | failed | refunded | cancelled
  - endereco_entrega, cidade_entrega, provincia_entrega, pais_entrega
  - latitude_entrega, longitude_entrega
  - cancellation_fee_applied, cancellation_reason
  - created_at, updated_at

### 6. **pedidos** (Sistema de Entregadores)
- **PK:** id (uuid)
- **FK:**
  - cliente_id → auth.users
  - entregador_id → entregadores
- **Campos:**
  - status: novo | atribuido | aceito | coletado | em_transito | entregue | cancelado
  - endereco_coleta, endereco_entrega
  - coordenadas_coleta, coordenadas_entrega (point)
  - distancia_km, valor_entrega, valor_total
  - tempo_estimado
  - foto_confirmacao, observacoes

### 7. **order_items** (Itens do Pedido)
- **PK:** id (int)
- **FK:**
  - order_id → orders
  - product_id → products
- **Campos:**
  - quantity
  - price_at_purchase

### 8. **itens_pedido** (Sistema Entregadores)
- **PK:** id (uuid)
- **FK:** pedido_id → pedidos
- **Campos:**
  - produto_nome
  - quantidade, preco_unitario, preco_total

### 9. **carts** (Carrinhos)
- **PK:** id (int)
- **FK:** user_id → users_
- **Campos:**
  - created_at, updated_at

### 10. **cart_items** (Itens do Carrinho)
- **PK:** id (int)
- **FK:**
  - cart_id → carts
  - product_id → products
- **Campos:**
  - quantity, price_at_add

### 11. **addresses** (Endereços)
- **PK:** id (int)
- **FK:** user_id → users_
- **Campos:**
  - street, city, state, zip_code
  - latitude, longitude
  - is_default (boolean)

### 12. **favorites** (Favoritos)
- **PK:** id (int)
- **FK:**
  - user_id → users_
  - product_id → products

### 13. **promotions** (Promoções)
- **PK:** id (int)
- **Campos:**
  - name, description
  - discount_percentage, discount_amount
  - start_date, end_date
  - is_active (boolean)

### 14. **product_promotions** (Produtos em Promoção)
- **PK Composta:** product_id, promotion_id
- **FK:**
  - product_id → products
  - promotion_id → promotions

### 15. **transactions** (Transações)
- **PK:** id (int)
- **FK:**
  - user_id → users_
  - order_id → orders
- **Campos:**
  - amount, transaction_type
  - payment_method: mpesa | emola | credit_card
  - transaction_status: pending | completed | failed | refunded | cancelled
  - external_transaction_id

### 16. **deliveries** (Entregas)
- **PK:** id (int)
- **FK:**
  - order_id → orders (unique)
  - driver_id → users_
- **Campos:**
  - start_time, end_time
  - delivery_status: pending | preparing | sent | delivered | cancelled
  - pickup_latitude, pickup_longitude
  - delivery_latitude, delivery_longitude
  - distance_km, delivery_fee
  - confirmation_photo_url

### 17. **rastreamento_pedidos** (Rastreamento)
- **PK:** id (uuid)
- **FK:**
  - pedido_id → pedidos
  - entregador_id → entregadores
- **Campos:**
  - latitude, longitude
  - status, observacao
  - foto_url
  - created_at

### 18. **ratings** (Avaliações)
- **PK:** id (int)
- **FK:**
  - rater_user_id → users_
  - rated_user_id → users_
  - product_id → products
  - order_id → orders
- **Campos:**
  - rating_value (int)
  - comment

### 19. **avaliacoes_entregadores** (Avaliações de Entregadores)
- **PK:** id (uuid)
- **FK:**
  - pedido_id → pedidos
  - entregador_id → entregadores
  - cliente_id → auth.users
- **Campos:**
  - nota (1-5)
  - comentario

### 20. **chat_messages** (Mensagens de Chat)
- **PK:** id (int)
- **FK:**
  - sender_id → users_
  - receiver_id → users_
  - order_id → orders
- **Campos:**
  - message_text
  - sent_at, is_read (boolean)

### 21. **notifications** (Notificações)
- **PK:** id (int)
- **FK:** user_id → users_
- **Campos:**
  - title, message
  - notification_type
  - related_id
  - is_read (boolean)

### 22. **driver_documents** (Documentos do Motorista)
- **PK:** id (int)
- **FK:**
  - driver_id → users_
  - approved_by_admin_id → users_
- **Campos:**
  - document_type, document_url
  - is_approved (boolean)
  - uploaded_at, approved_at

### 23. **documentos_pendentes** (Sistema Entregadores)
- **PK:** id (uuid)
- **FK:** entregador_id → entregadores
- **Campos:**
  - tipo_documento, url_documento
  - status: pendente | aprovado | rejeitado
  - observacoes_admin

### 24. **driver_terms_acceptance** (Aceite de Termos)
- **PK:** id (int)
- **FK:** driver_id → users_
- **Campos:**
  - terms_version
  - accepted_at

---

## 🔑 Enums (Tipos Personalizados)

### user_role
- customer
- driver
- admin

### order_status
- pending
- preparing
- sent
- delivered
- cancelled

### payment_method
- mpesa
- emola
- credit_card

### transaction_status
- pending
- completed
- failed
- refunded
- cancelled

---

## 📈 Funções do Banco de Dados

1. **calcular_distancia_km**(lat1, lat2, lon1, lon2) → number
   - Calcula distância entre coordenadas

2. **calcular_valor_entrega**(distancia_km) → number
   - Calcula valor da entrega baseado na distância

3. **get_dashboard_stats**() → Stats
   - Retorna estatísticas do dashboard

4. **get_pedidos_por_mes**() → Array
   - Retorna pedidos agrupados por mês

5. **get_produtos_mais_vendidos**() → Array
   - Retorna produtos mais vendidos

6. **get_usuarios_por_mes**() → Array
   - Retorna novos usuários por mês

---

## 🔐 Row Level Security (RLS)

### Tabelas com RLS Habilitado:
- ✅ users_
- ✅ products
- ✅ carts
- ✅ cart_items
- ✅ order_items
- ✅ transactions
- ✅ deliveries
- ✅ ratings
- ✅ favorites
- ✅ chat_messages
- ✅ notifications
- ✅ pedidos
- ✅ itens_pedido
- ✅ rastreamento_pedidos
- ✅ avaliacoes_entregadores
- ✅ documentos_pendentes

---

## 📦 Extensões Instaladas

1. **pg_stat_statements** (v1.11) - Estatísticas SQL
2. **pg_graphql** (v1.5.11) - Suporte GraphQL
3. **pgcrypto** (v1.3) - Funções criptográficas
4. **uuid-ossp** (v1.1) - Geração de UUIDs
5. **plpgsql** (v1.0) - Linguagem procedural
6. **supabase_vault** (v0.3.1) - Cofre Supabase

---

## 🗺️ Diagrama de Relacionamentos

```
users_ (1) ─────→ (N) addresses
users_ (1) ─────→ (N) orders (como customer)
users_ (1) ─────→ (N) carts
users_ (1) ─────→ (N) favorites
users_ (1) ─────→ (N) ratings (como rater)
users_ (1) ─────→ (N) ratings (como rated)
users_ (1) ─────→ (N) notifications
users_ (1) ─────→ (N) transactions
users_ (1) ─────→ (N) deliveries (como driver)
users_ (1) ─────→ (N) chat_messages (sender/receiver)
users_ (1) ─────→ (N) driver_documents
users_ (1) ─────→ (1) entregadores

entregadores (1) ─→ (N) pedidos
entregadores (1) ─→ (N) orders
entregadores (1) ─→ (N) rastreamento_pedidos
entregadores (1) ─→ (N) avaliacoes_entregadores
entregadores (1) ─→ (N) documentos_pendentes

categories (1) ──→ (N) products
categories (1) ──→ (N) categories (hierarquia)

products (1) ────→ (N) cart_items
products (1) ────→ (N) order_items
products (1) ────→ (N) favorites
products (1) ────→ (N) ratings
products (1) ────→ (N) product_promotions

orders (1) ──────→ (N) order_items
orders (1) ──────→ (1) deliveries
orders (1) ──────→ (1) transactions
orders (1) ──────→ (N) ratings
orders (1) ──────→ (N) chat_messages

pedidos (1) ─────→ (N) itens_pedido
pedidos (1) ─────→ (N) rastreamento_pedidos
pedidos (1) ─────→ (N) avaliacoes_entregadores

carts (1) ───────→ (N) cart_items

promotions (1) ──→ (N) product_promotions
```

---

## 📊 Estatísticas do Schema

- **Total de Tabelas:** 24
- **Total de Enums:** 4
- **Total de Funções:** 6
- **Extensões Ativas:** 6
- **Tabelas com RLS:** 15
- **Relacionamentos (Foreign Keys):** 50+

---

## 🔄 Sistema Duplo de Pedidos

O sistema possui duas estruturas de pedidos:

### Sistema Legado (orders/order_items)
- Baseado em IDs inteiros
- Integrado com sistema de usuários original
- Foco em e-commerce tradicional

### Sistema de Entregadores (pedidos/itens_pedido)
- Baseado em UUIDs
- Sistema completo de entregadores
- Rastreamento em tempo real
- Sistema de avaliações dedicado

**Nota:** Ambos os sistemas estão ativos e interconectados através da FK `orders.entregador_id → entregadores.id`

---

## 📝 Notas Importantes

1. O schema utiliza tanto `auth.users` (Supabase Auth) quanto `users_` (tabela customizada)
2. Sistema híbrido com dois fluxos de pedidos (legado + entregadores)
3. Suporte para múltiplos métodos de pagamento locais (MPesa, Emola)
4. Sistema completo de geolocalização com latitude/longitude
5. Sistema de avaliações duplo (geral + específico para entregadores)
6. Estrutura preparada para expansão com categorias hierárquicas
