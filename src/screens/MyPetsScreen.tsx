import apiClient from '@/api/client';
import { pickImage, takePhoto, uploadImageToCloudinary } from '@/services/cloudinaryService';
import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Modal, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

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
}

// Interface cho tạo thú cưng mới
interface CreatePetData {
    name: string;
    species: string;
    breed?: string;
    birthDate?: string;
    imageUrl?: string;
}

export default function MyPetsScreen() {
    const [pets, setPets] = useState<Pet[]>([]);
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [newPet, setNewPet] = useState<CreatePetData>({ 
        name: '', 
        species: '', 
        breed: '', 
        birthDate: '', 
        imageUrl: '' 
    });
    const [loading, setLoading] = useState(false);
    const [addingPet, setAddingPet] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
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

    const renderPetItem = ({ item }: { item: Pet }) => (
        <View style={styles.petCard}>
            <Image 
                source={{ 
                    uri: item.imageUrl || 'https://via.placeholder.com/150/cccccc/666666?text=Pet' 
                }} 
                style={styles.petImage} 
            />
            <Text style={styles.petName}>{item.name}</Text>
            <Text style={styles.petSpecies}>{item.species}</Text>
            {item.age && <Text style={styles.petAge}>{item.age} tuổi</Text>}
        </View>
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
            };

            await apiClient.post('/Pet', petData);
            
            // Làm mới danh sách thú cưng
            await fetchPets();
            
            setNewPet({ name: '', species: '', breed: '', birthDate: '', imageUrl: '' });
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
            <Ionicons name="paw-outline" size={80} color="#ccc" />
            <Text style={styles.emptyTitle}>Chưa có thú cưng nào</Text>
            <Text style={styles.emptySubtitle}>Hãy thêm thú cưng đầu tiên của bạn</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Thú cưng của tôi</Text>
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
                    <Ionicons name="add" size={24} color="white" />
                    <Text style={styles.addButtonText}>Thêm thú cưng</Text>
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
                                    setNewPet({ name: '', species: '', breed: '', birthDate: '', imageUrl: '' });
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    backButton: {
        position: 'absolute',
        left: 20,
        zIndex: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
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
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    bottomContainer: {
        padding: 20,
        alignItems: 'center',
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#e9ecef',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007bff',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    addButtonText: {
        color: 'white',
        marginLeft: 8,
        fontWeight: '600',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#666',
        marginTop: 20,
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
        marginTop: 10,
    },
    petsGrid: {
        padding: 10,
    },
    petCard: {
        flex: 1,
        margin: 5,
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    petImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 10,
    },
    petName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
    },
    petSpecies: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginTop: 2,
    },
    petAge: {
        fontSize: 12,
        color: '#888',
        textAlign: 'center',
        marginTop: 2,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        width: '90%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 15,
        fontSize: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        marginRight: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
    saveButton: {
        flex: 1,
        paddingVertical: 12,
        backgroundColor: '#007bff',
        borderRadius: 8,
        alignItems: 'center',
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    imageSection: {
        marginBottom: 15,
    },
    imageSectionTitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    selectImageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#007bff',
        borderStyle: 'dashed',
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#f8f9fa',
    },
    selectImageButtonText: {
        marginLeft: 8,
        color: '#007bff',
        fontSize: 16,
    },
    selectedImageContainer: {
        marginTop: 10,
        alignItems: 'center',
        position: 'relative',
    },
    selectedImage: {
        width: 100,
        height: 100,
        borderRadius: 8,
    },
    removeImageButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: 'white',
        borderRadius: 12,
    },
}); 