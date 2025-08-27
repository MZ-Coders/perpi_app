import { useEffect, useState } from 'react';
import { EntregadorService } from '../services/entregadorService';
import type { Entregador } from '../types/entregador';

interface EntregadorStatus {
  entregador: Entregador | null;
  isLoading: boolean;
  hasCadastro: boolean;
  isAprovado: boolean;
  isPendente: boolean;
  isRejeitado: boolean;
  refresh: () => Promise<void>;
}

export function useEntregadorStatus(): EntregadorStatus {
  const [entregador, setEntregador] = useState<Entregador | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadEntregadorStatus = async () => {
    setIsLoading(true);
    try {
      const entregadorData = await EntregadorService.buscarEntregadorLogado();
      setEntregador(entregadorData);
    } catch (error) {
      console.error('Erro ao carregar status do entregador:', error);
      setEntregador(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEntregadorStatus();
  }, []);

  const hasCadastro = entregador !== null;
  const isAprovado = entregador?.status_verificacao === 'aprovado';
  const isPendente = entregador?.status_verificacao === 'pendente';
  const isRejeitado = entregador?.status_verificacao === 'rejeitado';

  return {
    entregador,
    isLoading,
    hasCadastro,
    isAprovado,
    isPendente,
    isRejeitado,
    refresh: loadEntregadorStatus
  };
}
