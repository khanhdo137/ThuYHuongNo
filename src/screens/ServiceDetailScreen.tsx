import apiClient from '@/api/client';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ResizeMode, Video } from 'expo-av';
import React from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Modal, Platform, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View, StatusBar, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerContainer: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingBottom: 24,
    shadowColor: '#007bff',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  headerSpacer: {
    height: 80,
  },
  serviceTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 16,
    color: '#1e293b',
    textAlign: 'center',
    marginHorizontal: 20,
    lineHeight: 36,
  },
  priceContainer: {
    backgroundColor: '#f0f9ff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  priceText: {
    color: '#007bff',
    fontWeight: '700',
    fontSize: 20,
    textAlign: 'center',
  },
  durationContainer: {
    backgroundColor: '#f0fdf4',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
  },
  durationText: {
    color: '#22c55e',
    fontWeight: '600',
    fontSize: 18,
    textAlign: 'center',
  },
  categoryContainer: {
    backgroundColor: '#fef3c7',
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  categoryText: {
    color: '#f59e0b',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  contentContainer: {
    padding: 24,
  },
  mediaContainer: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#007bff',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  contentImage: {
    width: width - 48,
    height: 220,
    borderRadius: 16,
    alignSelf: 'center',
  },
  contentVideo: {
    width: width - 48,
    height: 240,
    borderRadius: 16,
    alignSelf: 'center',
  },
  webViewContainer: {
    width: width - 48,
    height: 240,
    borderRadius: 16,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  contentText: {
    fontSize: 18,
    color: '#334155',
    marginTop: 12,
    marginBottom: 20,
    textAlign: 'justify',
    lineHeight: 28,
    fontWeight: '400',
  },
  bookingButton: {
    backgroundColor: '#007bff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
    shadowColor: '#007bff',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  bookingButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 20,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '92%',
    maxHeight: '90%',
    shadowColor: '#007bff',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 20,
    color: '#1e293b',
    textAlign: 'center',
  },
  formLabel: {
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: '#374151',
    fontSize: 16,
  },
  petSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 8,
  },
  petOption: {
    padding: 12,
    borderWidth: 2,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: 'white',
  },
  petOptionSelected: {
    borderColor: '#007bff',
    backgroundColor: '#f0f9ff',
  },
  petOptionUnselected: {
    borderColor: '#e5e7eb',
  },
  petOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dateTimeButton: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    backgroundColor: 'white',
  },
  dateTimeButtonText: {
    fontSize: 16,
    color: '#374151',
  },
  doctorSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 8,
  },
  doctorOption: {
    padding: 12,
    borderWidth: 2,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: 'white',
  },
  doctorOptionSelected: {
    borderColor: '#007bff',
    backgroundColor: '#f0f9ff',
  },
  doctorOptionUnselected: {
    borderColor: '#e5e7eb',
  },
  doctorOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  notesInput: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    backgroundColor: 'white',
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#ef4444',
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  successText: {
    color: '#22c55e',
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#007bff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#007bff',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  closeButton: {
    alignItems: 'center',
    marginTop: 20,
    padding: 12,
  },
  closeButtonText: {
    color: '#007bff',
    fontSize: 16,
    fontWeight: '600',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
});

