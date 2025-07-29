# Persistência Robusta de Favoritos (Web e Mobile)

## Problema
No app, os favoritos não persistiam após recarregar a página no web. O estado era sobrescrito por um array vazio, mesmo com fallback para localStorage. Isso acontecia devido a uma condição de corrida: o estado era salvo antes de ser restaurado do armazenamento.

## Solução
1. **Flag de Carregamento (`favoritesLoaded`)**
   - Adicionada uma flag `favoritesLoaded` para garantir que a persistência só ocorra após a restauração inicial dos favoritos.
2. **Restauro Condicional**
   - No `useEffect` de montagem, restaurar favoritos do `AsyncStorage` (mobile) ou `localStorage` (web).
   - Após restaurar, setar `favoritesLoaded` como `true`.
3. **Persistência Condicional**
   - No `useEffect` de persistência, só salvar favoritos se `favoritesLoaded` for `true`.
   - No web, salvar em `localStorage`. No mobile, salvar em `AsyncStorage`.
4. **Debug Logs**
   - Adicionados logs detalhados para todas as operações de restauração e persistência, facilitando o rastreio de problemas.

## Exemplo de Código
```tsx
const [favorites, setFavorites] = useState<Favorite[]>([]);
const [favoritesLoaded, setFavoritesLoaded] = useState(false);

// Restaura favoritos ao montar
useEffect(() => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    const stored = window.localStorage.getItem('favorites');
    // ...parse e setFavorites...
    setFavoritesLoaded(true);
  } else {
    AsyncStorage.getItem('favorites').then(stored => {
      // ...parse e setFavorites...
      setFavoritesLoaded(true);
    });
  }
}, []);

// Persiste favoritos sempre que mudar, mas só após restaurar
useEffect(() => {
  if (!favoritesLoaded) return;
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem('favorites', JSON.stringify(favorites));
  } else {
    AsyncStorage.setItem('favorites', JSON.stringify(favorites));
  }
}, [favorites, favoritesLoaded]);
```

## Resumo
- **Nunca persista favoritos antes de restaurar!**
- Use uma flag de carregamento para evitar sobrescrita.
- Adicione logs para facilitar debug.
- Garanta compatibilidade web/mobile usando `localStorage` e `AsyncStorage`.

---

**Arquivo afetado:** `app/(tabs)/index.tsx`

**Responsável:** GitHub Copilot
**Data:** 29/07/2025
