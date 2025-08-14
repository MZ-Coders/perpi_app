import { useEffect, useState } from 'react';
import { EntregadorService } from '../services/entregadorService';
import type { Entregador } from '../types/entregador';

export function useEntregador() {
  const [entregador, setEntregador] = useState<Entregador | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregarEntregador = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: serviceError } = await EntregadorService.buscarEntregadorAtual();
      
      if (serviceError) {
        setError('Erro ao carregar dados do entregador');
        setEntregador(null);
      } else {
        setEntregador(data);
      }
    } catch (err) {
      setError('Erro inesperado');
      setEntregador(null);
    } finally {
      setLoading(false);
    }
  };

  const alternarDisponibilidade = async () => {
    if (!entregador) return false;

    try {
      const novaDisponibilidade = !entregador.disponivel;
      const { error } = await EntregadorService.atualizarDisponibilidade(novaDisponibilidade);
      
      if (error) {
        return false;
      }

      setEntregador(prev => prev ? { ...prev, disponivel: novaDisponibilidade } : null);
      return true;
    } catch (err) {
      return false;
    }
  };

  useEffect(() => {
    carregarEntregador();
  }, []);

  return {
    entregador,
    loading,
    error,
    carregarEntregador,
    alternarDisponibilidade,
    isAprovado: entregador?.status_verificacao === 'aprovado',
    isPendente: entregador?.status_verificacao === 'pendente',
    isRejeitado: entregador?.status_verificacao === 'rejeitado',
    isOnline: entregador?.disponivel || false,
  };
}
