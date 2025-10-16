import apiClient from '@/api/client';
import { useColorScheme } from '@/hooks/useColorScheme';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { ActivityIndicator, Alert, Image, Modal, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import GradientBackground from '../components/GradientBackground';

const DEFAULT_AVATAR = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRbnYeK93JiGT6gAIzmbyt14T6JjVDxL5BOXA&s';

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

const LoggedInView = ({ onLogout, user, onEdit, onOpenChangePwdModal }: { onLogout: () => void, user: any, onEdit: () => void, onOpenChangePwdModal: () => void }) => {
    const colorScheme = useColorScheme();
    const [isDarkMode, setIsDarkMode] = React.useState(colorScheme === 'dark');
    const toggleDarkMode = () => setIsDarkMode(previousState => !previousState);
    const navigation = useNavigation();
    const nav: any = navigation;
    
    // States for real data
    const [stats, setStats] = React.useState({
        petsCount: 0,
        appointmentsCount: 0,
        reviewsCount: 0
    });
    const [appointmentStats, setAppointmentStats] = React.useState({
        pending: 0,
        confirmed: 0,
        completed: 0
    });
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchUserStats = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                if (!token) {
                    setLoading(false);
                    return;
                }
                
                // Fetch all data in parallel
                const [petsRes, appointmentsRes, reviewsRes] = await Promise.all([
                    apiClient.get('/Pet').catch(() => ({ data: [] })),
                    apiClient.get('/Appointment?limit=100').catch(() => ({ data: { appointments: [] } })),
                    apiClient.get('/Review?limit=100').catch(() => ({ data: [] }))
                ]);

                // Process pets data
                const pets = petsRes.data || [];
                const petsCount = Array.isArray(pets) ? pets.length : 0;

                // Process appointments data
                const appointments = appointmentsRes.data.appointments || appointmentsRes.data || [];
                const appointmentsCount = Array.isArray(appointments) ? appointments.length : 0;
                
                // Calculate appointment status counts
                const appointmentStats = {
                    pending: appointments.filter((item: any) => item.status === 0).length,
                    confirmed: appointments.filter((item: any) => item.status === 1).length,
                    completed: appointments.filter((item: any) => item.status === 2).length
                };

                // Process reviews data
                const reviews = reviewsRes.data || [];
                const reviewsCount = Array.isArray(reviews) ? reviews.length : 0;

                setStats({
                    petsCount,
                    appointmentsCount,
                    reviewsCount
                });
                
                setAppointmentStats(appointmentStats);
                
            } catch (error: any) {
                console.error('Error fetching user stats:', error);
                // Keep default values (0)
            } finally {
                setLoading(false);
            }
        };
        
        fetchUserStats();
    }, []);

    return (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
            {/* 1. Enhanced User Info Section */}
            <View style={styles.userInfoSection}>
                <View style={styles.avatarContainer}>
                    <Image source={{ uri: user.avatar || DEFAULT_AVATAR }} style={styles.avatar} />
                    <TouchableOpacity style={styles.editAvatarButton}>
                        <Ionicons name="camera" size={16} color="white" />
                    </TouchableOpacity>
                </View>
                <Text style={styles.userName}>{user.customerName || user.name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                
                {/* Quick Stats */}
                <View style={styles.quickStats}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>
                            {loading ? '...' : stats.petsCount}
                        </Text>
                        <Text style={styles.statLabel}>Thú cưng</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>
                            {loading ? '...' : stats.appointmentsCount}
                        </Text>
                        <Text style={styles.statLabel}>Lịch hẹn</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>
                            {loading ? '...' : stats.reviewsCount}
                        </Text>
                        <Text style={styles.statLabel}>Đánh giá</Text>
                    </View>
                </View>
            </View>

            {/* 2. Quick Actions - Vertical Layout */}
            <Section title="Thao tác nhanh">
                <TouchableOpacity style={styles.quickActionRow} onPress={() => nav.navigate('MyPets' as never)}>
                    <View style={[styles.quickActionIconRow, { backgroundColor: '#FF6B9D' }]}>
                        <Ionicons name="paw" size={22} color="white" />
                    </View>
                    <View style={styles.quickActionContent}>
                        <Text style={styles.quickActionTitle}>Quản lý thú cưng</Text>
                        <Text style={styles.quickActionSubtitle}>Xem và quản lý thông tin thú cưng</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.quickActionRow} onPress={() => nav.navigate('MyAppointments' as never)}>
                    <View style={[styles.quickActionIconRow, { backgroundColor: '#4ECDC4' }]}>
                        <Ionicons name="calendar" size={22} color="white" />
                    </View>
                    <View style={styles.quickActionContent}>
                        <Text style={styles.quickActionTitle}>Lịch hẹn của tôi</Text>
                        <Text style={styles.quickActionSubtitle}>Xem lịch sử và trạng thái đặt lịch</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.quickActionRow} onPress={() => nav.navigate('Review' as never)}>
                    <View style={[styles.quickActionIconRow, { backgroundColor: '#FFC107' }]}>
                        <Ionicons name="star" size={22} color="white" />
                    </View>
                    <View style={styles.quickActionContent}>
                        <Text style={styles.quickActionTitle}>Đánh giá dịch vụ</Text>
                        <Text style={styles.quickActionSubtitle}>Đánh giá và phản hồi về dịch vụ</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.quickActionRow} onPress={() => nav.navigate('ChatBot' as never)}>
                    <View style={[styles.quickActionIconRow, { backgroundColor: '#45B7D1' }]}>
                        <Ionicons name="chatbubble" size={22} color="white" />
                    </View>
                    <View style={styles.quickActionContent}>
                        <Text style={styles.quickActionTitle}>Chat AI tư vấn</Text>
                        <Text style={styles.quickActionSubtitle}>Hỏi đáp với AI về chăm sóc thú cưng</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.quickActionRow} onPress={() => nav.navigate('DirectConsultation' as never)}>
                    <View style={[styles.quickActionIconRow, { backgroundColor: '#96CEB4' }]}>
                        <Ionicons name="medical" size={22} color="white" />
                    </View>
                    <View style={styles.quickActionContent}>
                        <Text style={styles.quickActionTitle}>Tư vấn trực tiếp</Text>
                        <Text style={styles.quickActionSubtitle}>Chat trực tiếp với bác sĩ</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>
            </Section>
            
            {/* 3. Appointment Status Cards - Horizontal Layout */}
            <View style={styles.appointmentSection}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Trạng thái lịch hẹn</Text>
                    <TouchableOpacity onPress={() => nav.navigate('MyAppointments' as never)}>
                        <Text style={styles.viewAllText}>Xem tất cả →</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.appointmentCards}>
                    <TouchableOpacity style={[styles.appointmentCard, styles.pendingCard]} onPress={() => nav.navigate('MyAppointments' as any, { filter: 0 })}>
                        <View style={styles.cardIconContainer}>
                            <Ionicons name="time-outline" size={24} color="#F39C12" />
                        </View>
                        <Text style={styles.cardTitle}>Chờ duyệt</Text>
                        <Text style={styles.cardCount}>
                            {loading ? '...' : appointmentStats.pending}
                        </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={[styles.appointmentCard, styles.confirmedCard]} onPress={() => nav.navigate('MyAppointments' as any, { filter: 1 })}>
                        <View style={styles.cardIconContainer}>
                            <Ionicons name="checkmark-circle-outline" size={24} color="#27AE60" />
                        </View>
                        <Text style={styles.cardTitle}>Đã duyệt</Text>
                        <Text style={styles.cardCount}>
                            {loading ? '...' : appointmentStats.confirmed}
                        </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={[styles.appointmentCard, styles.completedCard]} onPress={() => nav.navigate('MyAppointments' as any, { filter: 2 })}>
                        <View style={styles.cardIconContainer}>
                            <Ionicons name="ribbon-outline" size={24} color="#3498DB" />
                        </View>
                        <Text style={styles.cardTitle}>Hoàn thành</Text>
                        <Text style={styles.cardCount}>
                            {loading ? '...' : appointmentStats.completed}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* 4. Settings */}
            <Section title="Cài đặt">
                <MenuItem 
                    icon="person-outline" 
                    text="Chỉnh sửa thông tin cá nhân" 
                    onPress={onEdit}
                    rightContent={<View style={styles.menuBadge}><Text style={styles.badgeText}>!</Text></View>}
                />
                <MenuItem icon="lock-closed-outline" text="Đổi mật khẩu" onPress={onOpenChangePwdModal} />
                <MenuItem
                    icon="moon-outline"
                    text="Chế độ tối"
                    onPress={() => {}}
                    rightContent={<Switch value={isDarkMode} onValueChange={toggleDarkMode} trackColor={{false: '#E0E0E0', true: '#007bff'}} thumbColor={isDarkMode ? '#ffffff' : '#f4f3f4'} />}
                />
            </Section>

            {/* 5. Support & Info */}
            <Section title="Hỗ trợ & Thông tin">
                <MenuItem icon="call-outline" text="Liên hệ hỗ trợ" onPress={() => {}} />
                <MenuItem icon="document-text-outline" text="Điều khoản sử dụng" onPress={() => {}} />
                <MenuItem icon="shield-checkmark-outline" text="Chính sách bảo mật" onPress={() => {}} />
                <MenuItem icon="chatbubble-ellipses-outline" text="Gửi phản hồi" onPress={() => {}} />
            </Section>

            {/* 6. Logout */}
            <Section>
                <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
                    <Ionicons name="log-out-outline" size={24} color="#FF6B6B" />
                    <Text style={styles.logoutText}>Đăng xuất</Text>
                </TouchableOpacity>
            </Section>
        </ScrollView>
    );
};

