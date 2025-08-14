import { supabase } from '../lib/supabaseClient';
import type {
    AvaliacaoEntregador,
    Entregador,
    FormularioCadastroEntregador,
    Pedido
} from '../types/entregador';

export class EntregadorService {
  // Cadastro de entregador
  static async cadastrarEntregador(dados: FormularioCadastroEntregador): Promise<{ data: Entregador | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('entregadores')
        .insert({
          user_id: user.id,
          ...dados,
          status_verificacao: 'pendente',
          disponivel: false
        })
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Buscar entregador atual
  static async buscarEntregadorAtual(): Promise<{ data: Entregador | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('entregadores')
        .select('*')
        .eq('user_id', user.id)
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Atualizar disponibilidade
  static async atualizarDisponibilidade(disponivel: boolean): Promise<{ error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('entregadores')
        .update({ disponivel })
        .eq('user_id', user.id);

      return { error };
    } catch (error) {
      return { error };
    }
  }

  // Buscar pedidos disponíveis
  static async buscarPedidosDisponiveis(): Promise<{ data: Pedido[]; error: any }> {
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          *,
          itens_pedido (*)
        `)
        .eq('status', 'novo')
        .order('created_at', { ascending: true });

      return { data: data || [], error };
    } catch (error) {
      return { data: [], error };
    }
  }

  // Buscar pedidos do entregador
  static async buscarMeusPedidos(): Promise<{ data: Pedido[]; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Primeiro buscar o ID do entregador
      const { data: entregador } = await supabase
        .from('entregadores')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!entregador) throw new Error('Entregador não encontrado');

      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          *,
          itens_pedido (*)
        `)
        .eq('entregador_id', entregador.id)
        .in('status', ['atribuido', 'aceito', 'coletado', 'em_transito'])
        .order('created_at', { ascending: false });

      return { data: data || [], error };
    } catch (error) {
      return { data: [], error };
    }
  }

  // Aceitar pedido
  static async aceitarPedido(pedidoId: string): Promise<{ error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar ID do entregador
      const { data: entregador } = await supabase
        .from('entregadores')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!entregador) throw new Error('Entregador não encontrado');

      const { error } = await supabase
        .from('pedidos')
        .update({ 
          entregador_id: entregador.id,
          status: 'aceito' 
        })
        .eq('id', pedidoId)
        .eq('status', 'novo');

      return { error };
    } catch (error) {
      return { error };
    }
  }

  // Atualizar status do pedido
  static async atualizarStatusPedido(
    pedidoId: string, 
    novoStatus: Pedido['status'],
    observacao?: string,
    fotoUrl?: string
  ): Promise<{ error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar ID do entregador
      const { data: entregador } = await supabase
        .from('entregadores')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!entregador) throw new Error('Entregador não encontrado');

      // Atualizar pedido
      const updateData: any = { status: novoStatus };
      if (fotoUrl && novoStatus === 'entregue') {
        updateData.foto_confirmacao = fotoUrl;
      }

      const { error: pedidoError } = await supabase
        .from('pedidos')
        .update(updateData)
        .eq('id', pedidoId)
        .eq('entregador_id', entregador.id);

      if (pedidoError) throw pedidoError;

      // Registrar no rastreamento
      const { error: rastreamentoError } = await supabase
        .from('rastreamento_pedidos')
        .insert({
          pedido_id: pedidoId,
          entregador_id: entregador.id,
          status: novoStatus,
          observacao,
          foto_url: fotoUrl
        });

      return { error: rastreamentoError };
    } catch (error) {
      return { error };
    }
  }

  // Registrar localização atual
  static async registrarLocalizacao(
    pedidoId: string,
    latitude: number,
    longitude: number
  ): Promise<{ error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: entregador } = await supabase
        .from('entregadores')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!entregador) throw new Error('Entregador não encontrado');

      const { error } = await supabase
        .from('rastreamento_pedidos')
        .insert({
          pedido_id: pedidoId,
          entregador_id: entregador.id,
          latitude,
          longitude,
          status: 'localizacao_atualizada'
        });

      return { error };
    } catch (error) {
      return { error };
    }
  }

  // Upload de arquivo
  static async uploadArquivo(
    arquivo: File | Blob,
    path: string
  ): Promise<{ data: { path: string } | null; error: any }> {
    try {
      const { data, error } = await supabase.storage
        .from('documentos')
        .upload(path, arquivo);

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Buscar URL pública do arquivo
  static async obterUrlPublica(path: string): Promise<string> {
    const { data } = supabase.storage
      .from('documentos')
      .getPublicUrl(path);

    return data.publicUrl;
  }

  // Buscar avaliações do entregador
  static async buscarAvaliacoes(): Promise<{ data: AvaliacaoEntregador[]; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: entregador } = await supabase
        .from('entregadores')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!entregador) throw new Error('Entregador não encontrado');

      const { data, error } = await supabase
        .from('avaliacoes_entregadores')
        .select('*')
        .eq('entregador_id', entregador.id)
        .order('created_at', { ascending: false });

      return { data: data || [], error };
    } catch (error) {
      return { data: [], error };
    }
  }

  // Calcular estatísticas do entregador
  static async calcularEstatisticas(): Promise<{
    data: {
      total_entregas: number;
      avaliacao_media: number;
      ganhos_hoje: number;
      ganhos_mes: number;
    } | null;
    error: any;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: entregador } = await supabase
        .from('entregadores')
        .select('id, total_entregas, avaliacao_media')
        .eq('user_id', user.id)
        .single();

      if (!entregador) throw new Error('Entregador não encontrado');

      // Buscar ganhos do dia
      const hoje = new Date().toISOString().split('T')[0];
      const { data: ganhosHoje } = await supabase
        .from('pedidos')
        .select('valor_entrega')
        .eq('entregador_id', entregador.id)
        .eq('status', 'entregue')
        .gte('created_at', hoje);

      // Buscar ganhos do mês
      const inicioMes = new Date();
      inicioMes.setDate(1);
      const { data: ganhosMes } = await supabase
        .from('pedidos')
        .select('valor_entrega')
        .eq('entregador_id', entregador.id)
        .eq('status', 'entregue')
        .gte('created_at', inicioMes.toISOString());

      const ganhos_hoje = ganhosHoje?.reduce((sum, p) => sum + (p.valor_entrega || 0), 0) || 0;
      const ganhos_mes = ganhosMes?.reduce((sum, p) => sum + (p.valor_entrega || 0), 0) || 0;

      return {
        data: {
          total_entregas: entregador.total_entregas,
          avaliacao_media: entregador.avaliacao_media,
          ganhos_hoje,
          ganhos_mes
        },
        error: null
      };
    } catch (error) {
      return { data: null, error };
    }
  }
}
