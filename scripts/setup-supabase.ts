import { supabase } from '../lib/supabaseClient';

/**
 * Script para configurar automaticamente o banco de dados Supabase
 * Execute este script para criar todas as tabelas e configurações necessárias
 */

const SQL_SCHEMA = `
-- Schema para sistema de entregadores

-- Tabela de entregadores
CREATE TABLE IF NOT EXISTS entregadores (
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
  tempo_estimado INTEGER,
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
CREATE TABLE IF NOT EXISTS rastreamento_pedidos (
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
CREATE TABLE IF NOT EXISTS avaliacoes_entregadores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID REFERENCES pedidos(id),
  entregador_id UUID REFERENCES entregadores(id),
  cliente_id UUID REFERENCES auth.users(id),
  nota INTEGER CHECK (nota >= 1 AND nota <= 5),
  comentario TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de documentos pendentes
CREATE TABLE IF NOT EXISTS documentos_pendentes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entregador_id UUID REFERENCES entregadores(id),
  tipo_documento TEXT NOT NULL,
  url_documento TEXT NOT NULL,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  observacoes_admin TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`;

const SQL_POLICIES = `
-- Políticas de segurança (RLS)
DO $$ 
BEGIN
  -- Habilitar RLS apenas se ainda não estiver habilitado
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'entregadores' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE entregadores ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'pedidos' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'itens_pedido' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE itens_pedido ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'rastreamento_pedidos' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE rastreamento_pedidos ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'avaliacoes_entregadores' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE avaliacoes_entregadores ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'documentos_pendentes' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE documentos_pendentes ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Políticas para entregadores
DROP POLICY IF EXISTS "Entregadores podem ver seus próprios dados" ON entregadores;
CREATE POLICY "Entregadores podem ver seus próprios dados" ON entregadores
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Entregadores podem atualizar seus próprios dados" ON entregadores;
CREATE POLICY "Entregadores podem atualizar seus próprios dados" ON entregadores
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Entregadores podem inserir seus próprios dados" ON entregadores;
CREATE POLICY "Entregadores podem inserir seus próprios dados" ON entregadores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para pedidos
DROP POLICY IF EXISTS "Entregadores podem ver pedidos atribuídos" ON pedidos;
CREATE POLICY "Entregadores podem ver pedidos atribuídos" ON pedidos
  FOR SELECT USING (
    entregador_id IN (SELECT id FROM entregadores WHERE user_id = auth.uid())
    OR status = 'novo'
    OR cliente_id = auth.uid()
  );

DROP POLICY IF EXISTS "Entregadores podem atualizar pedidos atribuídos" ON pedidos;
CREATE POLICY "Entregadores podem atualizar pedidos atribuídos" ON pedidos
  FOR UPDATE USING (
    entregador_id IN (SELECT id FROM entregadores WHERE user_id = auth.uid())
  );
`;

const SQL_FUNCTIONS = `
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

-- Dropar triggers existentes se existirem
DROP TRIGGER IF EXISTS update_entregadores_updated_at ON entregadores;
DROP TRIGGER IF EXISTS update_pedidos_updated_at ON pedidos;

-- Criar triggers
CREATE TRIGGER update_entregadores_updated_at BEFORE UPDATE ON entregadores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pedidos_updated_at BEFORE UPDATE ON pedidos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

export class SupabaseSetup {
  /**
   * Executa o schema completo do banco de dados
   */
  static async executarSchema(): Promise<{ success: boolean; error?: any }> {
    try {
      console.log('🔄 Executando schema do banco de dados...');
      
      // Executar criação de tabelas
      const { error: schemaError } = await supabase.rpc('exec_sql', { 
        sql: SQL_SCHEMA 
      });
      
      if (schemaError) {
        console.error('Erro no schema:', schemaError);
        return { success: false, error: schemaError };
      }

      // Executar funções e triggers
      const { error: functionsError } = await supabase.rpc('exec_sql', { 
        sql: SQL_FUNCTIONS 
      });
      
      if (functionsError) {
        console.error('Erro nas funções:', functionsError);
        return { success: false, error: functionsError };
      }

      // Executar políticas de segurança
      const { error: policiesError } = await supabase.rpc('exec_sql', { 
        sql: SQL_POLICIES 
      });
      
      if (policiesError) {
        console.error('Erro nas políticas:', policiesError);
        return { success: false, error: policiesError };
      }

      console.log('✅ Schema executado com sucesso!');
      return { success: true };
      
    } catch (error) {
      console.error('Erro inesperado:', error);
      return { success: false, error };
    }
  }

  /**
   * Cria o bucket de storage para documentos
   */
  static async criarBucketDocumentos(): Promise<{ success: boolean; error?: any }> {
    try {
      console.log('🔄 Criando bucket de documentos...');
      
      // Verificar se o bucket já existe
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === 'documentos');
      
      if (bucketExists) {
        console.log('ℹ️ Bucket "documentos" já existe');
        return { success: true };
      }

      // Criar bucket
      const { error } = await supabase.storage.createBucket('documentos', {
        public: false, // Documentos privados
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      });

      if (error) {
        console.error('Erro ao criar bucket:', error);
        return { success: false, error };
      }

      console.log('✅ Bucket "documentos" criado com sucesso!');
      return { success: true };
      
    } catch (error) {
      console.error('Erro inesperado:', error);
      return { success: false, error };
    }
  }

  /**
   * Configuração completa do Supabase
   */
  static async configurarCompleto(): Promise<{ success: boolean; errors: any[] }> {
    console.log('🚀 Iniciando configuração completa do Supabase...');
    
    const errors: any[] = [];

    // 1. Executar schema
    const schemaResult = await this.executarSchema();
    if (!schemaResult.success) {
      errors.push({ step: 'schema', error: schemaResult.error });
    }

    // 2. Criar bucket de documentos
    const bucketResult = await this.criarBucketDocumentos();
    if (!bucketResult.success) {
      errors.push({ step: 'bucket', error: bucketResult.error });
    }

    const success = errors.length === 0;
    
    if (success) {
      console.log('🎉 Configuração do Supabase concluída com sucesso!');
    } else {
      console.log('❌ Configuração concluída com erros:', errors);
    }

    return { success, errors };
  }

  /**
   * Verificar se as tabelas existem
   */
  static async verificarTabelasExistem(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('entregadores')
        .select('id')
        .limit(1);

      return !error;
    } catch {
      return false;
    }
  }
}

// Função utilitária para executar do terminal
export async function setupSupabase() {
  const result = await SupabaseSetup.configurarCompleto();
  
  if (result.success) {
    console.log('✅ Setup concluído! O sistema de entregadores está pronto.');
  } else {
    console.log('❌ Setup falhou. Erros encontrados:');
    result.errors.forEach((err, index) => {
      console.log(`${index + 1}. ${err.step}:`, err.error);
    });
  }
  
  return result;
}
