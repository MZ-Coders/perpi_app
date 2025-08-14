import { supabase } from '../lib/supabaseClient';

/**
 * Script simplificado para configurar o Supabase
 * Execute: npx tsx scripts/setup-simple.ts
 */

async function executarSQL(sql: string, description: string): Promise<boolean> {
  try {
    console.log(`🔄 ${description}...`);
    
    // Dividir o SQL em comandos individuais
    const comandos = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0);

    for (const comando of comandos) {
      if (comando.includes('CREATE TABLE') || comando.includes('ALTER TABLE') || comando.includes('DROP')) {
        // Para comandos DDL, tentar executar diretamente
        const { error } = await supabase.rpc('exec', { sql: comando });
        if (error && !error.message.includes('already exists')) {
          console.warn(`⚠️ Aviso em "${description}":`, error.message);
        }
      }
    }
    
    console.log(`✅ ${description} - Concluído`);
    return true;
  } catch (error) {
    console.error(`❌ Erro em "${description}":`, error);
    return false;
  }
}

async function criarTabelasManualmente() {
  console.log('🔄 Criando tabelas uma por uma...');
  
  const tabelas = [
    {
      nome: 'entregadores',
      sql: `
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
          status_verificacao TEXT DEFAULT 'pendente',
          aceite_termos BOOLEAN DEFAULT FALSE,
          veiculo_tipo TEXT,
          veiculo_placa TEXT,
          conta_bancaria TEXT,
          disponivel BOOLEAN DEFAULT FALSE,
          avaliacao_media NUMERIC(3,2) DEFAULT 0,
          total_entregas INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `
    },
    {
      nome: 'pedidos_entregadores',
      sql: `
        CREATE TABLE IF NOT EXISTS pedidos_entregadores (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          cliente_id UUID REFERENCES auth.users(id),
          entregador_id UUID REFERENCES entregadores(id),
          status TEXT DEFAULT 'novo',
          endereco_coleta TEXT NOT NULL,
          endereco_entrega TEXT NOT NULL,
          distancia_km NUMERIC(10,2),
          valor_entrega NUMERIC(10,2),
          valor_total NUMERIC(10,2),
          tempo_estimado INTEGER,
          foto_confirmacao TEXT,
          observacoes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `
    },
    {
      nome: 'rastreamento_entregas',
      sql: `
        CREATE TABLE IF NOT EXISTS rastreamento_entregas (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          pedido_id UUID REFERENCES pedidos_entregadores(id) ON DELETE CASCADE,
          entregador_id UUID REFERENCES entregadores(id),
          latitude NUMERIC(10,8),
          longitude NUMERIC(10,8),
          status TEXT NOT NULL,
          observacao TEXT,
          foto_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `
    }
  ];

  for (const tabela of tabelas) {
    try {
      console.log(`🔄 Criando tabela: ${tabela.nome}`);
      
      // Usar uma inserção dummy para verificar se a tabela existe
      const { error } = await supabase
        .from(tabela.nome)
        .select('id')
        .limit(1);

      if (error && error.message.includes('does not exist')) {
        // Tabela não existe, vamos criá-la via API admin se possível
        console.log(`📋 Tabela ${tabela.nome} será criada no Supabase dashboard`);
        console.log(`SQL para copiar:\n${tabela.sql}\n`);
      } else {
        console.log(`✅ Tabela ${tabela.nome} já existe`);
      }
    } catch (err) {
      console.log(`📋 Para criar a tabela ${tabela.nome}, execute no Supabase:`);
      console.log(tabela.sql);
      console.log('---');
    }
  }
}

async function criarBucketStorage() {
  try {
    console.log('🔄 Verificando bucket de documentos...');
    
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === 'documentos');
    
    if (bucketExists) {
      console.log('✅ Bucket "documentos" já existe');
      return true;
    }

    console.log('🔄 Criando bucket "documentos"...');
    const { error } = await supabase.storage.createBucket('documentos', {
      public: false,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
      fileSizeLimit: 5242880 // 5MB
    });

    if (error) {
      console.error('❌ Erro ao criar bucket:', error);
      console.log('📋 Crie manualmente no Supabase Dashboard:');
      console.log('- Nome: documentos');
      console.log('- Público: Não');
      console.log('- Tipos permitidos: image/jpeg, image/png, image/webp');
      console.log('- Tamanho máximo: 5MB');
      return false;
    }

    console.log('✅ Bucket "documentos" criado com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    return false;
  }
}

async function verificarConexao() {
  try {
    console.log('🔄 Verificando conexão com Supabase...');
    
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Erro de conexão:', error);
      return false;
    }
    
    console.log('✅ Conexão com Supabase OK');
    return true;
  } catch (error) {
    console.error('❌ Erro de conexão:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Configurando Supabase para Sistema de Entregadores\n');
  
  // 1. Verificar conexão
  const conexaoOK = await verificarConexao();
  if (!conexaoOK) {
    console.log('❌ Falha na conexão. Verifique suas credenciais do Supabase.');
    return;
  }

  // 2. Criar bucket de storage
  await criarBucketStorage();
  
  // 3. Instruções para criar tabelas
  console.log('\n📋 INSTRUÇÕES PARA CRIAR TABELAS:');
  console.log('Copie e cole os SQLs abaixo no SQL Editor do Supabase Dashboard:\n');
  
  await criarTabelasManualmente();
  
  console.log('\n🎉 Setup de configuração concluído!');
  console.log('\n📝 PRÓXIMOS PASSOS:');
  console.log('1. Acesse o Supabase Dashboard');
  console.log('2. Vá em "SQL Editor"');
  console.log('3. Cole os SQLs mostrados acima');
  console.log('4. Execute cada comando');
  console.log('5. Verifique se o bucket "documentos" foi criado em "Storage"');
  console.log('\n✅ Após isso, o sistema de entregadores estará pronto!');
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

export { main as setupSupabase };
