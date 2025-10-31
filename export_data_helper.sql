-- ============================================================================
-- SCRIPT AUXILIAR PARA EXPORTAR DADOS DO SUPABASE
-- Execute este script no SQL Editor do Supabase para gerar os INSERTs
-- ============================================================================

-- INSTRUÇÕES:
-- 1. Copie cada bloco SELECT abaixo
-- 2. Execute no SQL Editor do Supabase
-- 3. Copie os resultados
-- 4. Cole no arquivo supabase_data_inserts.sql

-- ============================================================================
-- EXPORTAR DADOS DE CATEGORIES
-- ============================================================================
SELECT 
    'INSERT INTO categories (id, name, parent_id, img_url, created_at, updated_at) VALUES (' ||
    id || ', ' ||
    quote_literal(name) || ', ' ||
    COALESCE(parent_id::TEXT, 'NULL') || ', ' ||
    COALESCE(quote_literal(img_url), 'NULL') || ', ' ||
    quote_literal(created_at::TEXT) || ', ' ||
    quote_literal(updated_at::TEXT) ||
    ');' as insert_statement
FROM categories
ORDER BY id;

-- ============================================================================
-- EXPORTAR DADOS DE PRODUCTS
-- ============================================================================
SELECT 
    'INSERT INTO products (id, name, description, price, stock_quantity, category_id, image_url, is_active, unidade, created_at, updated_at) VALUES (' ||
    id || ', ' ||
    quote_literal(name) || ', ' ||
    COALESCE(quote_literal(description), 'NULL') || ', ' ||
    price || ', ' ||
    stock_quantity || ', ' ||
    category_id || ', ' ||
    COALESCE(quote_literal(image_url), 'NULL') || ', ' ||
    is_active || ', ' ||
    COALESCE(quote_literal(unidade), 'NULL') || ', ' ||
    quote_literal(created_at::TEXT) || ', ' ||
    quote_literal(updated_at::TEXT) ||
    ');' as insert_statement
FROM products
ORDER BY id;

-- ============================================================================
-- EXPORTAR DADOS DE USERS_
-- ============================================================================
SELECT 
    'INSERT INTO users_ (id, email, password_hash, full_name, user_role, is_verified, social_id, profile_picture_url, uuid, nome, sobrenome, celular, cidade, provincia, pais, endereco, latitude, longitude, created_at, updated_at) VALUES (' ||
    quote_literal(id::TEXT) || '::UUID, ' ||
    quote_literal(email) || ', ' ||
    quote_literal(password_hash) || ', ' ||
    quote_literal(full_name) || ', ' ||
    quote_literal(user_role::TEXT) || '::user_role, ' ||
    is_verified || ', ' ||
    COALESCE(quote_literal(social_id), 'NULL') || ', ' ||
    COALESCE(quote_literal(profile_picture_url), 'NULL') || ', ' ||
    COALESCE(quote_literal(uuid::TEXT) || '::UUID', 'NULL') || ', ' ||
    COALESCE(quote_literal(nome), 'NULL') || ', ' ||
    COALESCE(quote_literal(sobrenome), 'NULL') || ', ' ||
    COALESCE(quote_literal(celular), 'NULL') || ', ' ||
    COALESCE(quote_literal(cidade), 'NULL') || ', ' ||
    COALESCE(quote_literal(provincia), 'NULL') || ', ' ||
    COALESCE(quote_literal(pais), 'NULL') || ', ' ||
    COALESCE(quote_literal(endereco), 'NULL') || ', ' ||
    COALESCE(latitude::TEXT, 'NULL') || ', ' ||
    COALESCE(longitude::TEXT, 'NULL') || ', ' ||
    quote_literal(created_at::TEXT) || '::TIMESTAMP, ' ||
    quote_literal(updated_at::TEXT) || '::TIMESTAMP' ||
    ');' as insert_statement
FROM users_
ORDER BY created_at;

