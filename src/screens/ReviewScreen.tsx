import apiClient from '@/api/client';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Snackbar } from 'react-native-paper';
import GradientBackground from '../components/GradientBackground';

const MOCK_AVATAR = 'https://randomuser.me/api/portraits/men/32.jpg';
const MAX_COMMENT = 900;

const ratingIcons = [
  { icon: 'sad-tear', label: 'Tệ', color: '#E53935' },
  { icon: 'frown', label: 'Không hài lòng', color: '#FB8C00' },
  { icon: 'meh', label: 'Bình thường', color: '#FFD600' },
  { icon: 'smile', label: 'Hài lòng', color: '#42A5F5' },
  { icon: 'grin-stars', label: 'Tuyệt vời', color: '#43A047' },
];

export default function ReviewScreen() {
  const navigation = useNavigation();
  const [tab, setTab] = useState<'pending' | 'done'>('pending');
  const [pending, setPending] = useState<any[]>([]);
  const [done, setDone] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Toast notification state
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<'success' | 'error'>('success');

  const fetchData = async () => {
    setLoading(true);
    try {
      const appointmentsRes = await apiClient.get('/Appointment', { params: { status: 2, page: 1, limit: 100 } });
      const appointments = appointmentsRes.data.appointments || [];
      const feedbacksRes = await apiClient.get('/Feedback', { params: { page: 1, limit: 100 } });
      const feedbacks = feedbacksRes.data.feedbacks || [];
      const feedbackAppointmentIds = feedbacks.map((fb: any) => String(fb.appointmentId));
      const pendingList = appointments.filter((app: any) => !feedbackAppointmentIds.includes(String(app.appointmentId)));
      setPending(pendingList);
      setDone(feedbacks);
    } catch {
      setPending([]);
      setDone([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = (appointment: any) => {
    setSelectedAppointment(appointment);
    setRating(5);
    setComment('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAppointment(null);
    setRating(5);
    setComment('');
  };

  const handleSubmit = async () => {
    if (!selectedAppointment) return;
    if (!rating) return;
    setSubmitting(true);
    try {
      await apiClient.post('/Feedback', {
        appointmentId: selectedAppointment.appointmentId,
        rating,
        comment,
      });
      
      // Haptic feedback for success
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Show success message
      setSnackbarMessage('Cảm ơn bạn đã đánh giá! Đánh giá của bạn đã được gửi thành công.');
      setSnackbarType('success');
      setSnackbarVisible(true);
      
      closeModal();
      fetchData();
    } catch (error: any) {
      // Haptic feedback for error
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      // Show error message
      let errorMessage = 'Đã xảy ra lỗi khi gửi đánh giá. Vui lòng thử lại.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setSnackbarMessage(errorMessage);
      setSnackbarType('error');
      setSnackbarVisible(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <GradientBackground>
      <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={26} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đánh giá của tôi</Text>
      </View>
      {/* Info */}
      <View style={styles.infoRow}>
        <Image source={{ uri: MOCK_AVATAR }} style={styles.avatar} />
        <View style={{ marginLeft: 18 }}>
          <Text style={styles.infoNumber}>{done.length}</Text>
          <Text style={styles.infoLabel}>Đánh giá</Text>
        </View>
      </View>
      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity style={[styles.tabBtn, tab === 'pending' && styles.tabActive]} onPress={() => setTab('pending')}>
          <Text style={[styles.tabText, tab === 'pending' && styles.tabTextActive]}>Chưa đánh giá</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, tab === 'done' && styles.tabActive]} onPress={() => setTab('done')}>
          <Text style={[styles.tabText, tab === 'done' && styles.tabTextActive]}>Đã đánh giá</Text>
        </TouchableOpacity>
      </View>
      {/* Content */}
      {loading ? (
        <View style={styles.emptyBox}>
          <ActivityIndicator size="large" color="#FFB300" />
        </View>
      ) : tab === 'pending' ? (
        pending.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="star-outline" size={72} color="#FFB300" style={{ marginBottom: 18 }} />
            <Text style={styles.emptyTitle}>Không có lịch nào cần đánh giá</Text>
            <Text style={styles.emptyDesc}>Bạn đã hoàn tất đánh giá tất cả lịch hẹn.</Text>
            <TouchableOpacity style={styles.disabledBtn} disabled>
              <Text style={styles.disabledBtnText}>Xem các lịch đã đánh giá</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={pending}
            keyExtractor={item => item.appointmentId?.toString()}
            renderItem={({ item }) => (
              <View style={styles.pendingCard}>
                <Ionicons name="calendar" size={28} color="#42A5F5" style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{item.serviceName} - {item.petName}</Text>
                  <Text style={{ color: '#888', fontSize: 14 }}>Ngày: {item.appointmentDate}  Giờ: {item.appointmentTime}</Text>
                  <Text style={{ color: '#888', fontSize: 14 }}>Bác sĩ: {item.doctorName || 'Chưa chỉ định'}</Text>
                </View>
                <TouchableOpacity style={styles.reviewBtn} onPress={() => openModal(item)}>
                  <Text style={styles.reviewBtnText}>Đánh giá</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )
      ) : (
        done.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>Chưa có đánh giá nào</Text>
          </View>
        ) : (
          <FlatList
            data={done}
            keyExtractor={item => item.feedbackId?.toString()}
            renderItem={({ item }) => (
              <View style={styles.doneCard}>
                <Ionicons name="star" size={24} color="#FFB300" style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{item.serviceName} - {item.petName}</Text>
                  <Text style={{ color: '#888', fontSize: 14 }}>Ngày: {item.appointmentDate}  Giờ: {item.appointmentTime}</Text>
                  <Text style={{ color: '#888', fontSize: 14 }}>Bác sĩ: {item.doctorName || 'Chưa chỉ định'}</Text>
                  <Text style={{ color: '#FFB300', fontWeight: 'bold', fontSize: 15 }}>{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}  {item.rating}/5</Text>
                  {item.comment ? <Text style={{ color: '#444', marginTop: 2 }}>{item.comment}</Text> : null}
                </View>
              </View>
            )}
          />
        )
      )}

      {/* Modal đánh giá */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Đánh giá dịch vụ</Text>
            <Text style={styles.modalSub}>Hãy chia sẻ cảm nhận của bạn về dịch vụ này</Text>
            {/* Rating icons cảm xúc */}
            <View style={styles.ratingRow}>
              {ratingIcons.map((r, idx) => (
                <TouchableOpacity key={idx} onPress={() => setRating(idx + 1)} style={{ alignItems: 'center', flex: 1 }}>
                  <View style={[
                    styles.emojiCircle,
                    rating === idx + 1 && { backgroundColor: r.color + '22', transform: [{ scale: 1.25 }] }
                  ]}>
                    <FontAwesome5
                      name={r.icon}
                      size={rating === idx + 1 ? 48 : 32}
                      color={rating === idx + 1 ? r.color : '#bbb'}
                    />
                  </View>
                  {rating === idx + 1 && <Text style={{ color: r.color, fontWeight: 'bold', fontSize: 13 }}>{r.label}</Text>}
                </TouchableOpacity>
              ))}
            </View>
            {/* Comment input */}
            <TextInput
              style={styles.textArea}
              placeholder="Hãy chia sẻ cảm nhận của bạn..."
              value={comment}
              onChangeText={t => t.length <= MAX_COMMENT && setComment(t)}
              multiline
              maxLength={MAX_COMMENT}
            />
            <Text style={styles.charCount}>{comment.length} / {MAX_COMMENT}</Text>
            {/* Buttons */}
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.dismissBtn} onPress={closeModal} disabled={submitting}>
                <Text style={styles.dismissBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sendBtn, { opacity: submitting ? 0.6 : 1 }]}
                onPress={handleSubmit}
                disabled={submitting || !rating || comment.trim().length === 0}
              >
                <Text style={styles.sendBtnText}>Gửi đánh giá</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Snackbar for notifications */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={4000}
        style={{
          backgroundColor: snackbarType === 'success' ? '#4CAF50' : '#F44336',
          marginBottom: 20,
        }}
        action={{
          label: 'Đóng',
          onPress: () => setSnackbarVisible(false),
          textColor: '#fff',
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: '#FFB300',
    backgroundColor: '#eee',
  },
  infoNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#FF5722',
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 16,
    color: '#888',
    fontWeight: 'bold',
  },
  tabTextActive: {
    color: '#FF5722',
  },
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#888',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 15,
    color: '#aaa',
    marginBottom: 18,
    textAlign: 'center',
  },
  disabledBtn: {
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 6,
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: '#f7f7f7',
  },
  disabledBtnText: {
    color: '#888',
    fontSize: 15,
  },
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 14,
    shadowColor: '#42A5F5',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  reviewBtn: {
    backgroundColor: '#FFB300',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginLeft: 8,
  },
  reviewBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  doneCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 14,
    shadowColor: '#FFB300',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '92%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 6,
    textAlign: 'center',
  },
  modalSub: {
    fontSize: 15,
    color: '#888',
    marginBottom: 18,
    textAlign: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    width: '100%',
    marginBottom: 18,
    marginTop: 2,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 8,
    minHeight: 80,
    width: '100%',
    padding: 12,
    fontSize: 16,
    marginBottom: 6,
    textAlignVertical: 'top',
  },
  charCount: {
    alignSelf: 'flex-end',
    color: '#888',
    fontSize: 13,
    marginBottom: 10,
  },
  modalBtnRow: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 8,
    justifyContent: 'space-between',
  },
  dismissBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 8,
    paddingVertical: 12,
    marginRight: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  dismissBtnText: {
    color: '#888',
    fontWeight: 'bold',
    fontSize: 16,
  },
  sendBtn: {
    flex: 1,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  sendBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emojiCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    backgroundColor: 'transparent',
  },
}); 