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
    // Lấy ngày hiện tại
    const getCurrentDate = () => {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    };
    
    // Lấy giờ hiện tại (làm tròn lên giờ tiếp theo)
    const getCurrentTime = () => {
        const now = new Date();
        const nextHour = new Date(now.getTime() + 60 * 60 * 1000); // +1 giờ
        const hh = String(nextHour.getHours()).padStart(2, '0');
        return `${hh}:00`;
    };
    
    const initialFormData = {
        phone: '',
        name: '',
        petSelection: 'Mới',
        petName: '',
        species: '',
        weight: '',
        age: '',
        vaccines: '', // vắc xin đã tiêm
        date: getCurrentDate(),
        time: getCurrentTime(),
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
            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                <Card style={{ margin: 16, borderRadius: 20, elevation: 4, backgroundColor: '#fff' }}>
                    <Card.Title 
                        title="🐾 Đặt lịch hẹn" 
                        titleStyle={{ fontSize: 26, fontWeight: 'bold', color: '#007bff', textAlign: 'center' }} 
                    />
                    <Card.Content>
                        <PaperText style={{ color: '#666', marginBottom: 20, textAlign: 'center', fontSize: 15, lineHeight: 22 }}>
                            Vui lòng điền thông tin bên dưới để đặt lịch hẹn cho thú cưng của bạn.
                        </PaperText>
                        <Divider style={{ marginBottom: 20, backgroundColor: '#007bff', height: 1 }} />
                        <PaperText style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12, marginTop: 4 }}>
                            📋 Thông tin khách hàng
                        </PaperText>
                        <PaperInput
                            label="Số điện thoại *"
                            value={formData.phone}
                            onChangeText={val => handleInputChange('phone', val)}
                            mode="outlined"
                            keyboardType="phone-pad"
                            left={<PaperInput.Icon icon="phone" color="#007bff" />}
                            style={{ marginBottom: 14, backgroundColor: '#f8f9fa' }}
                            outlineColor="#007bff"
                            activeOutlineColor="#007bff"
                            theme={{ colors: { primary: '#007bff' } }}
                        />
                        <PaperInput
                            label="Họ và Tên *"
                            value={formData.name}
                            onChangeText={val => handleInputChange('name', val)}
                            mode="outlined"
                            left={<PaperInput.Icon icon="account" color="#007bff" />}
                            style={{ marginBottom: 16, backgroundColor: '#f8f9fa' }}
                            outlineColor="#007bff"
                            activeOutlineColor="#007bff"
                            theme={{ colors: { primary: '#007bff' } }}
                        />
                        
                        <Divider style={{ marginVertical: 16, backgroundColor: '#e0e0e0' }} />
                        
                        <PaperText style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 }}>
                            🐕 Thông tin thú cưng
                        </PaperText>
                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                            <View style={{ flex: 1 }}>
                                <PaperText style={{ marginBottom: 8, fontWeight: '600', color: '#555', fontSize: 13 }}>Chọn thú cưng *</PaperText>
                                <Button
                                    mode="outlined"
                                    onPress={() => openPicker(petOptions, handlePetSelection)}
                                    style={{ borderRadius: 12, borderColor: '#007bff', borderWidth: 1.5, backgroundColor: '#f8f9fa', height: 56 }}
                                    contentStyle={{ justifyContent: 'space-between', height: '100%' }}
                                    icon="paw"
                                    labelStyle={{ color: '#007bff', fontWeight: 'bold', fontSize: 13 }}
                                    theme={{ colors: { primary: '#007bff' } }}
                                >
                                    {formData.petSelection}
                                </Button>
                            </View>
                            <View style={{ flex: 1 }}>
                                <PaperText style={{ marginBottom: 8, fontWeight: '600', color: '#555', fontSize: 13 }}>Tên thú cưng *</PaperText>
                                <PaperInput
                                    label=""
                                    placeholder="Nhập tên thú cưng"
                                    value={formData.petName}
                                    onChangeText={val => handleInputChange('petName', val)}
                                    mode="outlined"
                                    style={{ backgroundColor: '#f8f9fa', borderRadius: 12, height: 56 }}
                                    outlineStyle={{ borderRadius: 12 }}
                                    outlineColor="#007bff"
                                    activeOutlineColor="#007bff"
                                    theme={{ colors: { primary: '#007bff', roundness: 12 } }}
                                />
                            </View>
                        </View>
                        <PaperText style={{ marginBottom: 8, fontWeight: '600', color: '#555', fontSize: 13 }}>Giống loài *</PaperText>
                        <Button
                            mode="outlined"
                            onPress={() => openPicker(speciesOptions, (val) => handleInputChange('species', val))}
                            style={{ marginBottom: 14, borderRadius: 12, borderColor: '#007bff', borderWidth: 1.5, backgroundColor: '#f8f9fa' }}
                            contentStyle={{ justifyContent: 'space-between', paddingVertical: 6 }}
                            icon="dog"
                            labelStyle={{ color: '#007bff', fontWeight: 'bold' }}
                            theme={{ colors: { primary: '#007bff' } }}
                        >
                            {formData.species || 'Chọn giống loài'}
                        </Button>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <View style={{ flex: 1 }}>
                                <PaperInput
                                    label="Cân nặng (kg)"
                                    value={formData.weight}
                                    onChangeText={val => handleInputChange('weight', val)}
                                    mode="outlined"
                                    keyboardType="numeric"
                                    left={<PaperInput.Icon icon="weight" color="#007bff" />}
                                    style={{ marginBottom: 14, backgroundColor: '#f8f9fa' }}
                                    outlineColor="#007bff"
                                    activeOutlineColor="#007bff"
                                    theme={{ colors: { primary: '#007bff' } }}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <PaperInput
                                    label="Tuổi"
                                    value={formData.age}
                                    onChangeText={val => handleInputChange('age', val)}
                                    mode="outlined"
                                    keyboardType="numeric"
                                    left={<PaperInput.Icon icon="calendar-clock" color="#007bff" />}
                                    style={{ marginBottom: 14, backgroundColor: '#f8f9fa' }}
                                    outlineColor="#007bff"
                                    activeOutlineColor="#007bff"
                                    theme={{ colors: { primary: '#007bff' } }}
                                />
                            </View>
                        </View>
                        <PaperInput
                            label="Vắc xin đã tiêm"
                            value={formData.vaccines}
                            onChangeText={val => handleInputChange('vaccines', val)}
                            mode="outlined"
                            placeholder="Liệt kê các loại vắc xin đã tiêm"
                            left={<PaperInput.Icon icon="needle" color="#007bff" />}
                            style={{ marginBottom: 16, backgroundColor: '#f8f9fa' }}
                            outlineColor="#007bff"
                            activeOutlineColor="#007bff"
                            theme={{ colors: { primary: '#007bff' } }}
                            editable={formData.petSelection === 'Mới'}
                        />
                        
                        <Divider style={{ marginVertical: 16, backgroundColor: '#e0e0e0' }} />
                        <PaperText style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 }}>
                            📅 Thời gian hẹn
                        </PaperText>
                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                            <Button
                                mode="outlined"
                                onPress={() => setShowDatePicker(true)}
                                style={{ flex: 1, borderRadius: 12, borderColor: '#007bff', borderWidth: 1.5, backgroundColor: '#f8f9fa' }}
                                contentStyle={{ paddingVertical: 6 }}
                                icon="calendar"
                                labelStyle={{ color: '#007bff', fontWeight: 'bold', fontSize: 13 }}
                                theme={{ colors: { primary: '#007bff' } }}
                            >
                                {formData.date || 'Chọn ngày'}
                            </Button>
                            <Button
                                mode="outlined"
                                onPress={() => setShowTimePicker(true)}
                                style={{ flex: 1, borderRadius: 12, borderColor: '#007bff', borderWidth: 1.5, backgroundColor: '#f8f9fa' }}
                                contentStyle={{ paddingVertical: 6 }}
                                icon="clock-outline"
                                labelStyle={{ color: '#007bff', fontWeight: 'bold', fontSize: 13 }}
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
                                    if (selectedDate && event.type === 'set') {
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
                                value={(() => {
                                    if (formData.time) {
                                        const [hours, minutes] = formData.time.split(':');
                                        const date = new Date();
                                        date.setHours(parseInt(hours, 10));
                                        date.setMinutes(parseInt(minutes, 10));
                                        date.setSeconds(0);
                                        return date;
                                    }
                                    return new Date();
                                })()}
                                mode="time"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                is24Hour={true}
                                onChange={(event, selectedTime) => {
                                    if (Platform.OS === 'android') {
                                        setShowTimePicker(false);
                                    }
                                    if (selectedTime && event.type === 'set') {
                                        const hh = String(selectedTime.getHours()).padStart(2, '0');
                                        const mm = String(selectedTime.getMinutes()).padStart(2, '0');
                                        handleInputChange('time', `${hh}:${mm}`);
                                        if (Platform.OS === 'ios') {
                                            setShowTimePicker(false);
                                        }
                                    } else if (event.type === 'dismissed') {
                                        setShowTimePicker(false);
                                    }
                                }}
                            />
                        )}
                        <Divider style={{ marginVertical: 16, backgroundColor: '#e0e0e0' }} />
                        
                        <PaperText style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 }}>
                            👨‍⚕️ Dịch vụ & Bác sĩ
                        </PaperText>
                        <PaperText style={{ marginBottom: 8, fontWeight: '600', color: '#555', fontSize: 13 }}>Dịch vụ *</PaperText>
                        <Button
                            mode="outlined"
                            onPress={() => openPicker(serviceOptions.map(opt => opt.label), (val) => {
                                const selected = serviceOptions.find(opt => opt.label === val);
                                handleInputChange('serviceId', selected ? selected.value : '');
                            })}
                            style={{ marginBottom: 14, borderRadius: 12, borderColor: '#007bff', borderWidth: 1.5, backgroundColor: '#f8f9fa' }}
                            contentStyle={{ paddingVertical: 6 }}
                            icon="medical-bag"
                            labelStyle={{ color: '#007bff', fontWeight: 'bold' }}
                            theme={{ colors: { primary: '#007bff' } }}
                        >
                            {services.find(s => s.serviceId.toString() === formData.serviceId)?.displayText || 'Chọn dịch vụ'}
                        </Button>
                        <PaperText style={{ marginBottom: 8, fontWeight: '600', color: '#555', fontSize: 13 }}>Bác sĩ (tùy chọn)</PaperText>
                        <Button
                            mode="outlined"
                            onPress={() => openPicker(doctorOptions, (val) => handleInputChange('doctor', val))}
                            style={{ marginBottom: 14, borderRadius: 12, borderColor: '#007bff', borderWidth: 1.5, backgroundColor: '#f8f9fa' }}
                            contentStyle={{ paddingVertical: 6 }}
                            icon="doctor"
                            labelStyle={{ color: '#007bff', fontWeight: 'bold' }}
                            theme={{ colors: { primary: '#007bff' } }}
                        >
                            {formData.doctor || 'Không chọn riêng'}
                        </Button>
                        <PaperInput
                            label="Ghi chú thêm"
                            value={formData.notes}
                            onChangeText={val => handleInputChange('notes', val)}
                            mode="outlined"
                            multiline
                            numberOfLines={4}
                            placeholder="Nhập ghi chú về tình trạng sức khỏe, yêu cầu đặc biệt..."
                            left={<PaperInput.Icon icon="note-text" color="#007bff" />}
                            style={{ marginBottom: 20, minHeight: 100, backgroundColor: '#f8f9fa' }}
                            outlineColor="#007bff"
                            activeOutlineColor="#007bff"
                            theme={{ colors: { primary: '#007bff' } }}
                        />
                        <Button
                            mode="contained"
                            onPress={handleSubmit}
                            loading={submitting}
                            disabled={submitting}
                            style={{ 
                                marginTop: 4, 
                                borderRadius: 14, 
                                paddingVertical: 6, 
                                backgroundColor: submitting ? '#ccc' : '#007bff',
                                elevation: submitting ? 0 : 4,
                                shadowColor: '#007bff',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                            }}
                            contentStyle={{ height: 52 }}
                            labelStyle={{ color: 'white', fontWeight: 'bold', fontSize: 17, letterSpacing: 0.5 }}
                            icon={submitting ? "loading" : "check-circle"}
                            theme={{ colors: { primary: '#007bff' } }}
                        >
                            {submitting ? 'Đang gửi...' : '✓ Đặt lịch ngay'}
                        </Button>
                        {error && (
                            <View style={{ backgroundColor: '#ffe6e6', padding: 12, borderRadius: 10, marginTop: 14, borderLeftWidth: 4, borderLeftColor: '#e74c3c' }}>
                                <PaperText style={{ color: '#c0392b', textAlign: 'center', fontWeight: '600', fontSize: 14 }}>
                                    ❌ {error}
                                </PaperText>
                            </View>
                        )}
                        {success && (
                            <View style={{ backgroundColor: '#e6f7ed', padding: 12, borderRadius: 10, marginTop: 14, borderLeftWidth: 4, borderLeftColor: '#27ae60' }}>
                                <PaperText style={{ color: '#1e8449', textAlign: 'center', fontWeight: '600', fontSize: 14 }}>
                                    ✓ {success}
                                </PaperText>
                            </View>
                        )}
                    </Card.Content>
                </Card>
                {/* Dialog chọn picker */}
                <Portal>
                    <Dialog 
                        visible={isPickerVisible} 
                        onDismiss={() => setPickerVisible(false)} 
                        style={{ 
                            borderRadius: 24, 
                            alignSelf: 'center', 
                            width: '85%', 
                            maxWidth: 400, 
                            backgroundColor: '#fff',
                            elevation: 8
                        }}
                    >
                        <Dialog.Title style={{ 
                            color: '#007bff', 
                            fontWeight: 'bold', 
                            textAlign: 'center',
                            fontSize: 20,
                            paddingBottom: 8
                        }}>
                            📋 Vui lòng chọn
                        </Dialog.Title>
                        <Divider style={{ backgroundColor: '#007bff', height: 2 }} />
                        <Dialog.Content style={{ paddingHorizontal: 8, maxHeight: 400, paddingTop: 12 }}>
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <RadioButton.Group
                                    onValueChange={value => { handlePickerSelect(value); }}
                                    value={pickerData.items.includes(formData.petSelection) ? formData.petSelection : ''}
                                >
                                    {pickerData.items.map((item, index) => (
                                        <RadioButton.Item
                                            key={item}
                                            label={item}
                                            value={item}
                                            color="#007bff"
                                            labelStyle={{ fontSize: 15, fontWeight: '500' }}
                                            style={{ 
                                                borderRadius: 10, 
                                                marginBottom: 4, 
                                                backgroundColor: index % 2 === 0 ? '#f8f9fa' : '#fff',
                                                paddingVertical: 4
                                            }}
                                        />
                                    ))}
                                </RadioButton.Group>
                            </ScrollView>
                        </Dialog.Content>
                        <Dialog.Actions style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
                            <Button 
                                onPress={() => setPickerVisible(false)} 
                                labelStyle={{ color: '#007bff', fontWeight: 'bold', fontSize: 15 }} 
                                style={{ borderRadius: 10, paddingHorizontal: 12 }}
                                mode="outlined"
                                theme={{ colors: { primary: '#007bff' } }}
                            >
                                Đóng
                            </Button>
                        </Dialog.Actions>
                    </Dialog>
                </Portal>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f5f7fa' },
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