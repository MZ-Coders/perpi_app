// Tipos para o sistema de entregadores

export interface Entregador {
  id: string;
  user_id: string;
  nome_completo: string;
  telefone: string;
  email: string;
  data_nascimento?: string;
  numero_bi?: string;
  numero_passaporte?: string;
  endereco: string;
  foto_perfil?: string;
  foto_bi?: string;
  foto_passaporte?: string;
  status_verificacao: 'pendente' | 'aprovado' | 'rejeitado';
  aceite_termos: boolean;
  veiculo_tipo?: 'moto' | 'bicicleta' | 'carro' | 'pe';
  veiculo_placa?: string;
  conta_bancaria?: string;
  disponivel: boolean;
  avaliacao_media: number;
  total_entregas: number;
  created_at: string;
  updated_at: string;
}

export interface Pedido {
  id: string;
  cliente_id: string;
  entregador_id?: string;
  status: 'novo' | 'atribuido' | 'aceito' | 'coletado' | 'em_transito' | 'entregue' | 'cancelado';
  endereco_coleta: string;
  endereco_entrega: string;
  coordenadas_coleta?: { x: number; y: number };
  coordenadas_entrega?: { x: number; y: number };
  distancia_km?: number;
  valor_entrega?: number;
  valor_total: number;
  tempo_estimado?: number;
  foto_confirmacao?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
  itens?: ItemPedido[];
}

export interface ItemPedido {
  id: string;
  pedido_id: string;
  produto_nome: string;
  quantidade: number;
  preco_unitario: number;
  preco_total: number;
}

export interface RastreamentoPedido {
  id: string;
  pedido_id: string;
  entregador_id: string;
  latitude: number;
  longitude: number;
  status: string;
  observacao?: string;
  foto_url?: string;
  created_at: string;
}

export interface AvaliacaoEntregador {
  id: string;
  pedido_id: string;
  entregador_id: string;
  cliente_id: string;
  nota: number;
  comentario?: string;
  created_at: string;
}

export interface DocumentoPendente {
  id: string;
  entregador_id: string;
  tipo_documento: string;
  url_documento: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  observacoes_admin?: string;
  created_at: string;
}

export interface FormularioCadastroEntregador {
  nome_completo: string;
  telefone: string;
  email: string;
  data_nascimento: string;
  numero_bi: string;
  numero_passaporte: string;
  endereco: string;
  veiculo_tipo: 'moto' | 'bicicleta' | 'carro' | 'pe';
  veiculo_placa: string;
  conta_bancaria: string;
  aceite_termos: boolean;
  foto_bi?: string;
  foto_passaporte?: string;
  foto_perfil?: string;
}
