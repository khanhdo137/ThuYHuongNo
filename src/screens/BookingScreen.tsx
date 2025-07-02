import apiClient from '@/api/client';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import { Modal, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

// Custom component for form rows
interface FormRowProps {
    label: string;
    children: React.ReactNode;
}
const FormRow = ({ label, children }: FormRowProps) => (
    <View style={styles.formRow}>
        <Text style={styles.label}>{label}</Text>
        {children}
    </View>
);

// Picker component that now triggers a modal
interface MockPickerProps {
    icon?: React.ComponentProps<typeof Ionicons>['name'];
    label: string;
    selectedValue: string;
    onPress: () => void;
}
const MockPicker = ({ icon, label, selectedValue, onPress }: MockPickerProps) => {
    return (
        <TouchableOpacity style={styles.pickerContainer} onPress={onPress}>
            <Text style={styles.pickerText}>{selectedValue || label}</Text>
            <Ionicons name={icon || "chevron-down"} size={20} color="#666" />
        </TouchableOpacity>
    );
};

export default function BookingScreen() {
    const initialFormData = {
        phone: '',
        name: '',
        petSelection: 'Mới',
        petName: '',
        species: '',
        weight: '',
        age: '',
        vaccines: '',
        date: '21/06/2025',
        time: '07:00',
        doctor: '',
        serviceId: '',
        notes: '',
    };
    const [formData, setFormData] = useState(initialFormData);
    
    const [isPickerVisible, setPickerVisible] = useState(false);
    const [pickerData, setPickerData] = useState<{items: string[], onSelect: (value: string) => void}>({ items: [], onSelect: () => {} });
    const [doctors, setDoctors] = useState<Array<{doctorId: number, fullName: string, specialization: string, branch: string, displayText: string}>>([]);
    const [loading, setLoading] = useState(false);
    const [userInfo, setUserInfo] = useState<{customerName: string, phoneNumber: string} | null>(null);
    const [pets, setPets] = useState<Array<{ petId: number, name: string, species: string, age?: number }>>([]);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [services, setServices] = useState<Array<{ serviceId: number, name: string, displayText: string }>>([]);

    useEffect(() => {
        const fetchDoctors = async () => {
            setLoading(true);
            try {
                const response = await apiClient.get('/Doctor');
                if (response.data) {
                    setDoctors(response.data);
                }
            } catch (error) {
                console.error('Error fetching doctors:', error);
            } finally {
                setLoading(false);
            }
        };
        const fetchPets = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                if (token) {
                    const response = await apiClient.get('/Pet');
                    if (response.data) {
                        setPets(response.data.map((pet: any) => ({ petId: pet.petId, name: pet.name, species: pet.species, age: pet.age })));
                    }
                }
            } catch (error) {
                console.error('Error fetching pets:', error);
            }
        };
        const fetchServices = async () => {
            try {
                const response = await apiClient.get('/Service');
                const serviceList = response.data.data || response.data;
                setServices(serviceList.map((s: any) => ({ serviceId: s.serviceId, name: s.name, displayText: s.displayText })));
            } catch (error) {
                console.error('Error fetching services:', error);
            }
        };
        fetchDoctors();
        fetchPets();
        fetchServices();
    }, []);

    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                if (token) {
                    const response = await apiClient.get('/User/profile');
                    console.log('User profile response:', response.data);
                    if (response.data) {
                        setUserInfo(response.data);
                        setFormData(prev => ({
                            ...prev,
                            phone: response.data.phoneNumber || '',
                            name: response.data.customerName || response.data.customer?.customerName || '',
                        }));
                    }
                }
            } catch (error) {
                console.error('Error fetching user info:', error);
            }
        };
        fetchUserInfo();
    }, []);

    const openPicker = (items: string[], onSelect: (value: string) => void) => {
        setPickerData({ items, onSelect });
        setPickerVisible(true);
    };

    const handlePickerSelect = (value: string) => {
        pickerData.onSelect(value);
        setPickerVisible(false);
    };

    const handleInputChange = (field: keyof typeof formData, value: string) => {
        setFormData(prevState => ({ ...prevState, [field]: value }));
    };

    // Sample data for pickers
    const petOptions = ['Mới', ...pets.map(pet => pet.name)];
    const speciesOptions = ['Chó', 'Mèo'];
    const doctorOptions = ['Không chọn riêng', ...doctors.map(d => d.displayText)];
    const serviceOptions = services.map(s => ({ label: s.displayText, value: s.serviceId.toString() }));

    const handleSubmit = async () => {
        setError(null);
        setSuccess(null);
        // Validate dữ liệu
        if (!formData.phone || !formData.name || !formData.petName || !formData.species || !formData.date || !formData.time || !formData.serviceId) {
            setError('Vui lòng điền đầy đủ thông tin bắt buộc.');
            return;
        }
        setSubmitting(true);
        try {
            let petId: number | undefined;
            // Nếu là thú cưng mới, tạo mới
            if (formData.petSelection === 'Mới') {
                const petPayload = {
                    name: formData.petName,
                    species: formData.species,
                    breed: '',
                    birthDateString: '',
                    gender: '',
                    imageUrl: '',
                };
                const petRes = await apiClient.post('/Pet', petPayload);
                petId = petRes.data?.petId;
            } else {
                // Lấy petId từ danh sách
                const selectedPet = pets.find(p => p.name === formData.petSelection);
                petId = selectedPet?.petId;
            }
            if (!petId) {
                setError('Không xác định được thú cưng.');
                setSubmitting(false);
                return;
            }
            // Lấy doctorId
            let doctorId: number | null = null;
            if (formData.doctor && formData.doctor !== 'Không chọn riêng') {
                const doctorObj = doctors.find(d => d.displayText === formData.doctor);
                doctorId = doctorObj?.doctorId ?? null;
            }
            // Lấy serviceId
            const serviceId = parseInt(formData.serviceId, 10);
            // Gộp ngày và giờ thành định dạng backend yêu cầu
            const [dd, mm, yyyy] = formData.date.split('/');
            const appointmentDate = `${yyyy}-${mm}-${dd}`; // yyyy-MM-dd
            // Chuẩn bị payload
            const payload = {
                petId,
                serviceId,
                doctorId: doctorId || undefined,
                appointmentDate,
                appointmentTime: formData.time, // "HH:mm"
                weight: formData.weight ? parseFloat(formData.weight) : undefined,
                age: formData.age ? parseInt(formData.age) : undefined,
                isNewPet: formData.petSelection === 'Mới',
                notes: formData.notes,
            };
            console.log('Payload gửi lên /Appointment:', payload);
            await apiClient.post('/Appointment', payload);
            setSuccess('Đặt lịch thành công!');
            setFormData(initialFormData);
        } catch (err: any) {
            if (err.response && err.response.data) {
                setError('Lỗi: ' + JSON.stringify(err.response.data));
                console.error('API error:', err.response.data);
            } else {
                setError('Có lỗi xảy ra khi đặt lịch. Vui lòng thử lại.');
                console.error(err);
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Đặt lịch hẹn</Text>
                    <Text style={styles.headerSubtitle}>Vui lòng điền thông tin bên dưới để đặt lịch hẹn cho thú cưng của bạn.</Text>
                </View>

                <View style={styles.formContainer}>
                    <FormRow label="Số điện thoại">
                        <TextInput style={styles.input} value={formData.phone} onChangeText={val => handleInputChange('phone', val)} placeholder="Nhập số điện thoại" keyboardType="phone-pad" />
                    </FormRow>
                    <FormRow label="Họ và Tên">
                        <TextInput style={styles.input} value={formData.name} onChangeText={val => handleInputChange('name', val)} placeholder="Nhập họ và tên của bạn" />
                    </FormRow>
                    
                    <View style={styles.row}>
                        <View style={styles.col}>
                            <FormRow label="Thú cưng">
                                <MockPicker 
                                    label="-- Mới --" 
                                    selectedValue={formData.petSelection} 
                                    onPress={() => openPicker(petOptions, (val) => {
                                        handleInputChange('petSelection', val);
                                        if (val === 'Mới') {
                                            handleInputChange('petName', '');
                                            handleInputChange('species', '');
                                            handleInputChange('age', '');
                                        } else {
                                            const selectedPet = pets.find(p => p.name === val);
                                            if (selectedPet) {
                                                handleInputChange('petName', selectedPet.name);
                                                handleInputChange('species', selectedPet.species);
                                                handleInputChange('age', selectedPet.age ? selectedPet.age.toString() : '');
                                            }
                                        }
                                    })}
                                />
                            </FormRow>
                        </View>
                        <View style={styles.col}>
                            <FormRow label="Tên thú">
                                <TextInput style={styles.input} value={formData.petName} onChangeText={val => handleInputChange('petName', val)} placeholder="Tên thú cưng" />
                            </FormRow>
                        </View>
                    </View>

                    <FormRow label="Giống loài">
                         <MockPicker 
                            label="-- Giống loài --" 
                            selectedValue={formData.species} 
                            onPress={() => openPicker(speciesOptions, (val) => handleInputChange('species', val))}
                        />
                    </FormRow>

                    <View style={styles.row}>
                        <View style={styles.col}>
                            <FormRow label="Cân nặng (kg)">
                                <TextInput style={styles.input} value={formData.weight} onChangeText={val => handleInputChange('weight', val)} placeholder="VD: 5.5" keyboardType="numeric" />
                            </FormRow>
                        </View>
                        <View style={styles.col}>
                            <FormRow label="Tuổi">
                                <TextInput style={styles.input} value={formData.age} onChangeText={val => handleInputChange('age', val)} placeholder="VD: 2" keyboardType="numeric" />
                            </FormRow>
                        </View>
                    </View>

                    <FormRow label="Vắc xin đã tiêm">
                        <TextInput style={styles.input} value={formData.vaccines} onChangeText={val => handleInputChange('vaccines', val)} placeholder="Liệt kê các loại vắc xin" />
                    </FormRow>

                    <FormRow label="Thời gian hẹn">
                        <View style={styles.row}>
                            <TouchableOpacity style={[styles.pickerContainer, { flex: 1, marginRight: 5 }]} onPress={() => setShowDatePicker(true)}>
                                <Ionicons name="calendar-outline" size={20} color="#666" style={{ marginRight: 8 }} />
                                <Text style={styles.pickerText}>{formData.date || 'Chọn ngày'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.pickerContainer, { flex: 1, marginLeft: 5 }]} onPress={() => setShowTimePicker(true)}>
                                <Ionicons name="time-outline" size={20} color="#666" style={{ marginRight: 8 }} />
                                <Text style={styles.pickerText}>{formData.time || 'Chọn giờ'}</Text>
                            </TouchableOpacity>
                        </View>
                        {showDatePicker && (
                            <DateTimePicker
                                value={formData.date ? new Date(formData.date.split('/').reverse().join('-')) : new Date()}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={(event, selectedDate) => {
                                    setShowDatePicker(false);
                                    if (selectedDate) {
                                        const dd = String(selectedDate.getDate()).padStart(2, '0');
                                        const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
                                        const yyyy = selectedDate.getFullYear();
                                        handleInputChange('date', `${dd}/${mm}/${yyyy}`);
                                    }
                                }}
                                minimumDate={new Date()}
                            />
                        )}
                        {showTimePicker && (
                            <DateTimePicker
                                value={formData.time ? new Date(`1970-01-01T${formData.time}`) : new Date()}
                                mode="time"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={(event, selectedTime) => {
                                    setShowTimePicker(false);
                                    if (selectedTime) {
                                        const hh = String(selectedTime.getHours()).padStart(2, '0');
                                        const mm = String(selectedTime.getMinutes()).padStart(2, '0');
                                        handleInputChange('time', `${hh}:${mm}`);
                                    }
                                }}
                            />
                        )}
                    </FormRow>

                    <FormRow label="Bác sĩ">
                        <MockPicker 
                            label="-- Không chọn riêng --" 
                            selectedValue={formData.doctor} 
                            onPress={() => openPicker(doctorOptions, (val) => handleInputChange('doctor', val))}
                        />
                    </FormRow>

                    <FormRow label="Dịch vụ">
                        <MockPicker 
                            label="Chọn dịch vụ" 
                            selectedValue={services.find(s => s.serviceId.toString() === formData.serviceId)?.displayText || ''} 
                            onPress={() => openPicker(serviceOptions.map(opt => opt.label), (val) => {
                                const selected = serviceOptions.find(opt => opt.label === val);
                                handleInputChange('serviceId', selected ? selected.value : '');
                            })}
                        />
                    </FormRow>

                    <FormRow label="Ghi chú">
                        <TextInput style={[styles.input, styles.textArea]} value={formData.notes} onChangeText={val => handleInputChange('notes', val)} placeholder="Thêm ghi chú..." multiline />
                    </FormRow>

                    <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
                        <Text style={styles.submitButtonText}>{submitting ? 'Đang gửi...' : 'Đặt lịch'}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
            
            <Modal
                visible={isPickerVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setPickerVisible(false)}
            >
                <TouchableOpacity style={styles.modalContainer} activeOpacity={1} onPressOut={() => setPickerVisible(false)}>
                    <TouchableWithoutFeedback>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Vui lòng chọn</Text>
                            <ScrollView>
                                {pickerData.items.map(item => (
                                    <TouchableOpacity key={item} style={styles.modalItem} onPress={() => handlePickerSelect(item)}>
                                        <Text style={styles.modalItemText}>{item}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setPickerVisible(false)}>
                                <Text style={styles.modalCloseButtonText}>Đóng</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableWithoutFeedback>
                </TouchableOpacity>
            </Modal>
            {error && <Text style={{ color: 'red', textAlign: 'center', marginTop: 10 }}>{error}</Text>}
            {success && <Text style={{ color: 'green', textAlign: 'center', marginTop: 10 }}>{success}</Text>}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f8f9fa' },
    container: { paddingBottom: 30 },
    header: { padding: 20, alignItems: 'center', backgroundColor: 'white' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
    headerSubtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 8 },
    formContainer: { paddingHorizontal: 20, marginTop: 10 },
    formRow: { marginBottom: 15 },
    label: { fontSize: 16, fontWeight: '500', color: '#495057', marginBottom: 8 },
    input: {
        backgroundColor: 'white',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ced4da',
        fontSize: 16,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    col: {
        flex: 1,
    },
    pickerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ced4da',
        flex: 1,
    },
    pickerText: {
        fontSize: 16,
    },
    submitButton: {
        backgroundColor: '#007bff',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    submitButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        width: '80%',
        maxHeight: '60%',
        backgroundColor: 'white',
        borderRadius: 10,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    modalItem: {
        paddingVertical: 14,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    modalItemText: {
        fontSize: 16,
        color: '#333',
    },
    modalCloseButton: {
        marginTop: 10,
        paddingVertical: 12,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    modalCloseButtonText: {
        fontSize: 16,
        color: '#007bff',
        fontWeight: '600'
    }
}); 