import apiClient from '@/api/client';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function RegisterScreen() {
    const navigation = useNavigation();

    // Dựa theo API_DOCUMENTATION.md
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [address, setAddress] = useState('');
    
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        // Kiểm tra các trường bắt buộc
        if (!username || !password || !email || !customerName) {
            Alert.alert('Lỗi', 'Vui lòng điền các trường bắt buộc: Tên đăng nhập, Mật khẩu, Email, Họ và tên.');
            return;
        }

        // Kiểm tra mật khẩu có khớp không
        if (password !== confirmPassword) {
            Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp.');
            return;
        }

        setLoading(true);

        // Dữ liệu gửi đi, role và gender sẽ được mặc định
        const userData = {
            username,
            password,
            email,
            phoneNumber,
            customerName,
            address,
            role: 0, // 0 = Customer
            gender: 0, // Mặc định là Nam, có thể thay đổi sau trong profile
        };

        try {
            const response = await apiClient.post('/user/register', userData);
            
            console.log('Register successful:', response.data);
            Alert.alert(
                'Thành công',
                'Tài khoản của bạn đã được tạo thành công. Vui lòng đăng nhập.',
                [{ text: 'OK', onPress: () => navigation.navigate('Login' as never) }]
            );

        } catch (error) {
            console.error('Registration failed:', error);
            const errorMessage = error.response?.data?.message || 'Đã xảy ra lỗi trong quá trình đăng ký. Vui lòng thử lại.';
            Alert.alert('Đăng ký thất bại', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollView}>
                <View style={styles.container}>
                    <Text style={styles.title}>Tạo tài khoản</Text>
                    <Text style={styles.subtitle}>Điền thông tin để bắt đầu</Text>

                    {/* Tên đăng nhập */}
                    <View style={styles.inputContainer}>
                        <Ionicons name="person-outline" size={22} color="#888" style={styles.inputIcon} />
                        <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholder="Tên đăng nhập (*)" autoCapitalize="none" editable={!loading} />
                    </View>
                    
                    {/* Email */}
                    <View style={styles.inputContainer}>
                        <Ionicons name="mail-outline" size={22} color="#888" style={styles.inputIcon} />
                        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email (*)" keyboardType="email-address" autoCapitalize="none" editable={!loading} />
                    </View>

                    {/* Mật khẩu */}
                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={22} color="#888" style={styles.inputIcon} />
                        <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Mật khẩu (*)" secureTextEntry editable={!loading} />
                    </View>

                    {/* Xác nhận mật khẩu */}
                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={22} color="#888" style={styles.inputIcon} />
                        <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Xác nhận mật khẩu (*)" secureTextEntry editable={!loading} />
                    </View>
                    
                    {/* Họ và tên */}
                     <View style={styles.inputContainer}>
                        <Ionicons name="body-outline" size={22} color="#888" style={styles.inputIcon} />
                        <TextInput style={styles.input} value={customerName} onChangeText={setCustomerName} placeholder="Họ và tên (*)" editable={!loading} />
                    </View>

                    {/* Số điện thoại */}
                     <View style={styles.inputContainer}>
                        <Ionicons name="call-outline" size={22} color="#888" style={styles.inputIcon} />
                        <TextInput style={styles.input} value={phoneNumber} onChangeText={setPhoneNumber} placeholder="Số điện thoại" keyboardType="phone-pad" editable={!loading} />
                    </View>

                    {/* Địa chỉ */}
                     <View style={styles.inputContainer}>
                        <Ionicons name="location-outline" size={22} color="#888" style={styles.inputIcon} />
                        <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Địa chỉ" editable={!loading} />
                    </View>

                    <TouchableOpacity style={styles.registerButton} onPress={handleRegister} disabled={loading}>
                         {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.registerButtonText}>Đăng ký</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.goBack()} disabled={loading}>
                        <Text style={styles.switchText}>Đã có tài khoản? <Text style={{fontWeight: 'bold'}}>Đăng nhập</Text></Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: 'white' },
    scrollView: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    container: {
        paddingHorizontal: 30,
        paddingVertical: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f3f3',
        borderRadius: 10,
        marginBottom: 15,
        paddingHorizontal: 15,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 50,
        fontSize: 16,
    },
    registerButton: {
        backgroundColor: '#28a745',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 20,
    },
    registerButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    switchText: {
        textAlign: 'center',
        fontSize: 15,
        color: '#555',
    }
}); 