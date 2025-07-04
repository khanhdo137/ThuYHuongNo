import apiClient from '@/api/client';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Picker } from '@react-native-picker/picker';
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
    const [gender, setGender] = useState(0); // 0: Nam, 1: Nữ
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
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
            gender, // Lấy từ state
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
            let errorMessage = 'Đã xảy ra lỗi trong quá trình đăng ký. Vui lòng thử lại.';
            if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data) {
                errorMessage = (error.response.data as { message?: string }).message || errorMessage;
            }
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
                        <TextInput
                            style={styles.input}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Mật khẩu (*)"
                            secureTextEntry={!showPassword}
                            editable={!loading}
                        />
                        <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)} disabled={loading}>
                            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color="#888" />
                        </TouchableOpacity>
                    </View>

                    {/* Xác nhận mật khẩu */}
                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={22} color="#888" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholder="Xác nhận mật khẩu (*)"
                            secureTextEntry={!showConfirmPassword}
                            editable={!loading}
                        />
                        <TouchableOpacity onPress={() => setShowConfirmPassword((prev) => !prev)} disabled={loading}>
                            <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color="#888" />
                        </TouchableOpacity>
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

                    {/* Giới tính */}
                    <View style={styles.inputContainer}>
                        <Ionicons name="male-female-outline" size={22} color="#888" style={styles.inputIcon} />
                        <Picker
                            selectedValue={gender}
                            style={{ flex: 1, height: 50 }}
                            onValueChange={(itemValue: number) => setGender(itemValue)}
                            enabled={!loading}
                        >
                            <Picker.Item label="Nam" value={0} />
                            <Picker.Item label="Nữ" value={1} />
                        </Picker>
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
        backgroundColor: '#f5f8ff',
        borderRadius: 16,
        shadowColor: '#28a745',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        marginTop: 30,
        marginBottom: 30,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
        color: '#28a745',
        letterSpacing: 1,
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
        borderRadius: 12,
        marginBottom: 15,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 50,
        fontSize: 16,
        color: '#222',
    },
    registerButton: {
        backgroundColor: '#28a745',
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 20,
        shadowColor: '#28a745',
        shadowOpacity: 0.10,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    registerButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    switchText: {
        textAlign: 'center',
        fontSize: 15,
        color: '#555',
        marginTop: 10,
        textDecorationLine: 'underline',
    }
}); 