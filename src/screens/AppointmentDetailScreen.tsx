import apiClient from '@/api/client';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AppointmentDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { appointmentId } = (route.params || {}) as { appointmentId: number };
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!appointmentId) return;
    setLoading(true);
    apiClient.get(`/Appointment/${appointmentId}`)
      .then(res => setData(res.data))
      .catch(() => setError('Không thể tải chi tiết lịch hẹn.'))
      .finally(() => setLoading(false));
  }, [appointmentId]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#007bff" /></View>;
  }
  if (error) {
    return <View style={styles.center}><Text style={{ color: 'red' }}>{error}</Text></View>;
  }
  if (!data) {
    return <View style={styles.center}><Text>Không tìm thấy lịch hẹn.</Text></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={26} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết lịch hẹn</Text>
      </View>
      <View style={styles.detailBox}>
        <Text style={styles.label}>Dịch vụ:</Text>
        <Text style={styles.value}>{data.serviceName}</Text>
        <Text style={styles.label}>Thú cưng:</Text>
        <Text style={styles.value}>{data.petName}</Text>
        <Text style={styles.label}>Ngày:</Text>
        <Text style={styles.value}>{data.appointmentDate}</Text>
        <Text style={styles.label}>Giờ:</Text>
        <Text style={styles.value}>{data.appointmentTime}</Text>
        <Text style={styles.label}>Bác sĩ:</Text>
        <Text style={styles.value}>{data.doctorName || 'Chưa chỉ định'}</Text>
        <Text style={styles.label}>Trạng thái:</Text>
        <Text style={styles.value}>{data.statusText}</Text>
        {data.notes ? <><Text style={styles.label}>Ghi chú:</Text><Text style={styles.value}>{data.notes}</Text></> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 36,
    paddingBottom: 16,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#222',
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
    color: '#222',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  detailBox: {
    margin: 18,
    padding: 18,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    shadowColor: '#007bff',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  label: {
    fontWeight: 'bold',
    color: '#007bff',
    marginTop: 10,
    fontSize: 15,
  },
  value: {
    color: '#222',
    fontSize: 16,
    marginBottom: 2,
  },
}); 