-- ============================================================================
-- EXPORTAR DADOS DE ENTREGADORES
-- ============================================================================
SELECT 
    'INSERT INTO entregadores (id, user_id, nome_completo, telefone, email, data_nascimento, numero_bi, numero_passaporte, endereco, foto_perfil, foto_bi, foto_passaporte, status_verificacao, aceite_termos, veiculo_tipo, veiculo_placa, conta_bancaria, disponivel, avaliacao_media, total_entregas, created_at, updated_at) VALUES (' ||
    quote_literal(id::TEXT) || '::UUID, ' ||
    COALESCE(quote_literal(user_id::TEXT) || '::UUID', 'NULL') || ', ' ||
    quote_literal(nome_completo) || ', ' ||
    quote_literal(telefone) || ', ' ||
    quote_literal(email) || ', ' ||
    COALESCE(quote_literal(data_nascimento), 'NULL') || ', ' ||
    COALESCE(quote_literal(numero_bi), 'NULL') || ', ' ||
    COALESCE(quote_literal(numero_passaporte), 'NULL') || ', ' ||
    quote_literal(endereco) || ', ' ||
    COALESCE(quote_literal(foto_perfil), 'NULL') || ', ' ||
    COALESCE(quote_literal(foto_bi), 'NULL') || ', ' ||
    COALESCE(quote_literal(foto_passaporte), 'NULL') || ', ' ||
    COALESCE(quote_literal(status_verificacao), 'NULL') || ', ' ||
    COALESCE(aceite_termos::TEXT, 'NULL') || ', ' ||
    COALESCE(quote_literal(veiculo_tipo), 'NULL') || ', ' ||
    COALESCE(quote_literal(veiculo_placa), 'NULL') || ', ' ||
    COALESCE(quote_literal(conta_bancaria), 'NULL') || ', ' ||
    COALESCE(disponivel::TEXT, 'NULL') || ', ' ||
    COALESCE(avaliacao_media::TEXT, 'NULL') || ', ' ||
    COALESCE(total_entregas::TEXT, 'NULL') || ', ' ||
    quote_literal(created_at::TEXT) || '::TIMESTAMPTZ, ' ||
    quote_literal(updated_at::TEXT) || '::TIMESTAMPTZ' ||
    ');' as insert_statement
FROM entregadores
ORDER BY created_at;

-- ============================================================================
-- EXPORTAR DADOS DE ADDRESSES
-- ============================================================================
SELECT 
    'INSERT INTO addresses (id, user_id, street, city, state, zip_code, latitude, longitude, is_default, created_at, updated_at) VALUES (' ||
    id || ', ' ||
    COALESCE(quote_literal(user_id::TEXT) || '::UUID', 'NULL') || ', ' ||
    quote_literal(street) || ', ' ||
    quote_literal(city) || ', ' ||
    quote_literal(state) || ', ' ||
    quote_literal(zip_code) || ', ' ||
    COALESCE(latitude::TEXT, 'NULL') || ', ' ||
    COALESCE(longitude::TEXT, 'NULL') || ', ' ||
    is_default || ', ' ||
    quote_literal(created_at::TEXT) || '::TIMESTAMP, ' ||
    quote_literal(updated_at::TEXT) || '::TIMESTAMP' ||
    ');' as insert_statement
FROM addresses
ORDER BY id;

-- ============================================================================
-- EXPORTAR DADOS DE ORDERS
-- ============================================================================
SELECT 
    'INSERT INTO orders (id, customer_id, delivery_address_id, entregador_id, total_amount, order_status, payment_method, payment_status, cancellation_fee_applied, cancellation_reason, endereco_entrega, cidade_entrega, provincia_entrega, pais_entrega, latitude_entrega, longitude_entrega, created_at, updated_at) VALUES (' ||
    id || ', ' ||
    COALESCE(quote_literal(customer_id::TEXT) || '::UUID', 'NULL') || ', ' ||
    COALESCE(delivery_address_id::TEXT, 'NULL') || ', ' ||
    COALESCE(quote_literal(entregador_id::TEXT) || '::UUID', 'NULL') || ', ' ||
    total_amount || ', ' ||
    quote_literal(order_status::TEXT) || '::order_status, ' ||
    quote_literal(payment_method::TEXT) || '::payment_method, ' ||
    quote_literal(payment_status::TEXT) || '::transaction_status, ' ||
    cancellation_fee_applied || ', ' ||
    COALESCE(quote_literal(cancellation_reason), 'NULL') || ', ' ||
    COALESCE(quote_literal(endereco_entrega), 'NULL') || ', ' ||
    COALESCE(quote_literal(cidade_entrega), 'NULL') || ', ' ||
    COALESCE(quote_literal(provincia_entrega), 'NULL') || ', ' ||
    COALESCE(quote_literal(pais_entrega), 'NULL') || ', ' ||
    COALESCE(latitude_entrega::TEXT, 'NULL') || ', ' ||
    COALESCE(longitude_entrega::TEXT, 'NULL') || ', ' ||
    quote_literal(created_at::TEXT) || '::TIMESTAMP, ' ||
    quote_literal(updated_at::TEXT) || '::TIMESTAMP' ||
    ');' as insert_statement
FROM orders
ORDER BY id;

-- ============================================================================
-- EXPORTAR DADOS DE ORDER_ITEMS
-- ============================================================================
SELECT 
    'INSERT INTO order_items (id, order_id, product_id, quantity, price_at_purchase, created_at, updated_at) VALUES (' ||
    id || ', ' ||
    order_id || ', ' ||
    product_id || ', ' ||
    quantity || ', ' ||
    price_at_purchase || ', ' ||
    quote_literal(created_at::TEXT) || '::TIMESTAMP, ' ||
    quote_literal(updated_at::TEXT) || '::TIMESTAMP' ||
    ');' as insert_statement
