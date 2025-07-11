import apiClient from '@/api/client';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Định nghĩa interface cho medical history
interface MedicalHistory {
  historyId: number;
  recordDate: string;
  description?: string;
  treatment?: string;
  notes?: string;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString();
}

const PAGE_SIZE = 5;

export default function MedicalHistoryScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  // @ts-ignore
  const { pet } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<MedicalHistory[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchRecords = async (pageNum = 1) => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/Pet/${pet.petId}/medical-history`, { params: { page: pageNum, limit: PAGE_SIZE } });
      setRecords(res.data.histories || res.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch {
      setRecords([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!pet?.petId) return;
    fetchRecords(page);
  }, [pet?.petId, page]);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={{ color: '#007bff', fontWeight: 'bold', fontSize: 16 }}>{'< Quay lại'}</Text>
      </TouchableOpacity>
      <Text style={styles.header}>Hồ sơ bệnh án: {pet?.name}</Text>
      {loading && <ActivityIndicator style={{ marginTop: 40 }} />}
      {!loading && !records.length && <Text style={{ margin: 20, color: '#888', textAlign: 'center' }}>Chưa có bệnh án nào cho thú cưng này.</Text>}
      {!loading && !!records.length && (
        <FlatList
          data={records}
          keyExtractor={item => item.historyId?.toString() || Math.random().toString()}
          renderItem={({ item }: { item: MedicalHistory }) => (
            <View style={styles.card}>
              <Text style={styles.title}>Ngày khám: {formatDate(item.recordDate)}</Text>
              <Text style={styles.label}>Chẩn đoán:</Text>
              <Text style={styles.value}>{item.description || 'Không có'}</Text>
              <Text style={styles.label}>Điều trị:</Text>
              <Text style={styles.value}>{item.treatment || 'Không có'}</Text>
              <Text style={styles.label}>Ghi chú:</Text>
              <Text style={styles.value}>{item.notes || 'Không có'}</Text>
            </View>
          )}
        />
      )}
      {/* Phân trang */}
      {!loading && totalPages > 1 && (
        <View style={styles.paginationContainer}>
          <TouchableOpacity
            onPress={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={[styles.pageBtn, { opacity: page === 1 ? 0.5 : 1 }]}
          >
            <Text style={styles.pageBtnText}>Trang trước</Text>
          </TouchableOpacity>
          <Text style={styles.pageNumber}>{page} / {totalPages}</Text>
          <TouchableOpacity
            onPress={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={[styles.pageBtn, { opacity: page === totalPages ? 0.5 : 1 }]}
          >
            <Text style={styles.pageBtnText}>Trang sau</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    padding: 15,
    paddingBottom: 0,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    margin: 18,
    marginBottom: 8,
    textAlign: 'center',
    color: '#007bff',
    letterSpacing: 1,
},
  card: {
    backgroundColor: '#fff',
    margin: 12,
    borderRadius: 14,
    padding: 18,
    elevation: 4,
    shadowColor: '#007bff',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
},
  title: {
    fontWeight: 'bold',
    fontSize: 17,
    marginBottom: 8,
    color: '#007bff',
},
  label: {
    fontWeight: '600',
    marginTop: 8,
    color: '#007bff',
},
  value: {
    color: '#333',
    marginLeft: 4,
    fontSize: 15,
},
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    backgroundColor: '#fff',
},
  pageBtn: {
    marginHorizontal: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#007bff',
    borderRadius: 10,
    shadowColor: '#007bff',
    shadowOpacity: 0.10,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
},
  pageBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
},
  pageNumber: {
    fontWeight: 'bold',
    fontSize: 17,
    marginHorizontal: 8,
},
}); 