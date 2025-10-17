import apiClient, { API_BASE_URL } from '@/api/client';
import { pickImage, takePhoto, uploadImageToCloudinary } from '@/services/cloudinaryService';
import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Modal, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View, StatusBar, ScrollView } from 'react-native';
import GradientBackground from '../components/GradientBackground';
import { LinearGradient } from 'expo-linear-gradient';

// Interface phù hợp với PetResponseDto từ API
interface Pet {
    petId: number;
    customerId: number;
    name: string;
    species: string;
    breed?: string;
    birthDate?: string;
    imageUrl?: string;
    age?: number;
    customerName: string;
    gender?: string;
    vaccinatedVaccines?: string; // Thêm trường này
}

// Interface cho tạo thú cưng mới
interface CreatePetData {
    name: string;
    species: string;
    breed?: string;
    birthDate?: string;
    imageUrl?: string;
    gender?: string;
    vaccinatedVaccines?: string; // Thêm trường này
}

// Interface cho dịch vụ đã sử dụng
interface UsedService {
    appointmentId: number;
    serviceName: string;
    appointmentDate: string;
    appointmentTime: string;
    doctorName?: string;
    status: string;
    notes?: string;
}

export default function MyPetsScreen() {
    const [pets, setPets] = useState<Pet[]>([]);
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [newPet, setNewPet] = useState<CreatePetData>({ 
        name: '', 
        species: '', 
        breed: '', 
        birthDate: '', 
        imageUrl: '',
        gender: '',
    });
    const [loading, setLoading] = useState(false);
    const [addingPet, setAddingPet] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [editPet, setEditPet] = useState<CreatePetData>({ name: '', species: '', breed: '', birthDate: '', imageUrl: '', gender: '' });
    const [editingImageUri, setEditingImageUri] = useState<string | null>(null);
    const [editingUploading, setEditingUploading] = useState(false);
    const [usedServicesModalVisible, setUsedServicesModalVisible] = useState(false);
    const [usedServices, setUsedServices] = useState<UsedService[]>([]);
    const [loadingServices, setLoadingServices] = useState(false);
    const navigation = useNavigation();

    // Lấy danh sách thú cưng từ API
    useEffect(() => {
        fetchPets();
    }, []);

    const fetchPets = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/Pet');
            if (response.data) {
                setPets(response.data);
            }
        } catch (error) {
            console.error('Error fetching pets:', error);
            Alert.alert('Lỗi', 'Không thể tải danh sách thú cưng');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsedServices = async (petId: number) => {
        setLoadingServices(true);
        try {
            const endpoint = `/Appointment/pet/${petId}?onlyCompleted=true`;
            console.log('=== FETCHING USED SERVICES ===');
            console.log('Pet ID:', petId);
            console.log('Full endpoint:', endpoint);
            console.log('Base URL:', API_BASE_URL);
            console.log('Full URL:', `${API_BASE_URL}${endpoint}`);
            
            const response = await apiClient.get(endpoint);
            console.log('API Response:', response.data);
            
            // API trả về mảng lịch hẹn theo thú cưng
            if (response.data && Array.isArray(response.data)) {
                const mapped = response.data.map((appointment: any) => ({
                    appointmentId: appointment.appointmentId,
                    serviceName: appointment.serviceName || appointment.service?.name || 'Dịch vụ không xác định',
                    appointmentDate: appointment.appointmentDate,
                    appointmentTime: appointment.appointmentTime,
                    doctorName: appointment.doctorName || appointment.doctor?.fullName || 'Không xác định',
                    status: appointment.status,
                    notes: appointment.notes || ''
                }));
                console.log('Completed services (from API):', mapped);
                setUsedServices(mapped);
            } else {
                console.log('No data or invalid data format');
                setUsedServices([]);
            }
        } catch (error: any) {
            console.error('=== ERROR FETCHING USED SERVICES ===');
            console.error('Error:', error);
            console.error('Error message:', error.message);
            console.error('Status code:', error.response?.status);
            console.error('Response data:', error.response?.data);
            console.error('Request URL:', error.config?.url);
            console.error('Request method:', error.config?.method);
            console.error('Request headers:', error.config?.headers);
            
            // Hiển thị thông báo lỗi chi tiết cho user
            let errorMessage = 'Không thể tải danh sách dịch vụ đã sử dụng.';
            
            if (error.response?.status === 404) {
                errorMessage = 'Endpoint không tồn tại. Vui lòng kiểm tra backend đã chạy với code mới chưa.';
            } else if (error.response?.status === 401) {
                errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }
            
            Alert.alert(
                'Lỗi', 
                errorMessage,
                [{ text: 'OK' }]
            );
            setUsedServices([]);
        } finally {
            setLoadingServices(false);
        }
    };

    const renderPetItem = ({ item }: { item: Pet }) => (
        <TouchableOpacity style={styles.petCard} onPress={() => { setSelectedPet(item); setDetailModalVisible(true); }}>
            <View style={styles.petImageContainer}>
                <Image 
                    source={{ 
                        uri: item.imageUrl || 'https://via.placeholder.com/150/cccccc/666666?text=Pet' 
                    }} 
                    style={styles.petImage} 
                />
                <View style={styles.petImageOverlay} />
            </View>
            <View style={styles.petInfo}>
                <Text style={styles.petName}>{item.name}</Text>
                <Text style={styles.petSpecies}>{item.species}</Text>
                {item.age && <Text style={styles.petAge}>{item.age} tuổi</Text>}
            </View>
        </TouchableOpacity>
    );

    const handleSelectImage = async () => {
        Alert.alert(
            'Chọn ảnh',
            'Bạn muốn chọn ảnh từ đâu?',
            [
                {
                    text: 'Thư viện',
                    onPress: async () => {
                        const imageUri = await pickImage();
                        if (imageUri) {
                            setSelectedImageUri(imageUri);
                        }
                    },
                },
                {
                    text: 'Camera',
                    onPress: async () => {
                        const imageUri = await takePhoto();
                        if (imageUri) {
                            setSelectedImageUri(imageUri);
                        }
                    },
                },
                {
                    text: 'Hủy',
                    style: 'cancel',
                },
            ]
        );
    };

    const handleUploadImage = async (): Promise<string | null> => {
        if (!selectedImageUri) {
            return null;
        }

        setUploadingImage(true);
        try {
            const imageUrl = await uploadImageToCloudinary(selectedImageUri);
            return imageUrl;
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể upload ảnh lên Cloudinary');
            return null;
        } finally {
            setUploadingImage(false);
        }
    };

    const handleAddPet = async () => {
        if (!newPet.name.trim() || !newPet.species.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập tên và loài thú cưng');
            return;
        }

        setAddingPet(true);
        try {
            // Upload ảnh lên Cloudinary nếu có
            let imageUrl = newPet.imageUrl;
            if (selectedImageUri) {
                const uploadedUrl = await handleUploadImage();
                if (uploadedUrl) {
                    imageUrl = uploadedUrl;
                }
            }

            const petData = {
                name: newPet.name.trim(),
                species: newPet.species.trim(),
                breed: newPet.breed?.trim() || null,
                birthDateString: newPet.birthDate || null,
                imageUrl: imageUrl || null,
                gender: newPet.gender || null,
                vaccinatedVaccines: newPet.vaccinatedVaccines || null
            };

            await apiClient.post('/Pet', petData);
            
            // Làm mới danh sách thú cưng
            await fetchPets();
            
            setNewPet({ name: '', species: '', breed: '', birthDate: '', imageUrl: '', gender: '' });
            setSelectedImageUri(null);
            setAddModalVisible(false);
            Alert.alert('Thành công', 'Đã thêm thú cưng mới!');
        } catch (error) {
            let errorMessage = 'Đã xảy ra lỗi khi thêm thú cưng';
            if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data) {
                errorMessage = (error.response.data as { message?: string }).message || errorMessage;
            }
            Alert.alert('Lỗi', errorMessage);
        } finally {
            setAddingPet(false);
        }
    };

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
                <Ionicons name="paw-outline" size={80} color="#cbd5e1" />
            </View>
            <Text style={styles.emptyTitle}>Chưa có thú cưng nào</Text>
            <Text style={styles.emptySubtitle}>Hãy thêm thú cưng đầu tiên của bạn</Text>
        </View>
    );

    const renderUsedServiceItem = ({ item }: { item: UsedService }) => (
        <View style={styles.serviceCard}>
            <View style={styles.serviceHeader}>
                <Text style={styles.serviceName}>{item.serviceName}</Text>
                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>✅ Hoàn thành</Text>
                </View>
            </View>
            <View style={styles.serviceDetails}>
                <View style={styles.serviceDetailRow}>
                    <Ionicons name="calendar-outline" size={16} color="#64748b" />
                    <Text style={styles.serviceDetailText}>
                        {new Date(item.appointmentDate).toLocaleDateString('vi-VN')}
                    </Text>
                </View>
                <View style={styles.serviceDetailRow}>
                    <Ionicons name="time-outline" size={16} color="#64748b" />
                    <Text style={styles.serviceDetailText}>{item.appointmentTime}</Text>
                </View>
                {item.doctorName && (
                    <View style={styles.serviceDetailRow}>
                        <Ionicons name="person-outline" size={16} color="#64748b" />
                        <Text style={styles.serviceDetailText}>{item.doctorName}</Text>
                    </View>
                )}
            </View>
            {item.notes && (
                <Text style={styles.serviceNotes}>📝 {item.notes}</Text>
            )}
        </View>
    );

    return (
        <GradientBackground>
            <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#007bff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>🐾 Thú cưng của tôi</Text>
                <View style={styles.headerSpacer} />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007bff" />
                    <Text style={styles.loadingText}>Đang tải...</Text>
                </View>
            ) : pets.length === 0 ? (
                renderEmptyState()
            ) : (
                <FlatList
                    data={pets}
                    renderItem={renderPetItem}
                    keyExtractor={(item) => item.petId.toString()}
                    numColumns={2}
                    contentContainerStyle={styles.petsGrid}
                    showsVerticalScrollIndicator={false}
                />
            )}

            <View style={styles.bottomContainer}>
                <TouchableOpacity style={styles.addButton} onPress={() => setAddModalVisible(true)}>
                    <LinearGradient
                        colors={['#007bff', '#0056b3']}
                        style={styles.addButtonGradient}
                    >
                        <Ionicons name="add" size={24} color="white" />
                        <Text style={styles.addButtonText}>Thêm thú cưng</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Add Pet Modal */}
            <Modal
                visible={addModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setAddModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Thêm thú cưng mới</Text>
                        
                        <TextInput
                            style={styles.input}
                            value={newPet.name}
                            onChangeText={(text) => setNewPet({ ...newPet, name: text })}
                            placeholder="Tên thú cưng (*)"
                        />
                        
                        <TextInput
                            style={styles.input}
                            value={newPet.species}
                            onChangeText={(text) => setNewPet({ ...newPet, species: text })}
                            placeholder="Loài (VD: Chó, Mèo) (*)"
                        />

                        <TextInput
                            style={styles.input}
                            value={newPet.breed}
                            onChangeText={(text) => setNewPet({ ...newPet, breed: text })}
                            placeholder="Giống (tùy chọn)"
                        />

                        {/* Ngày sinh */}
                        <TouchableOpacity
                            style={[styles.input, { justifyContent: 'center' }]}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Text style={{ color: newPet.birthDate ? '#222' : '#888', fontSize: 16 }}>
                                {newPet.birthDate ? newPet.birthDate : 'Ngày sinh (YYYY-MM-DD, tùy chọn)'}
                            </Text>
                        </TouchableOpacity>
                        {showDatePicker && (
                            <DateTimePicker
                                value={newPet.birthDate ? new Date(newPet.birthDate) : new Date()}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={(event, selectedDate) => {
                                    setShowDatePicker(false);
                                    if (selectedDate) {
                                        const yyyy = selectedDate.getFullYear();
                                        const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
                                        const dd = String(selectedDate.getDate()).padStart(2, '0');
                                        setNewPet({ ...newPet, birthDate: `${yyyy}-${mm}-${dd}` });
                                    }
                                }}
                                maximumDate={new Date()}
                            />
                        )}

                        {/* Giới tính */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                            <Text style={{ marginRight: 10, fontSize: 16 }}>Giới tính:</Text>
                            <TouchableOpacity
                                style={{ flexDirection: 'row', alignItems: 'center', marginRight: 20 }}
                                onPress={() => setNewPet({ ...newPet, gender: 'Đực' })}
                            >
                                <Ionicons name={newPet.gender === 'Đực' ? 'radio-button-on' : 'radio-button-off'} size={20} color="#007bff" />
                                <Text style={{ marginLeft: 5 }}>Đực</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{ flexDirection: 'row', alignItems: 'center' }}
                                onPress={() => setNewPet({ ...newPet, gender: 'Cái' })}
                            >
                                <Ionicons name={newPet.gender === 'Cái' ? 'radio-button-on' : 'radio-button-off'} size={20} color="#007bff" />
                                <Text style={{ marginLeft: 5 }}>Cái</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Thêm input cho vắc xin đã tiêm khi tạo mới pet */}
                        <TextInput
                            style={styles.input}
                            value={newPet.vaccinatedVaccines || ''}
                            onChangeText={text => setNewPet({ ...newPet, vaccinatedVaccines: text })}
                            placeholder="Vắc xin đã tiêm (tùy chọn)"
                        />

                        <View style={styles.imageSection}>
                            <Text style={styles.imageSectionTitle}>Hoặc chọn ảnh từ thiết bị:</Text>
                            <TouchableOpacity 
                                style={styles.selectImageButton} 
                                onPress={handleSelectImage}
                                disabled={uploadingImage}
                            >
                                <Ionicons name="camera-outline" size={20} color="#007bff" />
                                <Text style={styles.selectImageButtonText}>
                                    {uploadingImage ? 'Đang upload...' : 'Chọn ảnh'}
                                </Text>
                            </TouchableOpacity>
                            
                            {selectedImageUri && (
                                <View style={styles.selectedImageContainer}>
                                    <Image source={{ uri: selectedImageUri }} style={styles.selectedImage} />
                                    <TouchableOpacity 
                                        style={styles.removeImageButton}
                                        onPress={() => setSelectedImageUri(null)}
                                    >
                                        <Ionicons name="close-circle" size={24} color="#ff4444" />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity 
                                style={styles.cancelButton} 
                                onPress={() => {
                                    setAddModalVisible(false);
                                    setNewPet({ name: '', species: '', breed: '', birthDate: '', imageUrl: '', gender: '' });
                                    setSelectedImageUri(null);
                                }}
                                disabled={addingPet}
                            >
                                <Text style={styles.cancelButtonText}>Hủy</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={styles.saveButton} 
                                onPress={handleAddPet}
                                disabled={addingPet}
                            >
                                {addingPet ? (
                                    <ActivityIndicator color="white" size="small" />
                                ) : (
                                    <Text style={styles.saveButtonText}>Thêm</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Pet Detail Modal */}
            <Modal
                visible={detailModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setDetailModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <TouchableOpacity style={{ position: 'absolute', top: 10, right: 10, zIndex: 2 }} onPress={() => { setDetailModalVisible(false); setEditMode(false); }}>
                            <Ionicons name="close-circle" size={28} color="#ff4444" />
                        </TouchableOpacity>
                        {selectedPet && !editMode && (
                            <>
                                <TouchableOpacity
                                    style={styles.servicesButton}
                                    onPress={() => {
                                        setDetailModalVisible(false);
                                        fetchUsedServices(selectedPet.petId);
                                        setUsedServicesModalVisible(true);
                                    }}
                                >
                                    <LinearGradient
                                        colors={['#22c55e', '#16a34a']}
                                        style={styles.servicesButtonGradient}
                                    >
                                        <Ionicons name="medical-outline" size={20} color="white" />
                                        <Text style={styles.servicesButtonText}>🏥 Xem dịch vụ đã sử dụng</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                                <Image source={{ uri: selectedPet.imageUrl || 'https://via.placeholder.com/150/cccccc/666666?text=Pet' }} style={[styles.selectedImage, { alignSelf: 'center', marginBottom: 15 }]} />
                                <Text style={{ fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 }}>{selectedPet.name}</Text>
                                <Text style={{ fontSize: 16, textAlign: 'center', marginBottom: 5 }}>Loài: {selectedPet.species}</Text>
                                {selectedPet.breed && <Text style={{ fontSize: 16, textAlign: 'center', marginBottom: 5 }}>Giống: {selectedPet.breed}</Text>}
                                {selectedPet.gender && <Text style={{ fontSize: 16, textAlign: 'center', marginBottom: 5 }}>Giới tính: {selectedPet.gender}</Text>}
                                {selectedPet.birthDate && <Text style={{ fontSize: 16, textAlign: 'center', marginBottom: 5 }}>Ngày sinh: {selectedPet.birthDate}</Text>}
                                {selectedPet.age && <Text style={{ fontSize: 16, textAlign: 'center', marginBottom: 5 }}>Tuổi: {selectedPet.age}</Text>}
                                {selectedPet.vaccinatedVaccines && (
                                    <Text style={{ fontSize: 16, textAlign: 'center', marginBottom: 5 }}>
                                        Vắc xin đã tiêm trước khi đến phòng khám: {selectedPet.vaccinatedVaccines}
                                    </Text>
                                )}
                                <Text style={{ fontSize: 15, textAlign: 'center', color: '#888', marginTop: 10 }}>Chủ nuôi: {selectedPet.customerName}</Text>
                                <View style={styles.actionButtonsContainer}>
                                    <TouchableOpacity 
                                        style={styles.editButton} 
                                        onPress={() => { 
                                            setEditMode(true); 
                                            setEditPet({ 
                                                name: selectedPet.name, 
                                                species: selectedPet.species, 
                                                breed: selectedPet.breed, 
                                                birthDate: selectedPet.birthDate, 
                                                imageUrl: selectedPet.imageUrl, 
                                                gender: selectedPet.gender 
                                            }); 
                                            setEditingImageUri(null); 
                                        }}
                                    >
                                        <LinearGradient
                                            colors={['#3b82f6', '#1d4ed8']}
                                            style={styles.editButtonGradient}
                                        >
                                            <Text style={styles.editButtonText}>✏️ Chỉnh sửa</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.deleteButton} onPress={async () => {
                                        Alert.alert(
                                            'Xác nhận',
                                            `Bạn có chắc chắn muốn xóa thú cưng "${selectedPet.name}"?`,
                                            [
                                                { text: 'Hủy', style: 'cancel' },
                                                { text: 'Xóa', style: 'destructive', onPress: async () => {
                                                    try {
                                                        await apiClient.delete(`/Pet/${selectedPet.petId}`);
                                                        await fetchPets();
                                                        setDetailModalVisible(false);
                                                        setEditMode(false);
                                                        Alert.alert('Thành công', 'Đã xóa thú cưng!');
                                                    } catch (error) {
                                                        let errorMessage = 'Đã xảy ra lỗi khi xóa.';
                                                        if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data) {
                                                            errorMessage = (error.response.data as { message?: string }).message || errorMessage;
                                                        }
                                                        Alert.alert('Lỗi', errorMessage);
                                                    }
                                                }},
                                            ]
                                        );
                                    }}>
                                        <Ionicons name="trash-outline" size={20} color="white" />
                                        <Text style={styles.deleteButtonText}>Xóa</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                        {selectedPet && editMode && (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <Text style={styles.editModalTitle}>✏️ Chỉnh sửa thông tin thú cưng</Text>
                                
                                {/* Ảnh */}
                                <View style={styles.editImageSection}>
                                    <Text style={styles.editImageSectionTitle}>📸 Ảnh thú cưng</Text>
                                    <View style={styles.editImageContainer}>
                                        <Image 
                                            source={{ 
                                                uri: editingImageUri || editPet.imageUrl || 'https://via.placeholder.com/150/cccccc/666666?text=Pet' 
                                            }} 
                                            style={styles.editCurrentImage} 
                                        />
                                        <TouchableOpacity 
                                            style={styles.editSelectImageButton} 
                                            onPress={async () => {
                                                Alert.alert(
                                                    'Chọn ảnh',
                                                    'Bạn muốn chọn ảnh từ đâu?',
                                                    [
                                                        {
                                                            text: '📷 Thư viện',
                                                            onPress: async () => {
                                                                const imageUri = await pickImage();
                                                                if (imageUri) setEditingImageUri(imageUri);
                                                            },
                                                        },
                                                        {
                                                            text: '📸 Camera',
                                                            onPress: async () => {
                                                                const imageUri = await takePhoto();
                                                                if (imageUri) setEditingImageUri(imageUri);
                                                            },
                                                        },
                                                        { text: 'Hủy', style: 'cancel' },
                                                    ]
                                                );
                                            }}
                                            disabled={editingUploading}
                                        >
                                            <Ionicons name="camera-outline" size={20} color="#007bff" />
                                            <Text style={styles.editSelectImageButtonText}>
                                                {editingUploading ? '⏳ Đang upload...' : '🔄 Thay đổi ảnh'}
                                            </Text>
                                        </TouchableOpacity>
                                        {editingImageUri && (
                                            <TouchableOpacity 
                                                style={styles.editRemoveImageButton} 
                                                onPress={() => setEditingImageUri(null)}
                                            >
                                                <Ionicons name="close-circle" size={24} color="#ef4444" />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>

                                {/* Form Fields */}
                                <View style={styles.editFormSection}>
                                    <Text style={styles.editFormSectionTitle}>📝 Thông tin cơ bản</Text>
                                    
                                    <View style={styles.editInputGroup}>
                                        <Text style={styles.editInputLabel}>🐾 Tên thú cưng *</Text>
                                        <TextInput 
                                            style={styles.editInput} 
                                            value={editPet.name} 
                                            onChangeText={v => setEditPet({ ...editPet, name: v })} 
                                            placeholder="Nhập tên thú cưng" 
                                        />
                                    </View>

                                    <View style={styles.editInputGroup}>
                                        <Text style={styles.editInputLabel}>🐕 Loài *</Text>
                                        <TextInput 
                                            style={styles.editInput} 
                                            value={editPet.species} 
                                            onChangeText={v => setEditPet({ ...editPet, species: v })} 
                                            placeholder="VD: Chó, Mèo, Chim..." 
                                        />
                                    </View>

                                    <View style={styles.editInputGroup}>
                                        <Text style={styles.editInputLabel}>🏷️ Giống</Text>
                                        <TextInput 
                                            style={styles.editInput} 
                                            value={editPet.breed} 
                                            onChangeText={v => setEditPet({ ...editPet, breed: v })} 
                                            placeholder="VD: Golden Retriever, Persian..." 
                                        />
                                    </View>

                                    <View style={styles.editInputGroup}>
                                        <Text style={styles.editInputLabel}>📅 Ngày sinh</Text>
                                        <TouchableOpacity 
                                            style={styles.editDateButton} 
                                            onPress={() => setShowDatePicker(true)}
                                        >
                                            <Ionicons name="calendar-outline" size={20} color="#64748b" />
                                            <Text style={styles.editDateButtonText}>
                                                {editPet.birthDate ? editPet.birthDate : 'Chọn ngày sinh'}
                                            </Text>
                                        </TouchableOpacity>
                                        {showDatePicker && (
                                            <DateTimePicker
                                                value={editPet.birthDate ? new Date(editPet.birthDate) : new Date()}
                                                mode="date"
                                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                                onChange={(event, selectedDate) => {
                                                    setShowDatePicker(false);
                                                    if (selectedDate) {
                                                        const yyyy = selectedDate.getFullYear();
                                                        const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
                                                        const dd = String(selectedDate.getDate()).padStart(2, '0');
                                                        setEditPet({ ...editPet, birthDate: `${yyyy}-${mm}-${dd}` });
                                                    }
                                                }}
                                                maximumDate={new Date()}
                                            />
                                        )}
                                    </View>

                                    <View style={styles.editInputGroup}>
                                        <Text style={styles.editInputLabel}>⚥ Giới tính</Text>
                                        <View style={styles.editGenderContainer}>
                                            <TouchableOpacity 
                                                style={[
                                                    styles.editGenderOption,
                                                    editPet.gender === 'Đực' && styles.editGenderOptionSelected
                                                ]} 
                                                onPress={() => setEditPet({ ...editPet, gender: 'Đực' })}
                                            >
                                                <Ionicons 
                                                    name={editPet.gender === 'Đực' ? 'radio-button-on' : 'radio-button-off'} 
                                                    size={20} 
                                                    color={editPet.gender === 'Đực' ? '#007bff' : '#94a3b8'} 
                                                />
                                                <Text style={[
                                                    styles.editGenderText,
                                                    editPet.gender === 'Đực' && styles.editGenderTextSelected
                                                ]}>♂️ Đực</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity 
                                                style={[
                                                    styles.editGenderOption,
                                                    editPet.gender === 'Cái' && styles.editGenderOptionSelected
                                                ]} 
                                                onPress={() => setEditPet({ ...editPet, gender: 'Cái' })}
                                            >
                                                <Ionicons 
                                                    name={editPet.gender === 'Cái' ? 'radio-button-on' : 'radio-button-off'} 
                                                    size={20} 
                                                    color={editPet.gender === 'Cái' ? '#007bff' : '#94a3b8'} 
                                                />
                                                <Text style={[
                                                    styles.editGenderText,
                                                    editPet.gender === 'Cái' && styles.editGenderTextSelected
                                                ]}>♀️ Cái</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    <View style={styles.editInputGroup}>
                                        <Text style={styles.editInputLabel}>💉 Vắc xin đã tiêm</Text>
                                        <TextInput
                                            style={[styles.editInput, styles.editTextArea]}
                                            value={editPet.vaccinatedVaccines || ''}
                                            onChangeText={v => setEditPet({ ...editPet, vaccinatedVaccines: v })}
                                            placeholder="Liệt kê các loại vắc xin đã tiêm..."
                                            multiline
                                            numberOfLines={3}
                                        />
                                    </View>
                                </View>

                                {/* Action Buttons */}
                                <View style={styles.editActionButtons}>
                                    <TouchableOpacity 
                                        style={styles.editCancelButton} 
                                        onPress={() => setEditMode(false)} 
                                        disabled={editingUploading}
                                    >
                                        <Text style={styles.editCancelButtonText}>❌ Hủy</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={styles.editSaveButton} 
                                        onPress={async () => {
                                            let imageUrl = editPet.imageUrl;
                                            if (editingImageUri) {
                                                setEditingUploading(true);
                                                try {
                                                    imageUrl = await uploadImageToCloudinary(editingImageUri);
                                                } catch (e) {
                                                    Alert.alert('Lỗi', 'Không thể upload ảnh lên Cloudinary');
                                                }
                                                setEditingUploading(false);
                                            }
                                            try {
                                                await apiClient.put(`/Pet/${selectedPet?.petId}`, {
                                                    name: editPet.name.trim(),
                                                    species: editPet.species.trim(),
                                                    breed: editPet.breed?.trim() || null,
                                                    birthDateString: editPet.birthDate || null,
                                                    imageUrl: imageUrl || null,
                                                    gender: editPet.gender || null,
                                                    vaccinatedVaccines: editPet.vaccinatedVaccines || null
                                                });
                                                await fetchPets();
                                                setEditMode(false);
                                                setDetailModalVisible(false);
                                                Alert.alert('Thành công', '✅ Đã cập nhật thông tin thú cưng!');
                                            } catch (error) {
                                                let errorMessage = 'Đã xảy ra lỗi khi cập nhật.';
                                                if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data) {
                                                    errorMessage = (error.response.data as { message?: string }).message || errorMessage;
                                                }
                                                Alert.alert('Lỗi', errorMessage);
                                            }
                                        }} 
                                        disabled={editingUploading}
                                    >
                                        {editingUploading ? (
                                            <ActivityIndicator color="white" size="small" />
                                        ) : (
                                            <Text style={styles.editSaveButtonText}>💾 Lưu thay đổi</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Used Services Modal */}
            <Modal
                visible={usedServicesModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setUsedServicesModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.servicesModalContent}>
                        <View style={styles.servicesModalHeader}>
                            <Text style={styles.servicesModalTitle}>
                                🏥 Dịch vụ đã sử dụng - {selectedPet?.name}
                            </Text>
                            <TouchableOpacity 
                                style={styles.closeButton}
                                onPress={() => setUsedServicesModalVisible(false)}
                            >
                                <Ionicons name="close-circle" size={28} color="#ff4444" />
                            </TouchableOpacity>
                        </View>
                        
                        {loadingServices ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#007bff" />
                                <Text style={styles.loadingText}>Đang tải dịch vụ...</Text>
                            </View>
                        ) : usedServices.length === 0 ? (
                            <View style={styles.emptyServicesState}>
                                <View style={styles.emptyServicesIconContainer}>
                                    <Ionicons name="medical-outline" size={60} color="#cbd5e1" />
                                </View>
                                <Text style={styles.emptyServicesTitle}>Chưa có dịch vụ nào</Text>
                                <Text style={styles.emptyServicesSubtitle}>
                                    {selectedPet?.name} chưa sử dụng dịch vụ nào tại phòng khám
                                </Text>
                                <TouchableOpacity 
                                    style={styles.retryButton}
                                    onPress={() => selectedPet && fetchUsedServices(selectedPet.petId)}
                                >
                                    <Text style={styles.retryButtonText}>🔄 Thử lại</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <ScrollView style={styles.servicesList} showsVerticalScrollIndicator={false}>
                                <View style={styles.servicesHeader}>
                                    <Text style={styles.servicesCount}>
                                        📊 Tổng cộng: {usedServices.length} dịch vụ đã hoàn thành
                                    </Text>
                                </View>
                                {usedServices.map((service) => (
                                    <View key={service.appointmentId}>
                                        {renderUsedServiceItem({ item: service })}
                                    </View>
                                ))}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'white',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: '#007bff',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 4,
    },
    backButton: {
        position: 'absolute',
        left: 20,
        zIndex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 20,
        padding: 8,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1e293b',
    },
    headerSpacer: {
        position: 'absolute',
        right: 20,
        width: 24,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#64748b',
        fontWeight: '500',
    },
    bottomContainer: {
        padding: 20,
        alignItems: 'center',
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#007bff',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: -2 },
        elevation: 4,
    },
    addButton: {
        borderRadius: 25,
        overflow: 'hidden',
        shadowColor: '#007bff',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
    },
    addButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    addButtonText: {
        color: 'white',
        marginLeft: 8,
        fontWeight: '700',
        fontSize: 16,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyIconContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 50,
        padding: 20,
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 24,
    },
    petsGrid: {
        padding: 16,
    },
    petCard: {
        flex: 1,
        margin: 8,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#007bff',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
    },
    petImageContainer: {
        position: 'relative',
        marginBottom: 12,
    },
    petImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    petImageOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 40,
        backgroundColor: 'rgba(0, 123, 255, 0.1)',
    },
    petInfo: {
        alignItems: 'center',
    },
    petName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
        textAlign: 'center',
        marginBottom: 4,
    },
    petSpecies: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        fontWeight: '500',
    },
    petAge: {
        fontSize: 12,
        color: '#94a3b8',
        textAlign: 'center',
        marginTop: 2,
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 24,
        width: '90%',
        maxWidth: 400,
        maxHeight: '80%',
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
        textAlign: 'center',
        color: '#1e293b',
    },
    input: {
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        fontSize: 16,
        backgroundColor: 'white',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 16,
        marginRight: 12,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e5e7eb',
        alignItems: 'center',
        backgroundColor: 'white',
    },
    cancelButtonText: {
        color: '#64748b',
        fontSize: 16,
        fontWeight: '600',
    },
    saveButton: {
        flex: 1,
        paddingVertical: 16,
        backgroundColor: '#007bff',
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#007bff',
        shadowOpacity: 0.2,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 4,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    imageSection: {
        marginBottom: 16,
    },
    imageSectionTitle: {
        fontSize: 16,
        color: '#374151',
        marginBottom: 12,
        fontWeight: '600',
    },
    selectImageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#007bff',
        borderStyle: 'dashed',
        borderRadius: 12,
        padding: 16,
        backgroundColor: '#f0f9ff',
    },
    selectImageButtonText: {
        marginLeft: 8,
        color: '#007bff',
        fontSize: 16,
        fontWeight: '600',
    },
    selectedImageContainer: {
        marginTop: 12,
        alignItems: 'center',
        position: 'relative',
    },
    selectedImage: {
        width: 120,
        height: 120,
        borderRadius: 12,
    },
    removeImageButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: 'white',
        borderRadius: 15,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ef4444',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
        shadowColor: '#ef4444',
        shadowOpacity: 0.3,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 4,
    },
    deleteButtonText: {
        color: 'white',
        marginLeft: 8,
        fontWeight: '700',
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 2,
    },
    // Services Button Styles
    servicesButton: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
        shadowColor: '#22c55e',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
    },
    servicesButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    servicesButtonText: {
        color: 'white',
        marginLeft: 8,
        fontWeight: '700',
        fontSize: 16,
    },
    // Action Buttons Container
    actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        gap: 12,
    },
    editButton: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#3b82f6',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
    },
    editButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    editButtonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 14,
    },
    // Edit Modal Styles
    editModalTitle: {
        fontSize: 22,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 20,
        color: '#1e293b',
    },
    editImageSection: {
        marginBottom: 24,
    },
    editImageSectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 12,
    },
    editImageContainer: {
        alignItems: 'center',
        position: 'relative',
    },
    editCurrentImage: {
        width: 120,
        height: 120,
        borderRadius: 16,
        marginBottom: 12,
    },
    editSelectImageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#007bff',
        borderStyle: 'dashed',
        borderRadius: 12,
        padding: 12,
        backgroundColor: '#f0f9ff',
        marginBottom: 8,
    },
    editSelectImageButtonText: {
        marginLeft: 8,
        color: '#007bff',
        fontSize: 14,
        fontWeight: '600',
    },
    editRemoveImageButton: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: 'white',
        borderRadius: 15,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    editFormSection: {
        marginBottom: 24,
    },
    editFormSectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 16,
    },
    editInputGroup: {
        marginBottom: 16,
    },
    editInputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    editInput: {
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        backgroundColor: 'white',
    },
    editTextArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    editDateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 16,
        backgroundColor: 'white',
    },
    editDateButtonText: {
        marginLeft: 8,
        fontSize: 16,
        color: '#374151',
    },
    editGenderContainer: {
        flexDirection: 'row',
        gap: 16,
    },
    editGenderOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        backgroundColor: 'white',
        flex: 1,
    },
    editGenderOptionSelected: {
        borderColor: '#007bff',
        backgroundColor: '#f0f9ff',
    },
    editGenderText: {
        marginLeft: 8,
        fontSize: 16,
        color: '#64748b',
        fontWeight: '500',
    },
    editGenderTextSelected: {
        color: '#007bff',
        fontWeight: '600',
    },
    editActionButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    editCancelButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e5e7eb',
        alignItems: 'center',
        backgroundColor: 'white',
    },
    editCancelButtonText: {
        color: '#64748b',
        fontSize: 16,
        fontWeight: '600',
    },
    editSaveButton: {
        flex: 1,
        paddingVertical: 16,
        backgroundColor: '#007bff',
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#007bff',
        shadowOpacity: 0.2,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 4,
    },
    editSaveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    // Services Modal Styles
    servicesModalContent: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 24,
        width: '95%',
        maxHeight: '85%',
        shadowColor: '#007bff',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
    },
    servicesModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    servicesModalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1e293b',
        flex: 1,
    },
    servicesList: {
        maxHeight: 400,
    },
    serviceCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#22c55e',
        shadowColor: '#007bff',
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    serviceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    serviceName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
        flex: 1,
    },
    statusBadge: {
        backgroundColor: '#f0fdf4',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 12,
        color: '#22c55e',
        fontWeight: '600',
    },
    serviceDetails: {
        marginBottom: 8,
    },
    serviceDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    serviceDetailText: {
        fontSize: 14,
        color: '#64748b',
        marginLeft: 8,
        fontWeight: '500',
    },
    serviceNotes: {
        fontSize: 14,
        color: '#374151',
        fontStyle: 'italic',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    emptyServicesState: {
        alignItems: 'center',
        padding: 40,
    },
    emptyServicesTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#374151',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyServicesSubtitle: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 16,
    },
    emptyServicesIconContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 40,
        padding: 20,
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: '#007bff',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        shadowColor: '#007bff',
        shadowOpacity: 0.2,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 4,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    servicesHeader: {
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    servicesCount: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        fontWeight: '600',
    },
}); 