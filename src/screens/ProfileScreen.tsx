import apiClient from '@/api/client';
import { useColorScheme } from '@/hooks/useColorScheme';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { ActivityIndicator, Alert, Image, Modal, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Mock data for the user
const defaultUser = {
    avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRbnYeK93JiGT6gAIzmbyt14T6JjVDxL5BOXA&s',
    name: 'Thu Y Huong No',
    customerName: 'Thu Y Huong No',
    address: '',
    gender: 0,
    email: '',
    phoneNumber: '',
};

interface SectionProps {
    children: React.ReactNode;
    title?: string;
}

const Section = ({ children, title }: SectionProps) => (
    <View style={styles.sectionContainer}>
        {title && <Text style={styles.sectionTitle}>{title}</Text>}
        <View style={styles.sectionContent}>
            {children}
        </View>
    </View>
);

interface MenuItemProps {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    text: string;
    onPress?: () => void;
    rightContent?: React.ReactNode;
}

const MenuItem = ({ icon, text, onPress, rightContent }: MenuItemProps) => (
    <TouchableOpacity onPress={onPress} style={styles.menuItem}>
        <Ionicons name={icon} size={24} style={styles.menuItemIcon} />
        <Text style={styles.menuItemText}>{text}</Text>
        <View style={styles.menuItemRight}>
            {rightContent || <Ionicons name="chevron-forward-outline" size={22} color="#888" />}
        </View>
    </TouchableOpacity>
);

const LoggedInView = ({ onLogout, user, onEdit }: { onLogout: () => void, user: any, onEdit: () => void }) => {
    const colorScheme = useColorScheme();
    const [isDarkMode, setIsDarkMode] = React.useState(colorScheme === 'dark');
    const toggleDarkMode = () => setIsDarkMode(previousState => !previousState);

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Cá nhân</Text>
            </View>

            {/* 1. User Info */}
            <View style={styles.userInfoSection}>
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
                <Text style={styles.userName}>{user.customerName || user.name}</Text>
            </View>

            {/* 2. Personal Functions */}
            <Section>
                <MenuItem icon="person-outline" text="Chỉnh sửa thông tin cá nhân" onPress={onEdit} />
                <MenuItem icon="lock-closed-outline" text="Đổi mật khẩu" onPress={() => {}} />
                <MenuItem
                    icon="moon-outline"
                    text="Chế độ tối"
                    onPress={() => {}}
                    rightContent={<Switch value={isDarkMode} onValueChange={toggleDarkMode} />}
                />
            </Section>

            {/* My Pets Section */}
            <Section>
                <MenuItem icon="paw-outline" text="Thú cưng của tôi" onPress={() => { /* Navigate to pet list screen */ }} />
            </Section>
            
            {/* 3. History & Activity */}
            <Section>
                    <MenuItem icon="time-outline" text="Lịch sử & hoạt động" onPress={() => {}} />
            </Section>

            {/* 4. Support & Info */}
            <Section>
                <MenuItem icon="call-outline" text="Liên hệ hỗ trợ" onPress={() => {}} />
                <MenuItem icon="document-text-outline" text="Điều khoản sử dụng" onPress={() => {}} />
                <MenuItem icon="shield-checkmark-outline" text="Chính sách bảo mật" onPress={() => {}} />
            </Section>

            {/* 5. Others */}
            <Section>
                <MenuItem icon="chatbubble-ellipses-outline" text="Gửi phản hồi / Báo lỗi" onPress={() => {}} />
                <MenuItem icon="log-out-outline" text="Đăng xuất" onPress={onLogout} />
            </Section>
        </ScrollView>
    );
};

const GuestView = () => {
    const navigation = useNavigation();
    return (
        <View style={styles.guestContainer}>
            <Ionicons name="person-circle-outline" size={120} color="#ccc" />
            <Text style={styles.guestTitle}>Vui lòng đăng nhập</Text>
            <Text style={styles.guestSubtitle}>Để trải nghiệm đầy đủ các tính năng của ứng dụng</Text>
            <TouchableOpacity style={styles.authButton} onPress={() => navigation.navigate('Login' as never)}>
                <Text style={styles.authButtonText}>Đăng nhập</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Register' as never)}>
                <Text style={styles.switchAuthText}>Chưa có tài khoản? <Text style={{fontWeight: 'bold'}}>Đăng ký</Text></Text>
            </TouchableOpacity>
        </View>
    );
}

