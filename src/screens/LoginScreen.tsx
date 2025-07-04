import apiClient from '@/api/client'; // Import the configured axios client
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
    const navigation = useNavigation();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        if (!username || !password) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
            return;
        }

        setLoading(true);
        try {
            // Corrected endpoint based on documentation: /user/login
            const response = await apiClient.post('/user/login', {
                username: username,
                password: password,
            });

            // Log the response to debug structure
            console.log('Login response:', response.data);
            const { token, user } = response.data || {};

            // TODO: Save the token and user data to secure storage and global state (e.g., Context)
            if (token) {
                await AsyncStorage.setItem('token', token);
            }
            if (user && user.username) {
                Alert.alert('Thành công', `Chào mừng ${user.username}!`);
            } else {
                Alert.alert('Thành công', 'Đăng nhập thành công!');
            }
            
            // Navigate to the main app (e.g., Profile screen) after successful login
            // You might want to reset the navigation stack
            navigation.navigate('Main' as never);

        } catch (error) {
            console.error('Login failed:', error);
            let errorMessage = 'Tên đăng nhập hoặc mật khẩu không chính xác.';
            if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data) {
                errorMessage = (error.response.data as { message?: string }).message || errorMessage;
            }
            Alert.alert('Đăng nhập thất bại', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.title}>Đăng nhập</Text>
                <Text style={styles.subtitle}>Chào mừng trở lại!</Text>

                <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={22} color="#888" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        value={username}
                        onChangeText={setUsername}
                        placeholder="Nhập tên đăng nhập"
                        autoCapitalize="none"
                        editable={!loading}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={22} color="#888" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Nhập mật khẩu"
                        secureTextEntry={!showPassword}
                        editable={!loading}
                    />
                    <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)} disabled={loading}>
                        <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color="#888" />
                    </TouchableOpacity>
                </View>
                
                <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.loginButtonText}>Đăng nhập</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('Register' as never)} disabled={loading}>
                    <Text style={styles.switchText}>Chưa có tài khoản? <Text style={{fontWeight: 'bold'}}>Đăng ký ngay</Text></Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: 'white' },
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 30,
        backgroundColor: '#f5f8ff',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
        color: '#007bff',
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 40,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f3f3',
        borderRadius: 12,
        marginBottom: 22,
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
    loginButton: {
        backgroundColor: '#007bff',
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 20,
        shadowColor: '#007bff',
        shadowOpacity: 0.10,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    loginButtonText: {
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