const GuestView = () => {
    const navigation = useNavigation();
    return (
        <View style={styles.guestContainer}>
            <View style={styles.guestIconContainer}>
                <Ionicons name="person-circle-outline" size={120} color="#007bff" />
            </View>
            <Text style={styles.guestTitle}>Chào mừng đến với Thu Y Hương Nở</Text>
            <Text style={styles.guestSubtitle}>Đăng nhập để trải nghiệm đầy đủ các tính năng chăm sóc thú cưng</Text>
            
            <View style={styles.guestActions}>
                <TouchableOpacity style={styles.primaryAuthButton} onPress={() => navigation.navigate('Login' as never)}>
                    <Ionicons name="log-in-outline" size={20} color="white" />
                    <Text style={styles.primaryAuthButtonText}>Đăng nhập</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.secondaryAuthButton} onPress={() => navigation.navigate('Register' as never)}>
                    <Ionicons name="person-add-outline" size={20} color="#007bff" />
                    <Text style={styles.secondaryAuthButtonText}>Tạo tài khoản</Text>
                </TouchableOpacity>
            </View>
            
            <View style={styles.guestFeatures}>
                <Text style={styles.featuresTitle}>Tính năng nổi bật:</Text>
                <View style={styles.featuresList}>
                    <View style={styles.featureItem}>
                        <Ionicons name="paw" size={16} color="#FF6B9D" />
                        <Text style={styles.featureText}>Quản lý thú cưng</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <Ionicons name="calendar" size={16} color="#4ECDC4" />
                        <Text style={styles.featureText}>Đặt lịch hẹn</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <Ionicons name="chatbubble" size={16} color="#45B7D1" />
                        <Text style={styles.featureText}>Chat AI tư vấn</Text>
                    </View>
                </View>
            </View>
        </View>
    );
}

