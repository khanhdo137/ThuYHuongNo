import apiClient from '@/api/client';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNotificationCount } from '../context/NotificationCountContext';

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
  const { setCount } = useNotificationCount();

  useEffect(() => {
    apiClient.get('/Appointment', { params: { limit: 20, page: 1 } })
      .then(res => {
        const all: Appointment[] = res.data.appointments || res.data || [];
        const filtered = all.filter((item: Appointment) => item.status === 1 || item.status === 3);
        setAppointments(filtered);
        setCount(filtered.length);
      })
      .catch(() => {
        setAppointments([]);
        setCount(0);
      })
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

  const getStatusText = (status: number) => {
    switch (status) {
      case 0: return 'Chờ xác nhận';
      case 1: return 'Đã duyệt';
      case 2: return 'Đã hoàn thành';
      case 3: return 'Đã hủy';
      default: return '';
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f6f8fa' }}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#007bff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông báo lịch đã duyệt & đã hủy</Text>
        <Ionicons name="notifications" size={26} color="#007bff" style={{ marginRight: 16 }} />
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={{ marginTop: 10, color: '#007bff' }}>Đang tải dữ liệu...</Text>
        </View>
      )}

      {!loading && !appointments.length && (
        <Text style={styles.emptyText}>Không có lịch đã duyệt nào.</Text>
      )}

      {!loading && !!appointments.length && (
        <FlatList
          data={appointments}
          keyExtractor={(item: Appointment) => item.appointmentId?.toString()}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }: { item: Appointment }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <MaterialIcons name="event-available" size={28} color="#007bff" style={{ marginRight: 8 }} />
                <Text style={styles.title}>{item.serviceName} - {item.petName}</Text>
              </View>
              <View style={styles.row}>
                <Ionicons name="calendar" size={18} color="#888" style={{ marginRight: 4 }} />
                <Text style={styles.label}>{item.appointmentDate}</Text>
                <Ionicons name="time" size={18} color="#888" style={{ marginLeft: 12, marginRight: 4 }} />
                <Text style={styles.label}>{item.appointmentTime}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Trạng thái: </Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}> 
                  <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
                </View>
              </View>
              <View style={styles.row}>
                <Ionicons name="person" size={18} color="#888" style={{ marginRight: 4 }} />
                <Text style={styles.label}>Bác sĩ: </Text>
                <Text>{item.doctorName || 'Chưa chỉ định'}</Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 36,
    paddingBottom: 16,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#007bff',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    marginBottom: 4,
  },
  backBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007bff',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40,
  },
  emptyText: {
    margin: 20, color: '#888', textAlign: 'center', fontSize: 16,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 16,
    padding: 18,
    elevation: 4,
    shadowColor: '#007bff',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 17,
    color: '#007bff',
    flex: 1,
    flexWrap: 'wrap',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontWeight: '600',
    color: '#555',
    fontSize: 15,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginLeft: 4,
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
}); 