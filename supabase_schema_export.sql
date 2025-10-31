-- ============================================================================
-- SCHEMA EXPORT - PERPI DATABASE
-- Data: 30/10/2025
-- PostgreSQL 17.4.1
-- ============================================================================

-- ============================================================================
-- 1. CRIAÇÃO DE ENUMS (Tipos Personalizados)
-- ============================================================================

-- Dropar tipos existentes se necessário (descomente se precisar recriar)
-- DROP TYPE IF EXISTS user_role CASCADE;
-- DROP TYPE IF EXISTS order_status CASCADE;
-- DROP TYPE IF EXISTS payment_method CASCADE;
-- DROP TYPE IF EXISTS transaction_status CASCADE;

-- Enum para role de usuário
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('customer', 'driver', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum para status de pedido
DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('pending', 'preparing', 'sent', 'delivered', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum para método de pagamento
DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('mpesa', 'emola', 'credit_card');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum para status de transação
DO $$ BEGIN
    CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'refunded', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 2. CRIAÇÃO DAS TABELAS PRINCIPAIS
-- ============================================================================

-- Tabela: users_ (Usuários principais)
CREATE TABLE users_ (
    id UUID PRIMARY KEY,
    email VARCHAR NOT NULL UNIQUE,
    password_hash VARCHAR NOT NULL,
    full_name VARCHAR NOT NULL,
    user_role user_role NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    social_id VARCHAR UNIQUE,
    profile_picture_url VARCHAR,
    uuid UUID UNIQUE DEFAULT gen_random_uuid(),
    nome TEXT,
    sobrenome TEXT,
    celular TEXT,
    cidade TEXT,
    provincia TEXT,
    pais TEXT,
    endereco TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabela: categories (Categorias de produtos)
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL UNIQUE,
    parent_id INTEGER REFERENCES categories(id),
    img_url TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabela: products (Produtos)
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    image_url VARCHAR,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    unidade VARCHAR,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabela: addresses (Endereços)
CREATE TABLE addresses (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users_(id),
    user_uuid UUID,
    street VARCHAR NOT NULL,
    city VARCHAR NOT NULL,
    state VARCHAR NOT NULL,
    zip_code VARCHAR NOT NULL,
    latitude NUMERIC,
    longitude NUMERIC,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabela: carts (Carrinhos de compras)
CREATE TABLE carts (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users_(id),
    user_uuid UUID,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabela: cart_items (Itens do carrinho)
CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    cart_id INTEGER NOT NULL REFERENCES carts(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    price_at_add NUMERIC NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabela: promotions (Promoções)
CREATE TABLE promotions (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    discount_percentage NUMERIC,
    discount_amount NUMERIC,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabela: product_promotions (Relação produtos-promoções)
CREATE TABLE product_promotions (
    product_id INTEGER NOT NULL REFERENCES products(id),
    promotion_id INTEGER NOT NULL REFERENCES promotions(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (product_id, promotion_id)
);

-- Tabela: orders (Pedidos principais)
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_id UUID REFERENCES users_(id),
    customer_uuid UUID,
    delivery_address_id INTEGER REFERENCES addresses(id),
    entregador_id UUID,
    total_amount NUMERIC NOT NULL,
    order_status order_status NOT NULL DEFAULT 'pending',
    payment_method payment_method NOT NULL,
    payment_status transaction_status NOT NULL DEFAULT 'pending',
    cancellation_fee_applied BOOLEAN NOT NULL DEFAULT FALSE,
    cancellation_reason TEXT,
    endereco_entrega TEXT,
    cidade_entrega TEXT,
    provincia_entrega TEXT,
    pais_entrega TEXT,
    latitude_entrega NUMERIC,
    longitude_entrega NUMERIC,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabela: order_items (Itens do pedido)
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price_at_purchase NUMERIC NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabela: transactions (Transações financeiras)
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users_(id),
    order_id INTEGER UNIQUE REFERENCES orders(id),
    amount NUMERIC NOT NULL,
    transaction_type VARCHAR NOT NULL,
    payment_method payment_method,
    transaction_status transaction_status NOT NULL DEFAULT 'pending',
    external_transaction_id VARCHAR UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabela: deliveries (Entregas)
CREATE TABLE deliveries (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL UNIQUE REFERENCES orders(id),
    driver_id UUID REFERENCES users_(id),
    driver_uuid UUID,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    delivery_status order_status NOT NULL DEFAULT 'pending',
    pickup_latitude NUMERIC NOT NULL,
    pickup_longitude NUMERIC NOT NULL,
    delivery_latitude NUMERIC NOT NULL,
    delivery_longitude NUMERIC NOT NULL,
    distance_km NUMERIC,
    delivery_fee NUMERIC,
    confirmation_photo_url VARCHAR,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabela: driver_documents (Documentos do motorista)
CREATE TABLE driver_documents (
    id SERIAL PRIMARY KEY,
    driver_id UUID REFERENCES users_(id),
    document_type VARCHAR NOT NULL,
    document_url VARCHAR NOT NULL,
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
    approved_by_admin_id UUID REFERENCES users_(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabela: driver_terms_acceptance (Aceite de termos)
CREATE TABLE driver_terms_acceptance (
    id SERIAL PRIMARY KEY,
    driver_id UUID REFERENCES users_(id),
    terms_version VARCHAR NOT NULL,
    accepted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabela: ratings (Avaliações)
CREATE TABLE ratings (
    id SERIAL PRIMARY KEY,
    rater_user_id UUID REFERENCES users_(id),
    rated_user_id UUID REFERENCES users_(id),
    rater_user_uuid UUID,
    rated_user_uuid UUID,
    product_id INTEGER REFERENCES products(id),
    order_id INTEGER REFERENCES orders(id),
    rating_value INTEGER NOT NULL,
    comment TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabela: favorites (Favoritos)
CREATE TABLE favorites (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users_(id),
    user_uuid UUID,
    product_id INTEGER NOT NULL REFERENCES products(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabela: chat_messages (Mensagens de chat)
CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    sender_id UUID REFERENCES users_(id),
    receiver_id UUID REFERENCES users_(id),
    sender_uuid UUID,
    receiver_uuid UUID,
    order_id INTEGER REFERENCES orders(id),
    message_text TEXT NOT NULL,
    sent_at TIMESTAMP NOT NULL DEFAULT NOW(),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabela: notifications (Notificações)
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users_(id),
    user_uuid UUID,
    title VARCHAR NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR,
    related_id INTEGER,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. SISTEMA DE ENTREGADORES (Nova estrutura)
-- ============================================================================

-- Tabela: entregadores
CREATE TABLE entregadores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    nome_completo TEXT NOT NULL,
    telefone TEXT NOT NULL,
    email TEXT NOT NULL,
    data_nascimento TEXT,
    numero_bi TEXT,
    numero_passaporte TEXT,
    endereco TEXT NOT NULL,
    foto_perfil TEXT,
    foto_bi TEXT,
    foto_passaporte TEXT,
    status_verificacao TEXT DEFAULT 'pendente' CHECK (status_verificacao IN ('pendente', 'aprovado', 'rejeitado')),
    aceite_termos BOOLEAN DEFAULT FALSE,
    veiculo_tipo TEXT CHECK (veiculo_tipo IN ('moto', 'bicicleta', 'carro', 'pe')),
    veiculo_placa TEXT,
    conta_bancaria TEXT,
    disponivel BOOLEAN DEFAULT FALSE,
    avaliacao_media NUMERIC DEFAULT 0,
    total_entregas INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: pedidos (Sistema de entregadores)
CREATE TABLE pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES auth.users(id),
    entregador_id UUID REFERENCES entregadores(id),
    status TEXT DEFAULT 'novo' CHECK (status IN ('novo', 'atribuido', 'aceito', 'coletado', 'em_transito', 'entregue', 'cancelado')),
    endereco_coleta TEXT NOT NULL,
    endereco_entrega TEXT NOT NULL,
    coordenadas_coleta POINT,
    coordenadas_entrega POINT,
    distancia_km NUMERIC,
    valor_entrega NUMERIC,
    valor_total NUMERIC,
    tempo_estimado INTEGER,
    foto_confirmacao TEXT,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: itens_pedido (Itens do sistema de entregadores)
CREATE TABLE itens_pedido (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID REFERENCES pedidos(id),
    produto_nome TEXT NOT NULL,
    quantidade INTEGER NOT NULL,
    preco_unitario NUMERIC NOT NULL,
    preco_total NUMERIC NOT NULL
);

-- Tabela: rastreamento_pedidos (Rastreamento em tempo real)
CREATE TABLE rastreamento_pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID REFERENCES pedidos(id),
    entregador_id UUID REFERENCES entregadores(id),
    latitude NUMERIC,
    longitude NUMERIC,
    status TEXT NOT NULL,
    observacao TEXT,
    foto_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: avaliacoes_entregadores (Avaliações de entregadores)
CREATE TABLE avaliacoes_entregadores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID REFERENCES pedidos(id),
    entregador_id UUID REFERENCES entregadores(id),
    cliente_id UUID REFERENCES auth.users(id),
    nota INTEGER CHECK (nota >= 1 AND nota <= 5),
    comentario TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: documentos_pendentes (Documentos pendentes de aprovação)
CREATE TABLE documentos_pendentes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entregador_id UUID REFERENCES entregadores(id),
    tipo_documento TEXT NOT NULL,
    url_documento TEXT NOT NULL,
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
    observacoes_admin TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. FOREIGN KEYS ADICIONAIS
-- ============================================================================

-- Adicionar FK de orders para entregadores
ALTER TABLE orders 
ADD CONSTRAINT orders_entregador_id_fkey 
FOREIGN KEY (entregador_id) REFERENCES entregadores(id);

-- ============================================================================
-- 5. ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Índices para users_
CREATE INDEX idx_users_email ON users_(email);
CREATE INDEX idx_users_role ON users_(user_role);
CREATE INDEX idx_users_uuid ON users_(uuid);

-- Índices para products
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_name ON products(name);

-- Índices para orders
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_orders_entregador ON orders(entregador_id);

-- Índices para entregadores
CREATE INDEX idx_entregadores_user ON entregadores(user_id);
CREATE INDEX idx_entregadores_status ON entregadores(status_verificacao);
CREATE INDEX idx_entregadores_disponivel ON entregadores(disponivel);

-- Índices para pedidos
CREATE INDEX idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX idx_pedidos_entregador ON pedidos(entregador_id);
CREATE INDEX idx_pedidos_status ON pedidos(status);
CREATE INDEX idx_pedidos_created ON pedidos(created_at);

-- Índices para rastreamento
CREATE INDEX idx_rastreamento_pedido ON rastreamento_pedidos(pedido_id);
CREATE INDEX idx_rastreamento_entregador ON rastreamento_pedidos(entregador_id);

-- ============================================================================
-- 6. FUNÇÕES DO BANCO DE DADOS
-- ============================================================================

-- Função: Calcular distância entre dois pontos (Haversine)
CREATE OR REPLACE FUNCTION calcular_distancia_km(
    lat1 NUMERIC,
    lon1 NUMERIC,
    lat2 NUMERIC,
    lon2 NUMERIC
) RETURNS NUMERIC AS $$
DECLARE
    r NUMERIC := 6371; -- Raio da Terra em km
    dlat NUMERIC;
    dlon NUMERIC;
    a NUMERIC;
    c NUMERIC;
BEGIN
    dlat := radians(lat2 - lat1);
    dlon := radians(lon2 - lon1);
    
    a := sin(dlat/2) * sin(dlat/2) + 
         cos(radians(lat1)) * cos(radians(lat2)) * 
         sin(dlon/2) * sin(dlon/2);
    
    c := 2 * atan2(sqrt(a), sqrt(1-a));
    
    RETURN r * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Função: Calcular valor da entrega baseado na distância
CREATE OR REPLACE FUNCTION calcular_valor_entrega(distancia_km NUMERIC) 
RETURNS NUMERIC AS $$
DECLARE
    valor_base NUMERIC := 50.00;
    valor_por_km NUMERIC := 10.00;
BEGIN
    RETURN valor_base + (distancia_km * valor_por_km);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Função: Estatísticas do Dashboard
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE (
    total_usuarios INTEGER,
    total_pedidos INTEGER,
    receita_total NUMERIC,
    ticket_medio NUMERIC,
    produtos_ativos INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM users_) as total_usuarios,
        (SELECT COUNT(*)::INTEGER FROM orders) as total_pedidos,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE payment_status = 'completed') as receita_total,
        (SELECT COALESCE(AVG(total_amount), 0) FROM orders WHERE payment_status = 'completed') as ticket_medio,
        (SELECT COUNT(*)::INTEGER FROM products WHERE is_active = TRUE) as produtos_ativos;
END;
$$ LANGUAGE plpgsql;

-- Função: Pedidos por mês
CREATE OR REPLACE FUNCTION get_pedidos_por_mes()
RETURNS TABLE (
    mes TEXT,
    total_pedidos BIGINT,
    receita_mes NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as mes,
        COUNT(*) as total_pedidos,
        COALESCE(SUM(total_amount), 0) as receita_mes
    FROM orders
    WHERE payment_status = 'completed'
    GROUP BY TO_CHAR(created_at, 'YYYY-MM')
    ORDER BY mes DESC
    LIMIT 12;
END;
$$ LANGUAGE plpgsql;

-- Função: Produtos mais vendidos
CREATE OR REPLACE FUNCTION get_produtos_mais_vendidos()
RETURNS TABLE (
    produto_nome TEXT,
    total_vendido BIGINT,
    receita_produto NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.name as produto_nome,
        SUM(oi.quantity) as total_vendido,
        SUM(oi.quantity * oi.price_at_purchase) as receita_produto
    FROM products p
    JOIN order_items oi ON p.id = oi.product_id
    JOIN orders o ON oi.order_id = o.id
    WHERE o.payment_status = 'completed'
    GROUP BY p.name
    ORDER BY total_vendido DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Função: Novos usuários por mês
CREATE OR REPLACE FUNCTION get_usuarios_por_mes()
RETURNS TABLE (
    mes TEXT,
    novos_usuarios BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as mes,
        COUNT(*) as novos_usuarios
    FROM users_
    GROUP BY TO_CHAR(created_at, 'YYYY-MM')
    ORDER BY mes DESC
    LIMIT 12;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. TRIGGERS AUTOMÁTICOS
-- ============================================================================

-- Trigger: Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as tabelas relevantes
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users_
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON addresses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON carts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entregadores_updated_at BEFORE UPDATE ON entregadores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pedidos_updated_at BEFORE UPDATE ON pedidos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. ROW LEVEL SECURITY (RLS) - Políticas básicas
-- ============================================================================

-- Habilitar RLS nas tabelas principais
ALTER TABLE users_ ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE rastreamento_pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE avaliacoes_entregadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos_pendentes ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver seus próprios dados
CREATE POLICY "Users can view own data" ON users_
    FOR SELECT USING (auth.uid() = id);

-- Política: Produtos visíveis para todos
CREATE POLICY "Products are viewable by everyone" ON products
    FOR SELECT USING (is_active = TRUE);

-- Política: Usuários podem ver seus próprios carrinhos
CREATE POLICY "Users can view own carts" ON carts
    FOR ALL USING (auth.uid() = user_id);

-- Política: Usuários podem ver seus próprios pedidos
CREATE POLICY "Users can view own orders" ON orders
    FOR SELECT USING (auth.uid() = customer_id);

-- Política: Entregadores podem ver pedidos atribuídos a eles
CREATE POLICY "Drivers can view assigned orders" ON orders
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM entregadores WHERE id = orders.entregador_id
        )
    );

-- ============================================================================
-- 9. COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================================================

-- Comentários de documentação
COMMENT ON TABLE users_ IS 'Tabela principal de usuários do sistema';
COMMENT ON TABLE entregadores IS 'Tabela de entregadores com informações detalhadas';
COMMENT ON TABLE pedidos IS 'Sistema de pedidos para entregadores';
COMMENT ON TABLE products IS 'Catálogo de produtos';
COMMENT ON TABLE orders IS 'Pedidos do e-commerce';
COMMENT ON COLUMN users_.user_role IS 'Tipo de usuário: customer (cliente), driver (motorista), admin (administrador)';
COMMENT ON COLUMN entregadores.status_verificacao IS 'Status de verificação do entregador: pendente, aprovado, rejeitado';
COMMENT ON COLUMN orders.order_status IS 'Status do pedido: pending, preparing, sent, delivered, cancelled';

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================

-- Mensagem final
DO $$ 
BEGIN 
    RAISE NOTICE '✅ Schema criado com sucesso!';
    RAISE NOTICE '📊 Total de tabelas: 24';
    RAISE NOTICE '🔑 Total de enums: 4';
    RAISE NOTICE '📈 Total de funções: 6';
    RAISE NOTICE '🔐 RLS habilitado em 17 tabelas';
END $$;