function extractMediaLinks(text: string) {
    const urlRegex = /(https?:\/\/[\w\-._~:/?#[\]@!$&'()*+,;=%]+\.(?:jpg|jpeg|png|gif|mp4)|https?:\/\/(?:www\.)?youtu(?:\.be|be\.com)\/(?:watch\?v=)?([\w\-]+))/gi;
    const matches = [...text.matchAll(urlRegex)];
    return matches.map(m => m[0]);
}

function isImage(url: string) {
    return url.match(/\.(jpg|jpeg|png|gif)$/i);
}
function isMp4(url: string) {
    return url.match(/\.mp4$/i);
}
function isYouTube(url: string) {
    return url.includes('youtube.com') || url.includes('youtu.be');
}

function removeMediaLinksFromText(text: string) {
    // Loại bỏ các đường dẫn ảnh, video, youtube khỏi mô tả
    return text.replace(/https?:\/\/[\w\-._~:/?#[\]@!$&'()*+,;=%]+\.(jpg|jpeg|png|gif|mp4)|https?:\/\/(?:www\.)?youtu(?:\.be|be\.com)\/[\w\-._~:/?#[\]@!$&'()*+,;=%]+/gi, '').replace(/\s{2,}/g, ' ').trim();
}

function splitDescriptionWithMedia(text: string) {
    // Regex khớp media link
    const urlRegex = /(https?:\/\/[\w\-._~:/?#[\]@!$&'()*+,;=%]+\.(?:jpg|jpeg|png|gif|mp4)|https?:\/\/(?:www\.)?youtu(?:\.be|be\.com)\/[\w\-._~:/?#[\]@!$&'()*+,;=%]+)/gi;
    const parts = [];
    let lastIndex = 0;
    let match;
    while ((match = urlRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }
        parts.push(match[0]);
        lastIndex = urlRegex.lastIndex;
    }
    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }
    return parts.filter(p => p && p.trim() !== '');
}

export default function ServiceDetailScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const [showBookingModal, setShowBookingModal] = React.useState(false);
    const [isLoggedIn, setIsLoggedIn] = React.useState(false);
    // @ts-ignore
    const { service } = route.params || {};
    const [showDatePicker, setShowDatePicker] = React.useState(false);
    const [showTimePicker, setShowTimePicker] = React.useState(false);
    
    React.useEffect(() => {
        AsyncStorage.getItem('token').then(token => setIsLoggedIn(!!token));
    }, []);
    
    if (!service) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <Ionicons name="medical-outline" size={80} color="#cbd5e1" />
                    <Text style={{ fontSize: 18, color: '#64748b', marginTop: 16, textAlign: 'center' }}>
                        Không tìm thấy thông tin dịch vụ
                    </Text>
                </View>
            </View>
        );
    }
    
    const mediaLinks = extractMediaLinks(service.description || '');
    const descriptionParts = splitDescriptionWithMedia(service.description || '');
    
    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header Section */}
                <View style={styles.headerContainer}>
                    <LinearGradient
                        colors={['rgba(0, 123, 255, 0.05)', 'transparent']}
                        style={styles.gradientOverlay}
                    />
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#007bff" />
                    </TouchableOpacity>
                    <View style={styles.headerSpacer} />
                    
                    <Text style={styles.serviceTitle}>{service.name}</Text>
                    
                    {/* Price Container */}
                    <View style={styles.priceContainer}>
                        <Text style={styles.priceText}>
                            💰 Giá: {service.priceText || 'Liên hệ'}
                        </Text>
                    </View>
                    
                    {/* Duration Container */}
                    <View style={styles.durationContainer}>
                        <Text style={styles.durationText}>
                            ⏱️ Thời lượng: {service.durationText || 'Liên hệ'}
                        </Text>
                    </View>
                    
                    {/* Category Container */}
                    {service.category && (
                        <View style={styles.categoryContainer}>
                            <Text style={styles.categoryText}>
                                🏷️ Loại: {service.category}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Content Section */}
                <View style={styles.contentContainer}>
                    {descriptionParts.map((part, idx) => {
                        if (isImage(part)) {
                            return (
                                <View key={idx} style={styles.mediaContainer}>
                                    <Image 
                                        source={{ uri: part }} 
                                        style={styles.contentImage} 
                                        resizeMode="cover" 
                                    />
                                </View>
                            );
                        } else if (isMp4(part)) {
                            return (
                                <View key={idx} style={styles.mediaContainer}>
                                    <Video 
                                        source={{ uri: part }} 
                                        style={styles.contentVideo} 
                                        useNativeControls 
                                        resizeMode={ResizeMode.CONTAIN} 
                                    />
                                </View>
                            );
                        } else if (isYouTube(part)) {
                            let videoId = '';
                            const ytMatch = part.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w\-]+)/);
                            if (ytMatch) videoId = ytMatch[1];
                            const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : part;
                            return (
                                <View key={idx} style={styles.mediaContainer}>
                                    <WebView 
                                        source={{ uri: embedUrl }} 
                                        style={styles.webViewContainer} 
                                    />
                                </View>
                            );
                        } else {
                            return (
                                <Text key={idx} style={styles.contentText}>
                                    {part.trim()}
                                </Text>
                            );
                        }
                    })}
                    
                    {/* Booking Button */}
                    <TouchableOpacity
                        style={styles.bookingButton}
                        onPress={async () => {
                            const token = await AsyncStorage.getItem('token');
                            if (token) setShowBookingModal(true);
                            else {
                                Alert.alert('Thông báo', 'Bạn cần đăng nhập để đặt lịch', [
                                    { text: 'Đăng nhập', onPress: () => (navigation as any).navigate('Login') },
                                    { text: 'Hủy', style: 'cancel' }
                                ]);
                            }
                        }}
                    >
                        <Text style={styles.bookingButtonText}>📅 Đặt lịch ngay</Text>
                    </TouchableOpacity>
                </View>
                
                <BookingModal
                    visible={showBookingModal}
                    onClose={() => setShowBookingModal(false)}
                    service={service}
                />
            </ScrollView>
        </View>
    );
}

