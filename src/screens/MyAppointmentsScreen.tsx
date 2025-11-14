import apiClient from '@/api/client';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '../components/GradientBackground';
import VirtualAssistant from '../components/VirtualAssistant';

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
    case 0: return '#F39C12'; // Chờ duyệt
    case 1: return '#27AE60'; // Đã duyệt
    case 2: return '#3498DB'; // Đã hoàn thành
    case 3: return '#E74C3C'; // Đã hủy
    default: return '#95A5A6';
  }
};

const getStatusIcon = (status: number) => {
  switch (status) {
    case 0: return 'time-outline';
    case 1: return 'checkmark-circle-outline';
    case 2: return 'ribbon-outline';
    case 3: return 'close-circle-outline';
    default: return 'help-circle-outline';
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

const getFilterTitle = (filter: number | undefined) => {
  switch (filter) {
    case 0: return 'Lịch hẹn chờ duyệt';
    case 1: return 'Lịch hẹn đã duyệt';
    case 2: return 'Lịch hẹn hoàn thành';
    case 3: return 'Lịch hẹn đã hủy';
    default: return 'Tất cả lịch hẹn';
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
      // Kiểm tra token trước khi gọi API
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setAllAppointments([]);
        setAppointments([]);
        return;
      }
      
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

  const renderAppointmentCard = ({ item }: { item: Appointment }) => (
    <TouchableOpacity 
      style={styles.appointmentCard}
      onPress={() => (navigation as any).navigate('AppointmentDetail', { appointmentId: item.appointmentId })}
    >
      {/* Status Badge */}
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
        <Ionicons name={getStatusIcon(item.status)} size={16} color="white" />
        <Text style={styles.statusBadgeText}>{getStatusText(item.status)}</Text>
      </View>

      {/* Main Content */}
      <View style={styles.cardContent}>
        {/* Service & Pet Info */}
        <View style={styles.mainInfo}>
          <Text style={styles.serviceName}>{item.serviceName}</Text>
          <View style={styles.petInfo}>
            <Ionicons name="paw" size={16} color="#FF6B9D" />
            <Text style={styles.petName}>{item.petName}</Text>
          </View>
        </View>

        {/* DateTime Info */}
        <View style={styles.datetimeInfo}>
          <View style={styles.datetimeItem}>
            <Ionicons name="calendar-outline" size={16} color="#3498DB" />
            <Text style={styles.datetimeText}>{item.appointmentDate}</Text>
          </View>
          <View style={styles.datetimeItem}>
            <Ionicons name="time-outline" size={16} color="#F39C12" />
            <Text style={styles.datetimeText}>{item.appointmentTime}</Text>
          </View>
        </View>

        {/* Doctor Info */}
        <View style={styles.doctorInfo}>
          <Ionicons name="person-outline" size={16} color="#27AE60" />
          <Text style={styles.doctorText}>{item.doctorName || 'Chưa chỉ định'}</Text>
        </View>
      </View>

      {/* Arrow */}
      <View style={styles.arrowContainer}>
        <Ionicons name="chevron-forward" size={20} color="#BDC3C7" />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="calendar-outline" size={64} color="#BDC3C7" />
      <Text style={styles.emptyTitle}>Chưa có lịch hẹn</Text>
      <Text style={styles.emptySubtitle}>
        {filter !== undefined 
          ? `Bạn chưa có lịch hẹn nào với trạng thái "${getStatusText(filter)}"`
          : 'Bạn chưa có lịch hẹn nào. Hãy đặt lịch hẹn để chăm sóc thú cưng!'
        }
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#2c3e50" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{getFilterTitle(filter)}</Text>
      <View style={styles.headerRight} />
    </View>
  );

  return (
    <GradientBackground>
      <View style={styles.container}>
        {renderHeader()}
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text style={styles.loadingText}>Đang tải lịch hẹn...</Text>
          </View>
        ) : (
          <FlatList
            data={appointments}
            keyExtractor={(item: Appointment) => item.appointmentId?.toString()}
            renderItem={renderAppointmentCard}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.2}
            ListEmptyComponent={renderEmptyState}
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.loadingMore}>
                  <ActivityIndicator size="small" color="#007bff" />
                  <Text style={styles.loadingMoreText}>Đang tải thêm...</Text>
                </View>
              ) : null
            }
          />
        )}
      </View>
      <VirtualAssistant 
        screen="MyAppointments" 
        onAction={(actionType, actionData) => {
          // Handle actions from virtual assistant
          if (actionType === 'view_appointment' && actionData?.followUpDate) {
            // Navigate to appointment detail or filter
          } else if (actionType === 'book_appointment') {
            // Navigate to booking screen
          }
        }}
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerRight: {
    width: 36,
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d',
  },
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingMoreText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#7f8c8d',
  },
  
  // List
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  
  // Appointment Card
  appointmentCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    overflow: 'hidden',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  cardContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  mainInfo: {
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 6,
  },
  petInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  petName: {
    fontSize: 14,
    color: '#7f8c8d',
    marginLeft: 6,
    fontWeight: '500',
  },
  datetimeInfo: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 16,
  },
  datetimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  datetimeText: {
    fontSize: 14,
    color: '#2c3e50',
    marginLeft: 6,
    fontWeight: '500',
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginLeft: 6,
    fontWeight: '500',
  },
  arrowContainer: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  
  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 24,
  },
}); 