import apiClient from '@/api/client';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { GestureResponderEvent, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

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
    const [formData, setFormData] = useState({
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
        service: '',
        notes: '',
    });
    
    const [isPickerVisible, setPickerVisible] = useState(false);
    const [pickerData, setPickerData] = useState<{items: string[], onSelect: (value: string) => void}>({ items: [], onSelect: () => {} });
    const [doctors, setDoctors] = useState<Array<{doctorId: number, fullName: string, specialization: string, branch: string, displayText: string}>>([]);
    const [loading, setLoading] = useState(false);
    const [userInfo, setUserInfo] = useState<{customerName: string, phoneNumber: string} | null>(null);
    const [pets, setPets] = useState<Array<{ petId: number, name: string, species: string, age?: number }>>([]);

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
        fetchDoctors();
        fetchPets();
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
                            name: response.data.customerName || '',
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
    const serviceOptions = ['Khám tổng quát nội khoa', 'Tiêm phòng', 'Siêu âm', 'Phẫu thuật'];

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
                            {/* In a real app, use @react-native-community/datetimepicker */}
                            <MockPicker icon="calendar-outline" label="Chọn ngày" selectedValue={formData.date} onPress={() => alert('Date picker would open here!')} />
                            <MockPicker icon="time-outline" label="Chọn giờ" selectedValue={formData.time} onPress={() => alert('Time picker would open here!')} />
                        </View>
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
                            selectedValue={formData.service} 
                            onPress={() => openPicker(serviceOptions, (val) => handleInputChange('service', val))}
                        />
                    </FormRow>

                    <FormRow label="Ghi chú">
                        <TextInput style={[styles.input, styles.textArea]} value={formData.notes} onChangeText={val => handleInputChange('notes', val)} placeholder="Thêm ghi chú..." multiline />
                    </FormRow>

                    <TouchableOpacity style={styles.submitButton} onPress={(event: GestureResponderEvent) => alert('Đã gửi thông tin đặt lịch!')}>
                        <Text style={styles.submitButtonText}>Đặt lịch</Text>
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