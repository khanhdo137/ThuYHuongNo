import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function RegisterScreen() {
    const navigation = useNavigation();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
    });

    const handleInputChange = (field: keyof typeof formData, value: string) => {
        setFormData(prevState => ({ ...prevState, [field]: value }));
    };

    const handleRegister = () => {
        const { username, email, phoneNumber, password, confirmPassword } = formData;
        if (!username || !email || !phoneNumber || !password || !confirmPassword) {
            Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin.');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp.');
            return;
        }
        // TODO: Implement actual registration logic (e.g., call API)
        Alert.alert('Thành công', 'Đăng ký thành công! (demo)');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Tạo tài khoản</Text>

                <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={22} color="#888" style={styles.inputIcon} />
                    <TextInput style={styles.input} value={formData.username} onChangeText={val => handleInputChange('username', val)} placeholder="Tên người dùng" />
                </View>
                <View style={styles.inputContainer}>
                    <Ionicons name="mail-outline" size={22} color="#888" style={styles.inputIcon} />
                    <TextInput style={styles.input} value={formData.email} onChangeText={val => handleInputChange('email', val)} placeholder="Email" keyboardType="email-address" />
                </View>
                <View style={styles.inputContainer}>
                    <Ionicons name="call-outline" size={22} color="#888" style={styles.inputIcon} />
                    <TextInput style={styles.input} value={formData.phoneNumber} onChangeText={val => handleInputChange('phoneNumber', val)} placeholder="Số điện thoại" keyboardType="phone-pad" />
                </View>
                <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={22} color="#888" style={styles.inputIcon} />
                    <TextInput style={styles.input} value={formData.password} onChangeText={val => handleInputChange('password', val)} placeholder="Mật khẩu" secureTextEntry />
                </View>
                <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={22} color="#888" style={styles.inputIcon} />
                    <TextInput style={styles.input} value={formData.confirmPassword} onChangeText={val => handleInputChange('confirmPassword', val)} placeholder="Xác nhận mật khẩu" secureTextEntry />
                </View>
                
                <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
                    <Text style={styles.registerButtonText}>Đăng ký</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.switchText}>Đã có tài khoản? <Text style={{fontWeight: 'bold'}}>Đăng nhập</Text></Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: 'white' },
    container: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 30,
        paddingVertical: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 40,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f3f3',
        borderRadius: 10,
        marginBottom: 20,
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
        backgroundColor: '#007bff',
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