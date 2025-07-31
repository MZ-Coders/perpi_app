import { Dimensions, StyleSheet, View } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

const SkeletonOrderCard = () => (
  <View style={styles.card}>
    <View style={styles.headerRow}>
      <View style={styles.skeletonId} />
      <View style={styles.skeletonStatus} />
    </View>
    <View style={styles.skeletonTotal} />
    <View style={styles.skeletonDelivery} />
    <View style={styles.skeletonItemsRow}>
      <View style={styles.skeletonItem} />
      <View style={styles.skeletonItem} />
      <View style={styles.skeletonItem} />
    </View>
    <View style={styles.skeletonButton} />
  </View>
);


const Loading = () => {
  return (
    <View style={styles.container}>
      {[1,2,3].map(i => (
        <SkeletonOrderCard key={i} />
      ))}
    </View>
  );
};

const skeletonColor = '#ececec';
const skeletonHighlight = '#f5f5f5';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FDFDFB',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F3F3',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  skeletonId: {
    width: 80,
    height: 18,
    borderRadius: 8,
    backgroundColor: skeletonColor,
  },
  skeletonStatus: {
    width: 70,
    height: 18,
    borderRadius: 8,
    backgroundColor: skeletonColor,
  },
  skeletonTotal: {
    width: screenWidth * 0.5,
    height: 28,
    borderRadius: 8,
    backgroundColor: skeletonColor,
    marginBottom: 20,
    alignSelf: 'center',
  },
  skeletonDelivery: {
    width: '100%',
    height: 32,
    borderRadius: 8,
    backgroundColor: skeletonColor,
    marginBottom: 20,
  },
  skeletonItemsRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  skeletonItem: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: skeletonColor,
    marginRight: 12,
  },
  skeletonButton: {
    width: '100%',
    height: 40,
    borderRadius: 14,
    backgroundColor: skeletonColor,
  },
});

export default Loading;
