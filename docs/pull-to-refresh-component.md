# PullToRefresh Component

Componente reutilizável para implementar "pull to refresh" em listas e páginas scrolláveis no app.

## Funcionalidades

✅ **Pull-to-refresh universal**: Funciona com ScrollView e FlatList
✅ **Hook personalizado**: `usePullToRefresh` para gerenciar estado
✅ **Componentes especializados**: `ProductListRefresh` e `OrdersListRefresh`
✅ **Customizável**: Cores, título e comportamento configuráveis
✅ **Cross-platform**: Funciona em iOS, Android e Web

## Componentes Disponíveis

### 1. PullToRefresh (Base)
```tsx
<PullToRefresh
  onRefresh={fetchData}
  refreshing={loading}
  renderType="scroll" // ou "flatlist"
  tintColor="#008A44"
  title="Puxe para atualizar"
>
  {children}
</PullToRefresh>
```

### 2. ProductListRefresh (Especializado)
```tsx
<ProductListRefresh
  onRefresh={fetchProducts}
  refreshing={loading}
  renderType="scroll"
>
  {children}
</ProductListRefresh>
```

### 3. OrdersListRefresh (Especializado)
```tsx
<OrdersListRefresh
  onRefresh={fetchOrders}
  refreshing={loading}
  renderType="flatlist"
>
  <FlatList {...props} />
</OrdersListRefresh>
```

### 4. Hook usePullToRefresh
```tsx
const { refreshing, onRefresh } = usePullToRefresh(async () => {
  await fetchData();
});
```

## Exemplos de Uso

### Para ScrollView
```tsx
import { ProductListRefresh, usePullToRefresh } from '../components/PullToRefresh';

export default function ProductScreen() {
  const fetchData = async () => {
    // Buscar dados da API
  };
  
  const { refreshing, onRefresh } = usePullToRefresh(fetchData);

  return (
    <ProductListRefresh
      onRefresh={onRefresh}
      refreshing={refreshing}
      renderType="scroll"
    >
      <View>
        {/* Conteúdo da página */}
      </View>
    </ProductListRefresh>
  );
}
```

### Para FlatList
```tsx
import { OrdersListRefresh, usePullToRefresh } from '../components/PullToRefresh';

export default function OrdersScreen() {
  const fetchOrders = async () => {
    // Buscar pedidos
  };
  
  const { refreshing, onRefresh } = usePullToRefresh(fetchOrders);

  return (
    <OrdersListRefresh
      onRefresh={onRefresh}
      refreshing={refreshing}
      renderType="flatlist"
    >
      <FlatList
        data={orders}
        renderItem={renderItem}
        {...otherProps}
      />
    </OrdersListRefresh>
  );
}
```

## Props Disponíveis

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `onRefresh` | `() => Promise<void>` | - | Função chamada ao fazer pull-to-refresh |
| `refreshing` | `boolean` | `false` | Estado de carregamento |
| `renderType` | `'scroll' \| 'flatlist'` | `'scroll'` | Tipo de componente a renderizar |
| `tintColor` | `string` | `'#008A44'` | Cor do indicador de refresh |
| `colors` | `string[]` | `['#008A44', '#FF7A00']` | Cores do indicador (Android) |
| `title` | `string` | `'Puxe para atualizar'` | Texto do indicador |
| `titleColor` | `string` | `'#5C5C5C'` | Cor do texto |
| `scrollViewProps` | `object` | `{}` | Props adicionais para ScrollView |
| `flatListProps` | `object` | `{}` | Props adicionais para FlatList |

## Implementação Atual

- ✅ **app/(tabs)/orders.tsx**: Lista de pedidos com refresh
- ✅ **app/(tabs)/index.tsx**: Catálogo de produtos com refresh

## Benefícios

1. **Código reutilizável**: Um componente para todos os casos
2. **UX consistente**: Mesmo comportamento em todas as telas
3. **Manutenção fácil**: Alterações centralizadas
4. **Customização**: Cada tela pode ter suas cores/textos
5. **Performance**: Otimizado para não re-renderizar desnecessariamente

## Próximos Passos

- [ ] Adicionar suporte para erro handling visual
- [ ] Implementar timeout para refresh automático
- [ ] Adicionar analytics de uso do pull-to-refresh
- [ ] Suporte para pull-to-refresh horizontal