export default function ProfileScreen() {
    const [isLoggedIn, setIsLoggedIn] = React.useState(false);
    const [user, setUser] = React.useState<any>({});
    const [editModalVisible, setEditModalVisible] = React.useState(false);
    const [editData, setEditData] = React.useState<any>({});
    const [loading, setLoading] = React.useState(false);
    const [changePwdModalVisible, setChangePwdModalVisible] = React.useState(false);
    const [oldPassword, setOldPassword] = React.useState('');
    const [newPassword, setNewPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [pwdLoading, setPwdLoading] = React.useState(false);
    const [editingField, setEditingField] = React.useState<string | null>(null);

    React.useEffect(() => {
        const checkLogin = async () => {
            const token = await AsyncStorage.getItem('token');
            setIsLoggedIn(!!token);
            if (token) {
                try {
                    const res = await apiClient.get('/User/profile');
                    if (res.data) {
                        setUser(res.data);
                    }
                } catch (err) {
                    // Nếu lỗi, giữ user rỗng
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
        setEditData({
            customerName: user.customerName || user.name || '',
            address: user.address || '',
            gender: user.gender !== undefined ? user.gender : 0,
            email: user.email || '',
            phoneNumber: user.phoneNumber || '',
        });
        setEditModalVisible(true);
    };

    const handleSaveEdit = async () => {
        setLoading(true);
        try {
            await apiClient.put('/User/update-customer', {
                customerName: editData.customerName,
                address: editData.address,
                gender: editData.gender,
                email: editData.email,
                phoneNumber: editData.phoneNumber,
            });
            setUser((prev: any) => ({ ...prev, ...editData }));
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

    const handleFieldEdit = (field: string) => setEditingField(field);
    const handleFieldSave = async (field: string) => {
        setLoading(true);
        try {
            const body: any = { [field]: editData[field] };
            await apiClient.put('/User/update-customer', body);
            setUser((prev: any) => ({ ...prev, ...body }));
            setEditingField(null);
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
    const handleFieldCancel = () => setEditingField(null);

    return (
        <GradientBackground>
            <SafeAreaView style={styles.safeArea}>
            {isLoggedIn ? <LoggedInView onLogout={handleLogout} user={{
                ...user,
                avatar: user.avatar || DEFAULT_AVATAR
            }} onEdit={handleEdit} onOpenChangePwdModal={() => setChangePwdModalVisible(true)} /> : <GuestView />}
            <Modal
                visible={editModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                    <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 24, width: '92%' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Chỉnh sửa thông tin</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <Ionicons name="close" size={28} color="#888" />
                            </TouchableOpacity>
                        </View>
                        {/* Họ và tên */}
                        <View style={{ marginBottom: 14 }}>
                            <Text style={{ fontSize: 16, marginBottom: 4 }}>Họ và tên:</Text>
                            <TextInput
                                style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, fontSize: 16 }}
                                value={editData.customerName}
                                onChangeText={v => setEditData({ ...editData, customerName: v })}
                                placeholder="Họ và tên"
                            />
                        </View>
                        {/* Địa chỉ */}
                        <View style={{ marginBottom: 14 }}>
                            <Text style={{ fontSize: 16, marginBottom: 4 }}>Địa chỉ:</Text>
                            <TextInput
                                style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, fontSize: 16 }}
                                value={editData.address}
                                onChangeText={v => setEditData({ ...editData, address: v })}
                                placeholder="Địa chỉ"
                            />
                        </View>
                        {/* Email */}
                        <View style={{ marginBottom: 14 }}>
                            <Text style={{ fontSize: 16, marginBottom: 4 }}>Email:</Text>
                            <TextInput
                                style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, fontSize: 16 }}
                                value={editData.email}
                                onChangeText={v => setEditData({ ...editData, email: v })}
                                placeholder="Email"
                                keyboardType="email-address"
                            />
                        </View>
                        {/* Số điện thoại */}
                        <View style={{ marginBottom: 14 }}>
                            <Text style={{ fontSize: 16, marginBottom: 4 }}>Số điện thoại:</Text>
                            <TextInput
                                style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, fontSize: 16 }}
                                value={editData.phoneNumber}
                                onChangeText={v => setEditData({ ...editData, phoneNumber: v })}
                                placeholder="Số điện thoại"
                                keyboardType="phone-pad"
                            />
                        </View>
                        {/* Giới tính */}
                        <View style={{ marginBottom: 18 }}>
                            <Text style={{ fontSize: 16, marginBottom: 4 }}>Giới tính:</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <TouchableOpacity onPress={() => setEditData({ ...editData, gender: 0 })} style={{ marginRight: 20 }}>
                                    <Text style={{ color: editData.gender === 0 ? '#007bff' : '#888', fontWeight: 'bold' }}>Nam</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setEditData({ ...editData, gender: 1 })}>
                                    <Text style={{ color: editData.gender === 1 ? '#007bff' : '#888', fontWeight: 'bold' }}>Nữ</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={{ backgroundColor: '#007bff', paddingVertical: 14, borderRadius: 10, alignItems: 'center' }}
                            onPress={handleSaveEdit}
                            disabled={loading}
                        >
                            <Text style={{ color: 'white', fontSize: 17, fontWeight: 'bold' }}>{loading ? 'Đang lưu...' : 'Xác nhận'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            <Modal
              visible={changePwdModalVisible}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setChangePwdModalVisible(false)}
            >
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                <View style={{ backgroundColor: 'white', borderRadius: 10, padding: 20, width: '90%' }}>
                  <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>Đổi mật khẩu</Text>
                  <TextInput
                    style={styles.input}
                    value={oldPassword}
                    onChangeText={setOldPassword}
                    placeholder="Mật khẩu cũ"
                    secureTextEntry
                  />
                  <TextInput
                    style={styles.input}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Mật khẩu mới"
                    secureTextEntry
                  />
                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Nhập lại mật khẩu mới"
                    secureTextEntry
                  />
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
                    <TouchableOpacity onPress={() => setChangePwdModalVisible(false)} style={{ marginRight: 15 }} disabled={pwdLoading}>
                      <Text style={{ color: '#888', fontSize: 16 }}>Hủy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={async () => {
                        if (!oldPassword || !newPassword || !confirmPassword) {
                          Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
                          return;
                        }
                        if (newPassword !== confirmPassword) {
                          Alert.alert('Lỗi', 'Mật khẩu mới không khớp');
                          return;
                        }
                        setPwdLoading(true);
                        try {
                          await apiClient.post('/User/change-password', {
                            oldPassword,
                            newPassword,
                          });
                          setChangePwdModalVisible(false);
                          setOldPassword('');
                          setNewPassword('');
                          setConfirmPassword('');
                          Alert.alert('Thành công', 'Đổi mật khẩu thành công!');
                        } catch (error) {
                          let errorMessage = 'Đã xảy ra lỗi khi đổi mật khẩu.';
                          if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data) {
                            errorMessage = (error.response.data as { message?: string }).message || errorMessage;
                          }
                          Alert.alert('Lỗi', errorMessage);
                        } finally {
                          setPwdLoading(false);
                        }
                      }}
                      disabled={pwdLoading}
                    >
                      {pwdLoading ? <ActivityIndicator /> : <Text style={{ color: '#007bff', fontSize: 16 }}>Lưu</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
        </SafeAreaView>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    container: {
        paddingBottom: 100,
    },
    header: {
        paddingVertical: 28,
        alignItems: 'center',
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e5',
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        marginBottom: 0,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#007bff',
        letterSpacing: 1,
    },
    
    // Enhanced User Info Section
    userInfoSection: {
        alignItems: 'center',
        paddingVertical: 32,
        backgroundColor: 'white',
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        marginBottom: 20,
        shadowColor: '#007bff',
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: '#007bff',
        backgroundColor: '#e7f3ff',
    },
    editAvatarButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#007bff',
        borderRadius: 16,
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    userName: {
        fontSize: 26,
        fontWeight: '700',
        color: '#2c3e50',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 16,
        color: '#7f8c8d',
        marginBottom: 24,
    },
    
    // Quick Stats
    quickStats: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 24,
        width: '90%',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 20,
        fontWeight: '700',
        color: '#007bff',
    },
    statLabel: {
        fontSize: 12,
        color: '#7f8c8d',
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: '#e0e0e0',
        marginHorizontal: 16,
    },
    
    // Section Styles
    sectionContainer: {
        marginTop: 16,
        marginHorizontal: 16,
        borderRadius: 20,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
        overflow: 'hidden',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2c3e50',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    sectionContent: {
        backgroundColor: 'white',
    },
    
    // Quick Actions Row Layout
    quickActionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    quickActionIconRow: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    quickActionContent: {
        flex: 1,
    },
    quickActionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 2,
    },
    quickActionSubtitle: {
        fontSize: 13,
        color: '#7f8c8d',
        lineHeight: 18,
    },
    
    // Appointment Section
    appointmentSection: {
        marginHorizontal: 16,
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    viewAllText: {
        color: '#007bff',
        fontSize: 16,
        fontWeight: '600',
    },
    appointmentCards: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    appointmentCard: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    pendingCard: {
        borderTopWidth: 3,
        borderTopColor: '#F39C12',
    },
    confirmedCard: {
        borderTopWidth: 3,
        borderTopColor: '#27AE60',
    },
    completedCard: {
        borderTopWidth: 3,
        borderTopColor: '#3498DB',
    },
    cardIconContainer: {
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#7f8c8d',
        marginBottom: 4,
    },
    cardCount: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2c3e50',
    },
    
    // Menu Items
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    menuItemIcon: {
        marginRight: 16,
        color: '#007bff',
        width: 24,
    },
    menuItemText: {
        flex: 1,
        fontSize: 16,
        color: '#2c3e50',
        fontWeight: '500',
    },
    menuItemRight: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuBadge: {
        backgroundColor: '#FF6B6B',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    badgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    
    // Logout Button
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        paddingHorizontal: 20,
        backgroundColor: '#fff5f5',
        borderRadius: 12,
        margin: 16,
        borderWidth: 1,
        borderColor: '#FFE8E8',
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FF6B6B',
        marginLeft: 8,
    },
    
    // Guest View
    guestContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: 'white',
    },
    guestIconContainer: {
        marginBottom: 24,
    },
    guestTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#2c3e50',
        textAlign: 'center',
        marginBottom: 12,
    },
    guestSubtitle: {
        fontSize: 16,
        color: '#7f8c8d',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    guestActions: {
        width: '100%',
        marginBottom: 32,
    },
    primaryAuthButton: {
        backgroundColor: '#007bff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#007bff',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
    },
    primaryAuthButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
        marginLeft: 8,
    },
    secondaryAuthButton: {
        backgroundColor: 'white',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#007bff',
    },
    secondaryAuthButtonText: {
        color: '#007bff',
        fontSize: 18,
        fontWeight: '700',
        marginLeft: 8,
    },
    guestFeatures: {
        width: '100%',
    },
    featuresTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2c3e50',
        marginBottom: 16,
        textAlign: 'center',
    },
    featuresList: {
        gap: 12,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    featureText: {
        fontSize: 16,
        color: '#7f8c8d',
        marginLeft: 12,
    },
    
    // Input styles
    input: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        padding: 16,
        marginBottom: 16,
        borderRadius: 12,
        fontSize: 16,
        backgroundColor: '#f8f9fa',
    },
}); 