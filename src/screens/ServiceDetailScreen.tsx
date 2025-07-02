import apiClient from '@/api/client';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ResizeMode, Video } from 'expo-av';
import React from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Modal, Platform, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';

const { width } = Dimensions.get('window');

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
    if (!service) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Không tìm thấy thông tin dịch vụ.</Text></View>;
    const mediaLinks = extractMediaLinks(service.description || '');
    const descriptionParts = splitDescriptionWithMedia(service.description || '');
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
            <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 0 }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ position: 'absolute', top: 10, left: 10, zIndex: 2 }}>
                    <Ionicons name="arrow-back" size={28} color="#007bff" />
                </TouchableOpacity>
                <View style={{ minHeight: 40 }} />
                <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 10 }}>{service.name}</Text>
                <Text style={{ color: '#007bff', fontWeight: '600', fontSize: 16, marginBottom: 5 }}>Giá: {service.priceText || 'Liên hệ'}</Text>
                <Text style={{ color: '#28a745', fontWeight: '600', fontSize: 16, marginBottom: 5 }}>Thời lượng: {service.durationText || 'Liên hệ'}</Text>
                {service.category && <Text style={{ color: '#888', fontSize: 15, marginBottom: 10 }}>Loại: {service.category}</Text>}
                {/* Render mô tả và media đúng thứ tự */}
                {descriptionParts.map((part, idx) => {
                    if (isImage(part)) {
                        return <Image key={idx} source={{ uri: part }} style={{ width: width - 40, height: 200, borderRadius: 10, marginBottom: 15 }} resizeMode="cover" />;
                    } else if (isMp4(part)) {
                        return <Video key={idx} source={{ uri: part }} style={{ width: width - 40, height: 220, borderRadius: 10, marginBottom: 15 }} useNativeControls resizeMode={ResizeMode.CONTAIN} />;
                    } else if (isYouTube(part)) {
                        let videoId = '';
                        const ytMatch = part.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w\-]+)/);
                        if (ytMatch) videoId = ytMatch[1];
                        const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : part;
                        return <WebView key={idx} source={{ uri: embedUrl }} style={{ width: width - 40, height: 220, borderRadius: 10, marginBottom: 15 }} />;
                    } else {
                        // Là text
                        return <Text key={idx} style={{ fontSize: 16, color: '#333', marginTop: 10, marginBottom: 16 }}>{part.trim()}</Text>;
                    }
                })}
                {/* Nút đặt lịch */}
                <TouchableOpacity
                    style={{ backgroundColor: '#007bff', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 30, marginBottom: 20 }}
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
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>Đặt lịch</Text>
                </TouchableOpacity>
                <BookingModal
                    visible={showBookingModal}
                    onClose={() => setShowBookingModal(false)}
                    service={service}
                />
            </ScrollView>
        </SafeAreaView>
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
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 20, width: '90%' }}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>Đặt lịch cho dịch vụ: {service.name}</Text>
                    {loading ? <ActivityIndicator /> : (
                        <>
                            <Text style={{ fontWeight: '500', marginTop: 10 }}>Chọn thú cưng *</Text>
                            <ScrollView horizontal style={{ marginVertical: 8 }}>
                                {pets.map(pet => (
                                    <TouchableOpacity key={pet.petId} style={{ padding: 8, borderWidth: 1, borderColor: form.petId == String(pet.petId) ? '#007bff' : '#ccc', borderRadius: 8, marginRight: 8 }} onPress={() => setForm(f => ({ ...f, petId: pet.petId.toString() }))}>
                                        <Text>{pet.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            <Text style={{ fontWeight: '500', marginTop: 10 }}>Ngày hẹn *</Text>
                            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, marginBottom: 8 }}>
                                <Text>{form.date || 'dd/mm/yyyy'}</Text>
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
                            <Text style={{ fontWeight: '500', marginTop: 10 }}>Giờ hẹn *</Text>
                            <TouchableOpacity onPress={() => setShowTimePicker(true)} style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, marginBottom: 8 }}>
                                <Text>{form.time || 'HH:mm'}</Text>
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
                            <Text style={{ fontWeight: '500', marginTop: 10 }}>Bác sĩ</Text>
                            <ScrollView horizontal style={{ marginVertical: 8 }}>
                                <TouchableOpacity style={{ padding: 8, borderWidth: 1, borderColor: form.doctorId == '' ? '#007bff' : '#ccc', borderRadius: 8, marginRight: 8 }} onPress={() => setForm(f => ({ ...f, doctorId: '' }))}>
                                    <Text>Không chọn riêng</Text>
                                </TouchableOpacity>
                                {doctors.map(doc => (
                                    <TouchableOpacity key={doc.doctorId} style={{ padding: 8, borderWidth: 1, borderColor: form.doctorId == String(doc.doctorId) ? '#007bff' : '#ccc', borderRadius: 8, marginRight: 8 }} onPress={() => setForm(f => ({ ...f, doctorId: doc.doctorId.toString() }))}>
                                        <Text>{doc.displayText}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            <Text style={{ fontWeight: '500', marginTop: 10 }}>Ghi chú</Text>
                            <TextInput style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, marginBottom: 8 }} placeholder="Ghi chú thêm..." value={form.notes} onChangeText={val => setForm(f => ({ ...f, notes: val }))} />
                            {error && <Text style={{ color: 'red', marginBottom: 8 }}>{error}</Text>}
                            {success && <Text style={{ color: 'green', marginBottom: 8 }}>{success}</Text>}
                            <TouchableOpacity style={{ backgroundColor: '#007bff', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 }} onPress={handleSubmit} disabled={submitting}>
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>{submitting ? 'Đang gửi...' : 'Đặt lịch'}</Text>
                            </TouchableOpacity>
                        </>
                    )}
                    <TouchableOpacity style={{ alignItems: 'center', marginTop: 15 }} onPress={onClose}>
                        <Text style={{ color: '#007bff' }}>Đóng</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
} 