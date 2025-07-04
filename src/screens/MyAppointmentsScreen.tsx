import apiClient from '@/api/client';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Appointment {
  appointmentId: number;
  serviceName: string;
  petName: string;
  appointmentDate: string;
  appointmentTime: string;
  status: number;
  statusText?: string;
  doctorName?: string;
}

const PAGE_SIZE = 5;

function sortAppointments(list: Appointment[]): Appointment[] {
  // Chờ xác nhận (status == 0) lên đầu, trong mỗi nhóm sắp xếp theo ngày giờ gần nhất
  return [...list].sort((a, b) => {
    // Ưu tiên status == 0
    if (a.status === 0 && b.status !== 0) return -1;
    if (a.status !== 0 && b.status === 0) return 1;
    // Cùng nhóm, so sánh ngày giờ gần nhất
    const dateA = new Date(a.appointmentDate + 'T' + (a.appointmentTime || '00:00')).getTime();
    const dateB = new Date(b.appointmentDate + 'T' + (b.appointmentTime || '00:00')).getTime();
    return dateA - dateB;
  });
}

const getStatusColor = (status: number) => {
  switch (status) {
    case 0: return '#f1c40f'; // Chờ xác nhận
    case 1: return '#27ae60'; // Đã duyệt
    case 2: return '#2980b9'; // Đã hoàn thành
    case 3: return '#e74c3c'; // Đã hủy
    default: return '#888';
  }
};

export default function MyAppointmentsScreen() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigation = useNavigation();

  const fetchAppointments = async (pageNum = 1) => {
    setLoading(true);
    try {
      const res = await apiClient.get('/Appointment', { params: { page: pageNum, limit: PAGE_SIZE } });
      const rawList: Appointment[] = res.data.appointments || res.data || [];
      setAppointments(sortAppointments(rawList));
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch {
      setAppointments([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments(page);
  }, [page]);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Nút quay lại */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={{ color: '#007bff', fontWeight: 'bold', fontSize: 16 }}>{'< Quay lại'}</Text>
      </TouchableOpacity>
      {loading && (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 }}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={{ marginTop: 10, color: '#007bff' }}>Đang tải dữ liệu...</Text>
        </View>
      )}
      {!loading && !appointments.length && <Text style={{ margin: 20, color: '#888', textAlign: 'center' }}>Bạn chưa có lịch hẹn nào.</Text>}
      {!loading && !!appointments.length && (
        <FlatList
          data={appointments}
          keyExtractor={(item: Appointment) => item.appointmentId?.toString()}
          renderItem={({ item }: { item: Appointment }) => (
            <View style={[styles.card, { borderLeftWidth: 6, borderLeftColor: getStatusColor(item.status) }]}> 
              <Text style={styles.title}>{item.serviceName} - {item.petName}</Text>
              <View style={{ flexDirection: 'row', marginBottom: 4 }}>
                <Text style={styles.label}>Ngày: </Text>
                <Text>{item.appointmentDate}</Text>
                <Text style={styles.label}>   Giờ: </Text>
                <Text>{item.appointmentTime}</Text>
              </View>
              <Text>
                <Text style={styles.label}>Trạng thái: </Text>
                <Text style={{ color: getStatusColor(item.status), fontWeight: 'bold' }}>{item.statusText}</Text>
              </Text>
              <Text>
                <Text style={styles.label}>Bác sĩ: </Text>
                <Text>{item.doctorName || 'Chưa chỉ định'}</Text>
              </Text>
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
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 12,
    padding: 18,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  title: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 6,
    color: '#222',
  },
  label: {
    fontWeight: '600',
    color: '#555',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    backgroundColor: '#fff',
  },
  pageBtn: {
    marginHorizontal: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007bff',
    borderRadius: 8,
  },
  pageBtnText: {
    color: 'white',
    fontWeight: 'bold',
  },
  pageNumber: {
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 