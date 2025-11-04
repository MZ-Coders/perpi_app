# Sistema de Entregadores - Documentação

## 📋 Visão Geral

O sistema de entregadores foi implementado com todas as funcionalidades solicitadas, incluindo cadastro, verificação, operação de entrega e cobrança por quilometragem.

## 🔧 Configuração

### 1. Banco de Dados (Supabase)

Execute o script SQL em `lib/supabase-schema.sql` no seu projeto Supabase para criar as tabelas necessárias:

```sql
-- Executar no SQL Editor do Supabase
-- O script criará todas as tabelas, políticas de segurança e funções necessárias
```

### 2. Storage no Supabase

Crie um bucket chamado `documentos` no Supabase Storage para armazenar:
- Fotos de BI/Passaporte
- Fotos de perfil
- Fotos de confirmação de entrega

## 📱 Funcionalidades Implementadas

### 🆔 Cadastro e Verificação

#### Tela: `/cadastro-entregador`
- ✅ Formulário completo com dados pessoais
- ✅ Upload de documentos (BI, Passaporte)
- ✅ Seleção de tipo de veículo
- ✅ Aceite de termos e condições
- ✅ Validação de campos obrigatórios
- ✅ Processo de aprovação manual (status: pendente/aprovado/rejeitado)

**Documentos Obrigatórios:**
- Foto do BI ou Passaporte
- Dados pessoais completos
- Informações do veículo
- Aceite dos termos

### 🚚 Operação de Entrega

#### Tela Principal: `/entregador`
- ✅ Painel com estatísticas do entregador
- ✅ Status online/offline
- ✅ Lista de pedidos ativos
- ✅ Pedidos disponíveis para aceitar
- ✅ Aceitar/recusar pedidos
- ✅ Atualização de status em tempo real

#### Navegação GPS: `/navegacao-entrega`
- ✅ Mapa integrado com react-native-maps
- ✅ Localização em tempo real
- ✅ Rota traçada até o destino
- ✅ Integração com Google Maps e Waze
- ✅ Rastreamento opcional da localização
- ✅ Atualização de status (coletado, em trânsito)

#### Confirmação de Entrega: `/confirmacao-entrega`
- ✅ Captura de foto obrigatória
- ✅ Campo de observações
- ✅ Validação antes de confirmar
- ✅ Upload automático da foto

### 💰 Sistema de Cobrança

- ✅ Cálculo automático por quilometragem (0.50 MZN/km)
- ✅ Valor mínimo de 50 MZN por entrega
- ✅ Estatísticas de ganhos (diário/mensal)
- ✅ Histórico de entregas realizadas

## 🗂️ Estrutura de Arquivos

```
/services/
  entregadorService.ts     # API para operações do entregador

/types/
  entregador.ts           # Tipos TypeScript

/hooks/
  useEntregador.ts        # Hook para gerenciar estado

/app/(tabs)/
  entregador.tsx          # Painel principal
  cadastro-entregador.tsx # Formulário de cadastro
  navegacao-entrega.tsx   # GPS e navegação
  confirmacao-entrega.tsx # Confirmação com foto

/lib/
  supabase-schema.sql     # Schema do banco de dados
```

## 🔄 Fluxo de Trabalho

### 1. Cadastro do Entregador
```
Usuário acessa /cadastro-entregador
→ Preenche formulário
→ Faz upload dos documentos
→ Aceita termos
→ Submete para aprovação
→ Aguarda análise manual
```

### 2. Operação Diária
```
Entregador faz login
→ Acessa /entregador
→ Fica online para receber pedidos
→ Aceita pedido disponível
→ Acessa /navegacao-entrega
→ Navega até o local
→ Atualiza status (coletado → em trânsito)
→ Acessa /confirmacao-entrega
→ Tira foto e confirma entrega
→ Recebe pagamento automático
```

### 3. Rastreamento em Tempo Real
```
Cliente pode ver localização do entregador
→ Entregador tem opção de compartilhar localização
→ Atualizações a cada 10 segundos
→ Histórico salvo no banco de dados
```

## 📊 Tabelas do Banco

### `entregadores`
- Dados pessoais e documentos
- Status de verificação
- Informações do veículo
- Estatísticas (entregas, avaliação)

### `pedidos`
- Informações do pedido
- Endereços de coleta e entrega
- Status atual
- Valores e distâncias

### `rastreamento_pedidos`
- Histórico de localização
- Mudanças de status
- Fotos e observações

### `avaliacoes_entregadores`
- Avaliações dos clientes
- Comentários e notas

## 🔒 Segurança

- ✅ Row Level Security (RLS) ativado
- ✅ Políticas de acesso por usuário
- ✅ Validação de permissões
- ✅ Upload seguro de arquivos

## 🚀 Como Usar

1. **Configure o Supabase** executando o script SQL
2. **Adicione as rotas** ao drawer de navegação
3. **Configure permissões** de câmera e localização
4. **Teste o fluxo completo** de cadastro até entrega

## 📝 Próximos Passos

- Implementar notificações push
- Sistema de avaliações bidirecionais
- Relatórios financeiros detalhados
- Suporte a múltiplas entregas simultâneas
- Otimização de rotas

## 🔧 Configurações Necessárias

### Permissões no app.json/app.config.js:
```json
{
  "expo": {
    "plugins": [
      [
        "expo-image-picker",
        {
          "photosPermission": "Precisamos de acesso às fotos para documentos e confirmação de entrega."
        }
      ],
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Precisamos de acesso à localização para navegação e rastreamento."
        }
      ]
    ]
  }
}
```

O sistema está completo e pronto para uso! 🎉
