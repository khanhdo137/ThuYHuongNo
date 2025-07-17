import apiClient from '@/api/client';
import { useNavigation, useRoute } from '@react-navigation/native';
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

const INITIAL_LOAD = 10;
const LOAD_MORE = 5;
const MAX_FETCH = 100;

function sortAppointments(list: Appointment[]): Appointment[] {
  // Sắp xếp theo ngày giờ gần nhất lên đầu
  return [...list].sort((a, b) => {
    const dateA = new Date(a.appointmentDate + 'T' + (a.appointmentTime || '00:00')).getTime();
    const dateB = new Date(b.appointmentDate + 'T' + (b.appointmentTime || '00:00')).getTime();
    return dateB - dateA;
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

const getStatusText = (status: number) => {
  switch (status) {
    case 0: return 'Chờ duyệt';
    case 1: return 'Đã duyệt';
    case 2: return 'Đã hoàn thành';
    case 3: return 'Đã hủy';
    default: return '';
  }
};

export default function MyAppointmentsScreen() {
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const filter = (route.params as any)?.filter;

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params: any = { page: 1, limit: MAX_FETCH };
      if (typeof filter === 'number') {
        params.status = filter;
      }
      const res = await apiClient.get('/Appointment', { params });
      let rawList: Appointment[] = res.data.appointments || res.data || [];
      if (typeof filter === 'number') {
        rawList = rawList.filter(item => item.status === filter);
      }
      const sorted = sortAppointments(rawList);
      setAllAppointments(sorted);
      setAppointments(sorted.slice(0, INITIAL_LOAD));
    } catch {
      setAllAppointments([]);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [filter]);

  const handleLoadMore = () => {
    if (loadingMore || appointments.length >= allAppointments.length) return;
    setLoadingMore(true);
    setTimeout(() => {
      setAppointments(prev => allAppointments.slice(0, prev.length + LOAD_MORE));
      setLoadingMore(false);
    }, 400); // giả lập loading
  };

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
            <TouchableOpacity onPress={() => (navigation as any).navigate('AppointmentDetail', { appointmentId: item.appointmentId })}>
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
                  <Text style={{ color: getStatusColor(item.status), fontWeight: 'bold' }}>{getStatusText(item.status)}</Text>
                </Text>
                <Text>
                  <Text style={styles.label}>Bác sĩ: </Text>
                  <Text>{item.doctorName || 'Chưa chỉ định'}</Text>
                </Text>
              </View>
            </TouchableOpacity>
          )}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.2}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={{ margin: 16 }} /> : null}
        />
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
    marginHorizontal: 14,
    marginVertical: 10,
    borderRadius: 14,
    padding: 20,
    elevation: 5,
    shadowColor: '#007bff',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
},
  title: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 8,
    color: '#007bff',
},
  label: {
    fontWeight: '600',
    color: '#555',
    fontSize: 15,
},
}); 