// BookingModal nội bộ file, rút gọn từ BookingScreen
function BookingModal({ visible, onClose, service }: { visible: boolean, onClose: () => void, service: any }) {
    const [pets, setPets] = React.useState<Array<{ petId: number, name: string, species: string, age?: number }>>([]);
    const [doctors, setDoctors] = React.useState<Array<{doctorId: number, fullName: string, specialization: string, branch: string, displayText: string}>>([]);
    const [form, setForm] = React.useState({
        petId: '',
        doctorId: '',
        date: '',
        time: '',
        notes: '',
    });
    const [loading, setLoading] = React.useState(false);
    const [submitting, setSubmitting] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [success, setSuccess] = React.useState<string | null>(null);
    const [showDatePicker, setShowDatePicker] = React.useState(false);
    const [showTimePicker, setShowTimePicker] = React.useState(false);

    React.useEffect(() => {
        if (!visible) return;
        setLoading(true);
        Promise.all([
            apiClient.get('/Pet'),
            apiClient.get('/Doctor'),
        ]).then(([petRes, docRes]) => {
            setPets(petRes.data.map((pet: any) => ({ petId: pet.petId, name: pet.name, species: pet.species, age: pet.age })));
            setDoctors(docRes.data);
        }).catch(() => {
            setPets([]); setDoctors([]);
        }).finally(() => setLoading(false));
    }, [visible]);

    const handleSubmit = async () => {
        setError(null); setSuccess(null);
        if (!form.petId || !form.date || !form.time) {
            setError('Vui lòng điền đủ thông tin bắt buộc.');
            return;
        }
        setSubmitting(true);
        try {
            // Gộp ngày và giờ
            const [dd, mm, yyyy] = form.date.split('/');
            const appointmentDate = `${yyyy}-${mm}-${dd}`;
            const payload = {
                petId: parseInt(form.petId, 10),
                serviceId: service.serviceId,
                doctorId: form.doctorId ? parseInt(form.doctorId, 10) : undefined,
                appointmentDate,
                appointmentTime: form.time,
                notes: form.notes,
            };
            await apiClient.post('/Appointment', payload);
            setSuccess('Đặt lịch thành công!');
            setForm({ petId: '', doctorId: '', date: '', time: '', notes: '' });
        } catch (err: any) {
            setError('Có lỗi xảy ra khi đặt lịch.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>
                        📅 Đặt lịch cho dịch vụ: {service.name}
                    </Text>
                    
                    {loading ? (
                        <View style={{ alignItems: 'center', padding: 40 }}>
                            <ActivityIndicator size="large" color="#007bff" />
                            <Text style={{ marginTop: 16, color: '#64748b' }}>Đang tải...</Text>
                        </View>
                    ) : (
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Pet Selection */}
                            <Text style={styles.formLabel}>🐾 Chọn thú cưng *</Text>
                            <View style={styles.petSelector}>
                                {pets.map(pet => (
                                    <TouchableOpacity 
                                        key={pet.petId} 
                                        style={[
                                            styles.petOption,
                                            form.petId == String(pet.petId) ? styles.petOptionSelected : styles.petOptionUnselected
                                        ]} 
                                        onPress={() => setForm(f => ({ ...f, petId: pet.petId.toString() }))}
                                    >
                                        <Text style={styles.petOptionText}>{pet.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Date Selection */}
                            <Text style={styles.formLabel}>📅 Ngày hẹn *</Text>
                            <TouchableOpacity 
                                onPress={() => setShowDatePicker(true)} 
                                style={styles.dateTimeButton}
                            >
                                <Text style={styles.dateTimeButtonText}>
                                    {form.date || 'Chọn ngày (dd/mm/yyyy)'}
                                </Text>
                            </TouchableOpacity>
                            {showDatePicker && (
                                <DateTimePicker
                                    value={form.date ? new Date(form.date.split('/').reverse().join('-')) : new Date()}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={(event, selectedDate) => {
                                        setShowDatePicker(false);
                                        if (selectedDate) {
                                            const dd = String(selectedDate.getDate()).padStart(2, '0');
                                            const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
                                            const yyyy = selectedDate.getFullYear();
                                            setForm(f => ({ ...f, date: `${dd}/${mm}/${yyyy}` }));
                                        }
                                    }}
                                    minimumDate={new Date()}
                                />
                            )}

                            {/* Time Selection */}
                            <Text style={styles.formLabel}>🕐 Giờ hẹn *</Text>
                            <TouchableOpacity 
                                onPress={() => setShowTimePicker(true)} 
                                style={styles.dateTimeButton}
                            >
                                <Text style={styles.dateTimeButtonText}>
                                    {form.time || 'Chọn giờ (HH:mm)'}
                                </Text>
                            </TouchableOpacity>
                            {showTimePicker && (
                                <DateTimePicker
                                    value={form.time ? new Date(`1970-01-01T${form.time}`) : new Date()}
                                    mode="time"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={(event, selectedTime) => {
                                        setShowTimePicker(false);
                                        if (selectedTime) {
                                            const hh = String(selectedTime.getHours()).padStart(2, '0');
                                            const mm = String(selectedTime.getMinutes()).padStart(2, '0');
                                            setForm(f => ({ ...f, time: `${hh}:${mm}` }));
                                        }
                                    }}
                                />
                            )}

                            {/* Doctor Selection */}
                            <Text style={styles.formLabel}>👨‍⚕️ Bác sĩ</Text>
                            <View style={styles.doctorSelector}>
                                <TouchableOpacity 
                                    style={[
                                        styles.doctorOption,
                                        form.doctorId == '' ? styles.doctorOptionSelected : styles.doctorOptionUnselected
                                    ]} 
                                    onPress={() => setForm(f => ({ ...f, doctorId: '' }))}
                                >
                                    <Text style={styles.doctorOptionText}>Không chọn riêng</Text>
                                </TouchableOpacity>
                                {doctors.map(doc => (
                                    <TouchableOpacity 
                                        key={doc.doctorId} 
                                        style={[
                                            styles.doctorOption,
                                            form.doctorId == String(doc.doctorId) ? styles.doctorOptionSelected : styles.doctorOptionUnselected
                                        ]} 
                                        onPress={() => setForm(f => ({ ...f, doctorId: doc.doctorId.toString() }))}
                                    >
                                        <Text style={styles.doctorOptionText}>{doc.displayText}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Notes */}
                            <Text style={styles.formLabel}>📝 Ghi chú</Text>
                            <TextInput 
                                style={styles.notesInput} 
                                placeholder="Ghi chú thêm về dịch vụ..." 
                                value={form.notes} 
                                onChangeText={val => setForm(f => ({ ...f, notes: val }))}
                                multiline
                            />

                            {/* Error/Success Messages */}
                            {error && <Text style={styles.errorText}>❌ {error}</Text>}
                            {success && <Text style={styles.successText}>✅ {success}</Text>}

                            {/* Submit Button */}
                            <TouchableOpacity 
                                style={styles.submitButton} 
                                onPress={handleSubmit} 
                                disabled={submitting}
                            >
                                <Text style={styles.submitButtonText}>
                                    {submitting ? '⏳ Đang gửi...' : '📅 Đặt lịch'}
                                </Text>
                            </TouchableOpacity>
                        </ScrollView>
                    )}
                    
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>✕ Đóng</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
} 