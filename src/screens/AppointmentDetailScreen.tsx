import apiClient from '@/api/client';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View, Image, Alert } from 'react-native';
import GradientBackground from '../components/GradientBackground';

export default function AppointmentDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { appointmentId } = (route.params || {}) as { appointmentId: number };
  const [data, setData] = useState<any>(null);
  const [petData, setPetData] = useState<any>(null);
  const [serviceData, setServiceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!appointmentId) return;
    
    const fetchAppointmentDetails = async () => {
      setLoading(true);
      try {
        // Fetch appointment details
        const appointmentRes = await apiClient.get(`/Appointment/${appointmentId}`);
        const appointmentData = appointmentRes.data;
        setData(appointmentData);

        // Fetch pet details if petId exists
        if (appointmentData.petId) {
          try {
            const petRes = await apiClient.get(`/Pet/${appointmentData.petId}`);
            setPetData(petRes.data);
          } catch (petError) {
            console.log('Could not fetch pet details:', petError);
          }
        }

        // Fetch service details if serviceId exists
        if (appointmentData.serviceId) {
          try {
            const serviceRes = await apiClient.get(`/Service/${appointmentData.serviceId}`);
            setServiceData(serviceRes.data);
          } catch (serviceError) {
            console.log('Could not fetch service details:', serviceError);
          }
        }

      } catch (err) {
        setError('Không thể tải chi tiết lịch hẹn.');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointmentDetails();
  }, [appointmentId]);

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return '#F39C12'; // Chờ duyệt
      case 1: return '#27AE60'; // Đã duyệt
      case 2: return '#3498DB'; // Hoàn thành
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

  if (loading) {
    return (
      <GradientBackground>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Đang tải chi tiết lịch hẹn...</Text>
        </View>
      </GradientBackground>
    );
  }
  
  if (error) {
    return (
      <GradientBackground>
        <View style={styles.center}>
          <Ionicons name="alert-circle" size={48} color="#E74C3C" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.retryButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </GradientBackground>
    );
  }
  
  if (!data) {
    return (
      <GradientBackground>
        <View style={styles.center}>
          <Ionicons name="document-outline" size={48} color="#95A5A6" />
          <Text style={styles.errorText}>Không tìm thấy lịch hẹn</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.retryButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={26} color="#2c3e50" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết lịch hẹn</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Status Card */}
          <View style={styles.statusCard}>
            <View style={[styles.statusIcon, { backgroundColor: getStatusColor(data.status) }]}>
              <Ionicons name={getStatusIcon(data.status)} size={24} color="white" />
            </View>
            <View style={styles.statusContent}>
              <Text style={styles.statusTitle}>Trạng thái lịch hẹn</Text>
              <Text style={[styles.statusText, { color: getStatusColor(data.status) }]}>
                {data.statusText}
              </Text>
            </View>
          </View>

          {/* Pet Information */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="paw" size={20} color="#FF6B9D" />
              <Text style={styles.sectionTitle}>Thông tin thú cưng</Text>
            </View>
            
            {petData ? (
              <View style={styles.petInfo}>
                <Image 
                  source={{ uri: petData.imageUrl || 'https://via.placeholder.com/80x80/FF6B9D/FFFFFF?text=🐾' }} 
                  style={styles.petImage}
                />
                <View style={styles.petDetails}>
                  <Text style={styles.petName}>{petData.name}</Text>
                  <Text style={styles.petInfoText}>
                    <Ionicons name="leaf" size={14} color="#27AE60" /> {petData.species || 'Không xác định'}
                  </Text>
                  <Text style={styles.petInfoText}>
                    <Ionicons name="calendar" size={14} color="#3498DB" /> {petData.age ? `${petData.age} tuổi` : 'Tuổi chưa xác định'}
                  </Text>
                  <Text style={styles.petInfoText}>
                    <Ionicons name="scale" size={14} color="#F39C12" /> {petData.weight ? `${petData.weight}kg` : 'Cân nặng chưa xác định'}
                  </Text>
                  {petData.breed && (
                    <Text style={styles.petInfoText}>
                      <Ionicons name="library" size={14} color="#9B59B6" /> {petData.breed}
                    </Text>
                  )}
                </View>
              </View>
            ) : (
              <View style={styles.noPetInfo}>
                <Text style={styles.petName}>{data.petName}</Text>
                <Text style={styles.noPetText}>Thông tin chi tiết thú cưng không khả dụng</Text>
              </View>
            )}
          </View>

          {/* Service Information */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="medical" size={20} color="#4ECDC4" />
              <Text style={styles.sectionTitle}>Thông tin dịch vụ</Text>
            </View>
            
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{data.serviceName}</Text>
              
              {serviceData && (
                <>
                  {serviceData.description && (
                    <Text style={styles.serviceDescription}>{serviceData.description}</Text>
                  )}
                  
                  <View style={styles.serviceDetails}>
                    {serviceData.price && (
                      <View style={styles.serviceDetailItem}>
                        <Ionicons name="cash" size={16} color="#27AE60" />
                        <Text style={styles.serviceDetailText}>Giá: {serviceData.price.toLocaleString('vi-VN')} VNĐ</Text>
                      </View>
                    )}
                    
                    {serviceData.duration && (
                      <View style={styles.serviceDetailItem}>
                        <Ionicons name="time" size={16} color="#3498DB" />
                        <Text style={styles.serviceDetailText}>Thời gian: {serviceData.duration} phút</Text>
                      </View>
                    )}
                    
                    {serviceData.category && (
                      <View style={styles.serviceDetailItem}>
                        <Ionicons name="folder" size={16} color="#9B59B6" />
                        <Text style={styles.serviceDetailText}>Danh mục: {serviceData.category}</Text>
                      </View>
                    )}
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Appointment Details */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar" size={20} color="#3498DB" />
              <Text style={styles.sectionTitle}>Chi tiết lịch hẹn</Text>
            </View>
            
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Ionicons name="calendar-outline" size={18} color="#3498DB" />
                <Text style={styles.detailLabel}>Ngày hẹn</Text>
                <Text style={styles.detailValue}>{data.appointmentDate}</Text>
              </View>
              
              <View style={styles.detailItem}>
                <Ionicons name="time-outline" size={18} color="#F39C12" />
                <Text style={styles.detailLabel}>Giờ hẹn</Text>
                <Text style={styles.detailValue}>{data.appointmentTime}</Text>
              </View>
              
              <View style={styles.detailItem}>
                <Ionicons name="person-outline" size={18} color="#27AE60" />
                <Text style={styles.detailLabel}>Bác sĩ</Text>
                <Text style={styles.detailValue}>{data.doctorName || 'Chưa chỉ định'}</Text>
              </View>
              
              {data.notes && (
                <View style={[styles.detailItem, styles.detailItemFull]}>
                  <Ionicons name="document-text-outline" size={18} color="#9B59B6" />
                  <Text style={styles.detailLabel}>Ghi chú</Text>
                  <Text style={styles.detailValue}>{data.notes}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          {data.status === 0 && (
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.cancelButton}>
                <Ionicons name="close-circle" size={20} color="#E74C3C" />
                <Text style={styles.cancelButtonText}>Hủy lịch hẹn</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.contactButton}>
                <Ionicons name="call" size={20} color="#FFFFFF" />
                <Text style={styles.contactButtonText}>Liên hệ</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d',
  },
  errorText: {
    fontSize: 16,
    color: '#2c3e50',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Header
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  backBtn: {
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
  
  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  
  // Status Card
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '700',
  },
  
  // Section Cards
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginLeft: 8,
  },
  
  // Pet Information
  petInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  petImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    marginRight: 16,
  },
  petDetails: {
    flex: 1,
  },
  petName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
  },
  petInfoText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  noPetInfo: {
    alignItems: 'center',
    padding: 20,
  },
  noPetText: {
    fontSize: 14,
    color: '#95A5A6',
    marginTop: 8,
  },
  
  // Service Information
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 12,
  },
  serviceDescription: {
    fontSize: 16,
    color: '#7f8c8d',
    lineHeight: 24,
    marginBottom: 16,
  },
  serviceDetails: {
    gap: 8,
  },
  serviceDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceDetailText: {
    fontSize: 14,
    color: '#2c3e50',
    marginLeft: 8,
    fontWeight: '500',
  },
  
  // Details Grid
  detailsGrid: {
    gap: 16,
  },
  detailItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailItemFull: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginLeft: 8,
    marginBottom: 4,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '600',
    flex: 1,
    marginLeft: 8,
  },
  
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFE8E8',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E74C3C',
    marginLeft: 8,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007bff',
    borderRadius: 12,
    padding: 16,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
}); 