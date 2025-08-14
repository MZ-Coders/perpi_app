-- Schema para sistema de entregadores

-- Tabela de entregadores
CREATE TABLE entregadores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT NOT NULL,
  data_nascimento DATE,
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
  avaliacao_media NUMERIC(3,2) DEFAULT 0,
  total_entregas INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de pedidos (expandida)
CREATE TABLE IF NOT EXISTS pedidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES auth.users(id),
  entregador_id UUID REFERENCES entregadores(id),
  status TEXT DEFAULT 'novo' CHECK (status IN ('novo', 'atribuido', 'aceito', 'coletado', 'em_transito', 'entregue', 'cancelado')),
  endereco_coleta TEXT NOT NULL,
  endereco_entrega TEXT NOT NULL,
  coordenadas_coleta POINT,
  coordenadas_entrega POINT,
  distancia_km NUMERIC(10,2),
  valor_entrega NUMERIC(10,2),
  valor_total NUMERIC(10,2),
  tempo_estimado INTEGER, -- em minutos
  foto_confirmacao TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de itens do pedido
CREATE TABLE IF NOT EXISTS itens_pedido (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
  produto_nome TEXT NOT NULL,
  quantidade INTEGER NOT NULL,
  preco_unitario NUMERIC(10,2) NOT NULL,
  preco_total NUMERIC(10,2) NOT NULL
);

-- Tabela de tracking/rastreamento
CREATE TABLE rastreamento_pedidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
  entregador_id UUID REFERENCES entregadores(id),
  latitude NUMERIC(10,8),
  longitude NUMERIC(10,8),
  status TEXT NOT NULL,
  observacao TEXT,
  foto_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de avaliações
CREATE TABLE avaliacoes_entregadores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID REFERENCES pedidos(id),
  entregador_id UUID REFERENCES entregadores(id),
  cliente_id UUID REFERENCES auth.users(id),
  nota INTEGER CHECK (nota >= 1 AND nota <= 5),
  comentario TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de documentos pendentes
CREATE TABLE documentos_pendentes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entregador_id UUID REFERENCES entregadores(id),
  tipo_documento TEXT NOT NULL,
  url_documento TEXT NOT NULL,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  observacoes_admin TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Políticas de segurança (RLS)
ALTER TABLE entregadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE rastreamento_pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE avaliacoes_entregadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos_pendentes ENABLE ROW LEVEL SECURITY;

-- Políticas para entregadores
CREATE POLICY "Entregadores podem ver seus próprios dados" ON entregadores
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Entregadores podem atualizar seus próprios dados" ON entregadores
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para pedidos
CREATE POLICY "Entregadores podem ver pedidos atribuídos" ON pedidos
  FOR SELECT USING (
    entregador_id IN (SELECT id FROM entregadores WHERE user_id = auth.uid())
    OR status = 'novo'
  );

CREATE POLICY "Entregadores podem atualizar pedidos atribuídos" ON pedidos
  FOR UPDATE USING (
    entregador_id IN (SELECT id FROM entregadores WHERE user_id = auth.uid())
  );

-- Função para calcular distância
CREATE OR REPLACE FUNCTION calcular_distancia_km(lat1 NUMERIC, lon1 NUMERIC, lat2 NUMERIC, lon2 NUMERIC)
RETURNS NUMERIC AS $$
BEGIN
  RETURN (
    6371 * acos(
      cos(radians(lat1)) * cos(radians(lat2)) * cos(radians(lon2) - radians(lon1)) +
      sin(radians(lat1)) * sin(radians(lat2))
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Função para calcular valor da entrega (0.50 MZN por km)
CREATE OR REPLACE FUNCTION calcular_valor_entrega(distancia_km NUMERIC)
RETURNS NUMERIC AS $$
BEGIN
  RETURN GREATEST(50, distancia_km * 0.50); -- Mínimo 50 MZN
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_entregadores_updated_at BEFORE UPDATE ON entregadores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pedidos_updated_at BEFORE UPDATE ON pedidos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
