import apiClient from '@/api/client';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import { Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button, Card, Dialog, Divider, TextInput as PaperInput, Text as PaperText, Portal, RadioButton } from 'react-native-paper';

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
        vaccines: '', // vắc xin đã tiêm
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
    const [pets, setPets] = useState<Array<{ petId: number, name: string, species: string, age?: number, vaccinatedVaccines?: string }>>([]);
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
                        setPets(response.data.map((pet: any) => ({
                            petId: pet.petId,
                            name: pet.name,
                            species: pet.species,
                            age: pet.age,
                            vaccinatedVaccines: pet.vaccinatedVaccines || ''
                        })));
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

    // Khi chọn pet, nếu là pet cũ thì tự động lấy vắc xin đã tiêm
    const handlePetSelection = (val: string) => {
        handleInputChange('petSelection', val);
        if (val === 'Mới') {
            handleInputChange('petName', '');
            handleInputChange('species', '');
            handleInputChange('age', '');
            handleInputChange('vaccines', '');
        } else {
            const selectedPet = pets.find(p => p.name === val);
            if (selectedPet) {
                handleInputChange('petName', selectedPet.name);
                handleInputChange('species', selectedPet.species);
                handleInputChange('age', selectedPet.age ? selectedPet.age.toString() : '');
                // Lấy vắc xin đã tiêm từ pet
                handleInputChange('vaccines', selectedPet.vaccinatedVaccines || '');
            }
        }
    };

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
                    vaccinatedVaccines: formData.vaccines // gửi lên backend
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
            <ScrollView contentContainerStyle={{ padding: 0 }}>
                <Card style={{ margin: 16, borderRadius: 16, elevation: 3 }}>
                    <Card.Title title="Đặt lịch hẹn" titleStyle={{ fontSize: 24, fontWeight: 'bold', color: '#007bff' }} />
                    <Card.Content>
                        <PaperText style={{ color: '#666', marginBottom: 18, textAlign: 'center' }}>
                            Vui lòng điền thông tin bên dưới để đặt lịch hẹn cho thú cưng của bạn.
                        </PaperText>
                        <Divider style={{ marginBottom: 18 }} />
                        <PaperInput
                            label="Số điện thoại"
                            value={formData.phone}
                            onChangeText={val => handleInputChange('phone', val)}
                            mode="outlined"
                            keyboardType="phone-pad"
                            style={{ marginBottom: 14 }}
                        />
                        <PaperInput
                            label="Họ và Tên"
                            value={formData.name}
                            onChangeText={val => handleInputChange('name', val)}
                            mode="outlined"
                            style={{ marginBottom: 14 }}
                        />
                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 0 }}>
                            <View style={{ flex: 1 }}>
                                <PaperText style={{ marginBottom: 6, fontWeight: '600', color: '#007bff' }}>Thú cưng</PaperText>
                                <Button
                                    mode="outlined"
                                    onPress={() => openPicker(petOptions, handlePetSelection)}
                                    style={{ marginBottom: 0, borderRadius: 10, borderColor: '#007bff', borderWidth: 1 }}
                                    contentStyle={{ justifyContent: 'space-between' }}
                                    icon="paw"
                                    labelStyle={{ color: '#007bff', fontWeight: 'bold' }}
                                    theme={{ colors: { primary: '#007bff' } }}
                                >
                                    {formData.petSelection}
                                </Button>
                            </View>
                            <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                                <PaperInput
                                    label="Tên thú"
                                    value={formData.petName}
                                    onChangeText={val => handleInputChange('petName', val)}
                                    mode="outlined"
                                    style={{ marginBottom: 0 }}
                                    outlineColor="#007bff"
                                    activeOutlineColor="#007bff"
                                    theme={{ colors: { primary: '#007bff' } }}
                                />
                            </View>
                        </View>
                        <PaperText style={{ marginBottom: 6, fontWeight: '600' }}>Giống loài</PaperText>
                        <Button
                            mode="outlined"
                            onPress={() => openPicker(speciesOptions, (val) => handleInputChange('species', val))}
                            style={{ marginBottom: 14, borderRadius: 10, borderColor: '#007bff', borderWidth: 1 }}
                            contentStyle={{ justifyContent: 'space-between' }}
                            icon="dog"
                            labelStyle={{ color: '#007bff', fontWeight: 'bold' }}
                            theme={{ colors: { primary: '#007bff' } }}
                        >
                            {formData.species || '-- Giống loài --'}
                        </Button>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <View style={{ flex: 1 }}>
                                <PaperInput
                                    label="Cân nặng (kg)"
                                    value={formData.weight}
                                    onChangeText={val => handleInputChange('weight', val)}
                                    mode="outlined"
                                    keyboardType="numeric"
                                    style={{ marginBottom: 14 }}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <PaperInput
                                    label="Tuổi"
                                    value={formData.age}
                                    onChangeText={val => handleInputChange('age', val)}
                                    mode="outlined"
                                    keyboardType="numeric"
                                    style={{ marginBottom: 14 }}
                                />
                            </View>
                        </View>
                        <PaperInput
                            label="Vắc xin đã tiêm trước khi đến phòng khám"
                            value={formData.vaccines}
                            onChangeText={val => handleInputChange('vaccines', val)}
                            mode="outlined"
                            placeholder="Liệt kê các loại vắc xin"
                            style={{ marginBottom: 14 }}
                            editable={formData.petSelection === 'Mới'}
                        />
                        <PaperText style={{ marginBottom: 6, fontWeight: '600' }}>Thời gian hẹn</PaperText>
                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                            <Button
                                mode="outlined"
                                onPress={() => setShowDatePicker(true)}
                                style={{ flex: 1, borderRadius: 10, borderColor: '#007bff', borderWidth: 1 }}
                                icon="calendar"
                                labelStyle={{ color: '#007bff', fontWeight: 'bold' }}
                                theme={{ colors: { primary: '#007bff' } }}
                            >
                                {formData.date || 'Chọn ngày'}
                            </Button>
                            <Button
                                mode="outlined"
                                onPress={() => setShowTimePicker(true)}
                                style={{ flex: 1, borderRadius: 10, borderColor: '#007bff', borderWidth: 1 }}
                                icon="clock"
                                labelStyle={{ color: '#007bff', fontWeight: 'bold' }}
                                theme={{ colors: { primary: '#007bff' } }}
                            >
                                {formData.time || 'Chọn giờ'}
                            </Button>
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
                        <PaperText style={{ marginBottom: 6, fontWeight: '600' }}>Bác sĩ</PaperText>
                        <Button
                            mode="outlined"
                            onPress={() => openPicker(doctorOptions, (val) => handleInputChange('doctor', val))}
                            style={{ marginBottom: 14, borderRadius: 10, borderColor: '#007bff', borderWidth: 1 }}
                            icon="account-heart"
                            labelStyle={{ color: '#007bff', fontWeight: 'bold' }}
                            theme={{ colors: { primary: '#007bff' } }}
                        >
                            {formData.doctor || '-- Không chọn riêng --'}
                        </Button>
                        <PaperText style={{ marginBottom: 6, fontWeight: '600' }}>Dịch vụ</PaperText>
                        <Button
                            mode="outlined"
                            onPress={() => openPicker(serviceOptions.map(opt => opt.label), (val) => {
                                const selected = serviceOptions.find(opt => opt.label === val);
                                handleInputChange('serviceId', selected ? selected.value : '');
                            })}
                            style={{ marginBottom: 14, borderRadius: 10, borderColor: '#007bff', borderWidth: 1 }}
                            icon="medical-bag"
                            labelStyle={{ color: '#007bff', fontWeight: 'bold' }}
                            theme={{ colors: { primary: '#007bff' } }}
                        >
                            {services.find(s => s.serviceId.toString() === formData.serviceId)?.displayText || 'Chọn dịch vụ'}
                        </Button>
                        <PaperInput
                            label="Ghi chú"
                            value={formData.notes}
                            onChangeText={val => handleInputChange('notes', val)}
                            mode="outlined"
                            multiline
                            style={{ marginBottom: 18, minHeight: 80, textAlignVertical: 'top' }}
                        />
                        <Button
                            mode="contained"
                            onPress={handleSubmit}
                            loading={submitting}
                            disabled={submitting}
                            style={{ marginTop: 10, borderRadius: 12, paddingVertical: 8, backgroundColor: '#007bff' }}
                            contentStyle={{ height: 48 }}
                            labelStyle={{ color: 'white', fontWeight: 'bold' }}
                            theme={{ colors: { primary: '#007bff' } }}
                        >
                            {submitting ? 'Đang gửi...' : 'Đặt lịch'}
                        </Button>
                        {error && <PaperText style={{ color: '#e74c3c', textAlign: 'center', marginTop: 14, fontWeight: 'bold', fontSize: 16 }}>{error}</PaperText>}
                        {success && <PaperText style={{ color: '#27ae60', textAlign: 'center', marginTop: 14, fontWeight: 'bold', fontSize: 16 }}>{success}</PaperText>}
                    </Card.Content>
                </Card>
                {/* Thay Modal chọn picker bằng Dialog của Paper */}
                <Portal>
                    <Dialog visible={isPickerVisible} onDismiss={() => setPickerVisible(false)} style={{ borderRadius: 20, alignSelf: 'center', width: '80%', maxWidth: 350, borderColor: '#007bff', borderWidth: 1 }}>
                        <Dialog.Title style={{ color: '#007bff', fontWeight: 'bold', textAlign: 'center' }}>Vui lòng chọn</Dialog.Title>
                        <Dialog.Content style={{ paddingHorizontal: 0, maxHeight: 320 }}>
                            <ScrollView>
                                <RadioButton.Group
                                    onValueChange={value => { handlePickerSelect(value); }}
                                    value={pickerData.items.includes(formData.petSelection) ? formData.petSelection : ''}
                                >
                                    {pickerData.items.map(item => (
                                        <RadioButton.Item
                                            key={item}
                                            label={item}
                                            value={item}
                                            color="#007bff"
                                            labelStyle={{ fontSize: 16 }}
                                            style={{ borderRadius: 8, marginBottom: 2, marginHorizontal: 0 }}
                                        />
                                    ))}
                                </RadioButton.Group>
                            </ScrollView>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => setPickerVisible(false)} labelStyle={{ color: '#007bff', fontWeight: 'bold' }} theme={{ colors: { primary: '#007bff' } }}>Đóng</Button>
                        </Dialog.Actions>
                    </Dialog>
                </Portal>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#ffffff' },
    container: { paddingBottom: 30 },
    header: { padding: 24, alignItems: 'center', backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#007bff', letterSpacing: 1, marginBottom: 4 },
    headerSubtitle: { fontSize: 15, color: '#666', textAlign: 'center', marginTop: 8 },
    formContainer: { paddingHorizontal: 20, marginTop: 18, backgroundColor: 'white', borderRadius: 16, shadowColor: '#007bff', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3, paddingVertical: 18 },
    formRow: { marginBottom: 18 },
    label: { fontSize: 16, fontWeight: '600', color: '#007bff', marginBottom: 8 },
    input: {
        backgroundColor: '#007bff',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#007bff',
        fontSize: 16,
        color: '#222',
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
        backgroundColor: '#007bff',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#007bff',
        flex: 1,
    },
    pickerText: {
        fontSize: 16,
        color: '#333',
    },
    submitButton: {
        backgroundColor: '#007bff',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 24,
        shadowColor: '#007bff',
        shadowOpacity: 0.10,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    submitButtonText: {
        color: 'white',
        fontSize: 19,
        fontWeight: 'bold',
        letterSpacing: 0.5,
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
        borderRadius: 14,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 6,
        elevation: 6,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
        color: '#007bff',
    },
    modalItem: {
        paddingVertical: 16,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#007bff',
    },
    modalItemText: {
        fontSize: 17,
        color: '#333',
    },
    modalCloseButton: {
        marginTop: 12,
        paddingVertical: 14,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#007bff',
    },
    modalCloseButtonText: {
        fontSize: 17,
        color: '#007bff',
        fontWeight: '600',
    },
    // Error/Success
    errorText: {
        color: '#e74c3c',
        textAlign: 'center',
        marginTop: 14,
        fontWeight: 'bold',
        fontSize: 16,
    },
    successText: {
        color: '#27ae60',
        textAlign: 'center',
        marginTop: 14,
        fontWeight: 'bold',
        fontSize: 16,
    }
}); 