export default function ProfileScreen() {
    const [isLoggedIn, setIsLoggedIn] = React.useState(false);
    const [user, setUser] = React.useState(defaultUser);
    const [editModalVisible, setEditModalVisible] = React.useState(false);
    const [editData, setEditData] = React.useState({ ...defaultUser });
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        const checkLogin = async () => {
            const token = await AsyncStorage.getItem('token');
            setIsLoggedIn(!!token);
            if (token) {
                try {
                    const res = await apiClient.get('/User/profile');
                    if (res.data) {
                        setUser({ ...defaultUser, ...res.data });
                    }
                } catch (err) {
                    // Nếu lỗi, giữ user mặc định
                }
            }
        };
        checkLogin();
    }, []);

    const handleLogout = async () => {
        await AsyncStorage.removeItem('token');
        setIsLoggedIn(false);
    };

    const handleEdit = () => {
        setEditData({ ...user });
        setEditModalVisible(true);
    };

    const handleSaveEdit = async () => {
        setLoading(true);
        try {
            const body = {
                customerName: editData.customerName,
                address: editData.address,
                gender: editData.gender,
                email: editData.email,
                phoneNumber: editData.phoneNumber,
            };
            await apiClient.put('/User/update-customer', body);
            setUser({ ...user, ...body });
            setEditModalVisible(false);
            Alert.alert('Thành công', 'Cập nhật thông tin thành công!');
        } catch (error) {
            let errorMessage = 'Đã xảy ra lỗi khi cập nhật.';
            if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data) {
                errorMessage = (error.response.data as { message?: string }).message || errorMessage;
            }
            Alert.alert('Lỗi', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {isLoggedIn ? <LoggedInView onLogout={handleLogout} user={user} onEdit={handleEdit} /> : <GuestView />}
            <Modal
                visible={editModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                    <View style={{ backgroundColor: 'white', borderRadius: 10, padding: 20, width: '90%' }}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>Chỉnh sửa thông tin</Text>
                        <TextInput
                            style={styles.input}
                            value={editData.customerName}
                            onChangeText={v => setEditData({ ...editData, customerName: v })}
                            placeholder="Họ và tên"
                        />
                        <TextInput
                            style={styles.input}
                            value={editData.address}
                            onChangeText={v => setEditData({ ...editData, address: v })}
                            placeholder="Địa chỉ"
                        />
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                            <Text style={{ marginRight: 10 }}>Giới tính:</Text>
                            <TouchableOpacity onPress={() => setEditData({ ...editData, gender: 0 })} style={{ marginRight: 10 }}>
                                <Text style={{ color: editData.gender === 0 ? '#007bff' : '#888' }}>Nam</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setEditData({ ...editData, gender: 1 })}>
                                <Text style={{ color: editData.gender === 1 ? '#007bff' : '#888' }}>Nữ</Text>
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={styles.input}
                            value={editData.email}
                            onChangeText={v => setEditData({ ...editData, email: v })}
                            placeholder="Email"
                            keyboardType="email-address"
                        />
                        <TextInput
                            style={styles.input}
                            value={editData.phoneNumber}
                            onChangeText={v => setEditData({ ...editData, phoneNumber: v })}
                            placeholder="Số điện thoại"
                            keyboardType="phone-pad"
                        />
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)} style={{ marginRight: 15 }} disabled={loading}>
                                <Text style={{ color: '#888', fontSize: 16 }}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleSaveEdit} disabled={loading}>
                                {loading ? <ActivityIndicator /> : <Text style={{ color: '#007bff', fontSize: 16 }}>Lưu</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f2f2f7',
    },
    container: {
        paddingBottom: 20,
    },
    header: {
        paddingVertical: 16,
        alignItems: 'center',
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e5',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    userInfoSection: {
        alignItems: 'center',
        paddingVertical: 20,
        backgroundColor: 'white',
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    userName: {
        marginTop: 12,
        fontSize: 22,
        fontWeight: '600',
    },
    sectionContainer: {
        marginTop: 12,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6d6d72',
        paddingHorizontal: 16,
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    sectionContent: {
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#c6c6c8',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#c6c6c8',
    },
    menuItemIcon: {
        marginRight: 16,
        color: '#007aff' // A nice blue color for icons
    },
    menuItemText: {
        flex: 1,
        fontSize: 16,
    },
    menuItemRight: {
        justifyContent: 'center',
        alignItems: 'center'
    },
    guestContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'white',
    },
    guestTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 20,
    },
    guestSubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 10,
        marginBottom: 30,
    },
    authButton: {
        backgroundColor: '#007bff',
        paddingVertical: 14,
        paddingHorizontal: 100,
        borderRadius: 10,
        marginBottom: 20,
    },
    authButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    switchAuthText: {
        fontSize: 15,
        color: '#555',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        marginBottom: 10,
    },
}); 