FROM order_items
ORDER BY id;

-- ============================================================================
-- EXPORTAR DADOS DE PEDIDOS (Sistema Entregadores)
-- ============================================================================
SELECT 
    'INSERT INTO pedidos (id, cliente_id, entregador_id, status, endereco_coleta, endereco_entrega, coordenadas_coleta, coordenadas_entrega, distancia_km, valor_entrega, valor_total, tempo_estimado, foto_confirmacao, observacoes, created_at, updated_at) VALUES (' ||
    quote_literal(id::TEXT) || '::UUID, ' ||
    COALESCE(quote_literal(cliente_id::TEXT) || '::UUID', 'NULL') || ', ' ||
    COALESCE(quote_literal(entregador_id::TEXT) || '::UUID', 'NULL') || ', ' ||
    COALESCE(quote_literal(status), 'NULL') || ', ' ||
    quote_literal(endereco_coleta) || ', ' ||
    quote_literal(endereco_entrega) || ', ' ||
    COALESCE(quote_literal(coordenadas_coleta::TEXT) || '::POINT', 'NULL') || ', ' ||
    COALESCE(quote_literal(coordenadas_entrega::TEXT) || '::POINT', 'NULL') || ', ' ||
    COALESCE(distancia_km::TEXT, 'NULL') || ', ' ||
    COALESCE(valor_entrega::TEXT, 'NULL') || ', ' ||
    COALESCE(valor_total::TEXT, 'NULL') || ', ' ||
    COALESCE(tempo_estimado::TEXT, 'NULL') || ', ' ||
    COALESCE(quote_literal(foto_confirmacao), 'NULL') || ', ' ||
    COALESCE(quote_literal(observacoes), 'NULL') || ', ' ||
    quote_literal(created_at::TEXT) || '::TIMESTAMPTZ, ' ||
    quote_literal(updated_at::TEXT) || '::TIMESTAMPTZ' ||
    ');' as insert_statement
FROM pedidos
ORDER BY created_at;

-- ============================================================================
-- EXPORTAR DADOS DE PROMOTIONS
-- ============================================================================
SELECT 
    'INSERT INTO promotions (id, name, description, discount_percentage, discount_amount, start_date, end_date, is_active, created_at, updated_at) VALUES (' ||
    id || ', ' ||
    quote_literal(name) || ', ' ||
    COALESCE(quote_literal(description), 'NULL') || ', ' ||
    COALESCE(discount_percentage::TEXT, 'NULL') || ', ' ||
    COALESCE(discount_amount::TEXT, 'NULL') || ', ' ||
    quote_literal(start_date::TEXT) || '::TIMESTAMP, ' ||
    quote_literal(end_date::TEXT) || '::TIMESTAMP, ' ||
    is_active || ', ' ||
    quote_literal(created_at::TEXT) || '::TIMESTAMP, ' ||
    quote_literal(updated_at::TEXT) || '::TIMESTAMP' ||
    ');' as insert_statement
FROM promotions
ORDER BY id;

-- ============================================================================
-- RESET SEQUENCES (Execute DEPOIS de importar os dados)
-- ============================================================================

-- Este comando deve ser executado após todos os INSERTs para ajustar as sequences
SELECT 'SELECT setval(''' || 
       pg_get_serial_sequence(table_name, column_name) || ''', ' ||
       '(SELECT MAX(' || column_name || ') FROM ' || table_name || '), true);' as reset_sequence
FROM (
    VALUES 
        ('categories', 'id'),
        ('products', 'id'),
        ('addresses', 'id'),
        ('carts', 'id'),
        ('cart_items', 'id'),
        ('promotions', 'id'),
        ('product_promotions', 'product_id'),
        ('orders', 'id'),
        ('order_items', 'id'),
        ('transactions', 'id'),
        ('deliveries', 'id'),
        ('driver_documents', 'id'),
        ('driver_terms_acceptance', 'id'),
        ('ratings', 'id'),
        ('favorites', 'id'),
        ('chat_messages', 'id'),
        ('notifications', 'id')
) AS t(table_name, column_name);

-- ============================================================================
-- VERIFICAÇÃO DE DADOS
-- ============================================================================

-- Execute este bloco para ver quantos registros existem em cada tabela
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
UNION ALL
SELECT 'pedidos', COUNT(*) FROM pedidos
UNION ALL
SELECT 'itens_pedido', COUNT(*) FROM itens_pedido
UNION ALL
SELECT 'carts', COUNT(*) FROM carts
UNION ALL
SELECT 'cart_items', COUNT(*) FROM cart_items
UNION ALL
SELECT 'promotions', COUNT(*) FROM promotions
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'deliveries', COUNT(*) FROM deliveries
UNION ALL
SELECT 'ratings', COUNT(*) FROM ratings
UNION ALL
SELECT 'favorites', COUNT(*) FROM favorites
ORDER BY tabela;
