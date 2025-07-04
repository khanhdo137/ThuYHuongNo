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

export default function NotificationScreen() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    apiClient.get('/Appointment', { params: { status: 1, limit: 20, page: 1 } })
      .then(res => {
        // Chỉ lấy các lịch có status === 1 (đã duyệt)
        const all: Appointment[] = res.data.appointments || res.data || [];
        setAppointments(all.filter((item: Appointment) => item.status === 1));
      })
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  }, []);

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return '#f1c40f'; // Chờ xác nhận
      case 1: return '#27ae60'; // Đã duyệt
      case 2: return '#2980b9'; // Đã hoàn thành
      case 3: return '#e74c3c'; // Đã hủy
      default: return '#888';
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={{ color: '#007bff', fontWeight: 'bold', fontSize: 16 }}>{'< Quay lại'}</Text>
      </TouchableOpacity>
      <Text style={styles.header}>Thông báo lịch đã duyệt</Text>
      {loading && (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 }}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={{ marginTop: 10, color: '#007bff' }}>Đang tải dữ liệu...</Text>
        </View>
      )}
      {!loading && !appointments.length && <Text style={{ margin: 20, color: '#888', textAlign: 'center' }}>Không có lịch đã duyệt nào.</Text>}
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
    margin: 15,
    marginBottom: 5,
    textAlign: 'center',
    color: '#007bff',
    letterSpacing: 1,
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
}); 