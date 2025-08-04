import React, { useState } from 'react';
import { RefreshControl, ScrollView, FlatList, StyleSheet } from 'react-native';

type PullToRefreshProps = {
  children: React.ReactNode;
  onRefresh: () => Promise<void> | void;
  refreshing?: boolean;
  renderType?: 'scroll' | 'flatlist';
  flatListProps?: any;
  scrollViewProps?: any;
  tintColor?: string;
  colors?: string[];
  title?: string;
  titleColor?: string;
};

export default function PullToRefresh({
  children,
  onRefresh,
  refreshing: externalRefreshing,
  renderType = 'scroll',
  flatListProps = {},
  scrollViewProps = {},
  tintColor = '#008A44',
  colors = ['#008A44', '#FF7A00'],
  title = 'Puxe para atualizar',
  titleColor = '#5C5C5C',
}: PullToRefreshProps) {
  const [internalRefreshing, setInternalRefreshing] = useState(false);
  
  const isRefreshing = externalRefreshing !== undefined ? externalRefreshing : internalRefreshing;

  const handleRefresh = async () => {
    if (externalRefreshing === undefined) {
      setInternalRefreshing(true);
    }
    
    try {
      await onRefresh();
    } catch (error) {
      console.error('Erro durante refresh:', error);
    } finally {
      if (externalRefreshing === undefined) {
        setInternalRefreshing(false);
      }
    }
  };

  const refreshControl = (
    <RefreshControl
      refreshing={isRefreshing}
      onRefresh={handleRefresh}
      tintColor={tintColor}
      colors={colors}
      progressBackgroundColor="#FFFFFF"
      title={title}
      titleColor={titleColor}
      progressViewOffset={0}
    />
  );

  if (renderType === 'flatlist') {
    // Para FlatList, passamos o refreshControl via props
    return React.cloneElement(children as React.ReactElement, {
      refreshControl,
      ...flatListProps,
    });
  }

  // Para ScrollView padrão
  return (
    <ScrollView
      refreshControl={refreshControl}
      showsVerticalScrollIndicator={false}
      {...scrollViewProps}
    >
      {children}
    </ScrollView>
  );
}

// Hook personalizado para usar com estado de refresh
export function usePullToRefresh(refreshFunction: () => Promise<void> | void) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshFunction();
    } catch (error) {
      console.error('Erro durante refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  return { refreshing, onRefresh: handleRefresh };
}

// Componente especializado para listas de produtos
export function ProductListRefresh({
  children,
  onRefresh,
  refreshing,
  ...props
}: Omit<PullToRefreshProps, 'title' | 'tintColor'>) {
  return (
    <PullToRefresh
      {...props}
      onRefresh={onRefresh}
      refreshing={refreshing}
      title="Atualizando produtos..."
      tintColor="#008A44"
      colors={['#008A44', '#FF7A00']}
    >
      {children}
    </PullToRefresh>
  );
}

// Componente especializado para listas de pedidos
export function OrdersListRefresh({
  children,
  onRefresh,
  refreshing,
  ...props
}: Omit<PullToRefreshProps, 'title' | 'tintColor'>) {
  return (
    <PullToRefresh
      {...props}
      onRefresh={onRefresh}
      refreshing={refreshing}
      title="Atualizando pedidos..."
      tintColor="#FF7A00"
      colors={['#FF7A00', '#008A44']}
    >
      {children}
    </PullToRefresh>
  );
}
