import apiClient from '@/api/client';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform } from 'react-native';
import GradientBackground from '../components/GradientBackground';

export default function RegisterScreen() {
    const navigation = useNavigation();

    // Form states
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
    
    // UI states
    const [loading, setLoading] = useState(false);
    
    // Validation states
    const [errors, setErrors] = useState<{[key: string]: string}>({});
    const [touched, setTouched] = useState<{[key: string]: boolean}>({});

    // Validation functions
    const validateUsername = (value: string): string => {
        if (!value.trim()) return 'Tên đăng nhập là bắt buộc';
        if (value.length < 3) return 'Tên đăng nhập phải có ít nhất 3 ký tự';
        if (value.length > 20) return 'Tên đăng nhập không được quá 20 ký tự';
        if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới';
        return '';
    };

    const validateEmail = (value: string): string => {
        if (!value.trim()) return 'Email là bắt buộc';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Email không hợp lệ';
        return '';
    };

    const validatePassword = (value: string): string => {
        if (!value) return 'Mật khẩu là bắt buộc';
        if (value.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự';
        if (value.length > 50) return 'Mật khẩu không được quá 50 ký tự';
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
            return 'Mật khẩu phải chứa ít nhất 1 chữ thường, 1 chữ hoa và 1 số';
        }
        return '';
    };

    const validateConfirmPassword = (value: string): string => {
        if (!value) return 'Xác nhận mật khẩu là bắt buộc';
        if (value !== password) return 'Mật khẩu xác nhận không khớp';
        return '';
    };

    const validateCustomerName = (value: string): string => {
        if (!value.trim()) return 'Họ và tên là bắt buộc';
        if (value.length < 2) return 'Họ và tên phải có ít nhất 2 ký tự';
        if (value.length > 50) return 'Họ và tên không được quá 50 ký tự';
        if (!/^[a-zA-ZÀ-ỹ\s]+$/.test(value)) return 'Họ và tên chỉ được chứa chữ cái và khoảng trắng';
        return '';
    };

    const validatePhoneNumber = (value: string): string => {
        if (!value.trim()) return ''; // Phone is optional
        const phoneRegex = /^[0-9]{10,11}$/;
        if (!phoneRegex.test(value.replace(/\s/g, ''))) {
            return 'Số điện thoại phải có 10-11 chữ số';
        }
        return '';
    };

    const validateField = (field: string, value: string): string => {
        switch (field) {
            case 'username': return validateUsername(value);
            case 'email': return validateEmail(value);
            case 'password': return validatePassword(value);
            case 'confirmPassword': return validateConfirmPassword(value);
            case 'customerName': return validateCustomerName(value);
            case 'phoneNumber': return validatePhoneNumber(value);
            default: return '';
        }
    };

    const handleFieldChange = (field: string, value: string) => {
        // Update field value
        switch (field) {
            case 'username': setUsername(value); break;
            case 'email': setEmail(value); break;
            case 'password': setPassword(value); break;
            case 'confirmPassword': setConfirmPassword(value); break;
            case 'customerName': setCustomerName(value); break;
            case 'phoneNumber': setPhoneNumber(value); break;
            case 'address': setAddress(value); break;
        }

        // Validate field if it has been touched
        if (touched[field]) {
            const error = validateField(field, value);
            setErrors(prev => ({
                ...prev,
                [field]: error
            }));
        }
    };

    const handleFieldBlur = (field: string) => {
        setTouched(prev => ({
            ...prev,
            [field]: true
        }));

        const value = (() => {
            switch (field) {
                case 'username': return username;
                case 'email': return email;
                case 'password': return password;
                case 'confirmPassword': return confirmPassword;
                case 'customerName': return customerName;
                case 'phoneNumber': return phoneNumber;
                default: return '';
            }
        })();

        const error = validateField(field, value);
        setErrors(prev => ({
            ...prev,
            [field]: error
        }));
    };

    const validateAllFields = (): boolean => {
        const newErrors: {[key: string]: string} = {};
        const fieldsToValidate = ['username', 'email', 'password', 'confirmPassword', 'customerName', 'phoneNumber'];

        fieldsToValidate.forEach(field => {
            const value = (() => {
                switch (field) {
                    case 'username': return username;
                    case 'email': return email;
                    case 'password': return password;
                    case 'confirmPassword': return confirmPassword;
                    case 'customerName': return customerName;
                    case 'phoneNumber': return phoneNumber;
                    default: return '';
                }
            })();

            const error = validateField(field, value);
            if (error) {
                newErrors[field] = error;
            }
        });

        setErrors(newErrors);
        setTouched({
            username: true,
            email: true,
            password: true,
            confirmPassword: true,
            customerName: true,
            phoneNumber: true
        });

        return Object.keys(newErrors).length === 0;
    };

    const handleRegister = async () => {
        if (!validateAllFields()) {
            Alert.alert('Lỗi', 'Vui lòng kiểm tra lại thông tin đã nhập.');
            return;
        }

        setLoading(true);

        const userData = {
            username: username.trim(),
            password,
            email: email.trim().toLowerCase(),
            phoneNumber: phoneNumber.trim() || null,
            customerName: customerName.trim(),
            address: address.trim() || null,
            role: 0, // 0 = Customer
            gender,
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

    const renderInputField = (
        field: string,
        value: string,
        placeholder: string,
        icon: string,
        options: any = {}
    ) => {
        const hasError = touched[field] && errors[field];
        const isRequired = placeholder.includes('(*)');

        return (
            <View style={styles.fieldContainer}>
                <View style={[
                    styles.inputContainer,
                    hasError && styles.inputContainerError
                ]}>
                    <Ionicons 
                        name={icon as any} 
                        size={22} 
                        color={hasError ? '#E74C3C' : '#7f8c8d'} 
                        style={styles.inputIcon} 
                    />
                    <TextInput
                        style={[styles.input, hasError && styles.inputError]}
                        value={value}
                        onChangeText={(text) => handleFieldChange(field, text)}
                        onBlur={() => handleFieldBlur(field)}
                        placeholder={placeholder}
                        placeholderTextColor="#BDC3C7"
                        autoCapitalize="none"
                        editable={!loading}
                        {...options}
                    />
                    {field === 'password' && (
                        <TouchableOpacity 
                            onPress={() => setShowPassword((prev) => !prev)} 
                            disabled={loading}
                            style={styles.eyeButton}
                        >
                            <Ionicons 
                                name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                                size={22} 
                                color="#7f8c8d" 
                            />
                        </TouchableOpacity>
                    )}
                    {field === 'confirmPassword' && (
                        <TouchableOpacity 
                            onPress={() => setShowConfirmPassword((prev) => !prev)} 
                            disabled={loading}
                            style={styles.eyeButton}
                        >
                            <Ionicons 
                                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} 
                                size={22} 
                                color="#7f8c8d" 
                            />
                        </TouchableOpacity>
                    )}
                </View>
                {hasError && (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle-outline" size={16} color="#E74C3C" />
                        <Text style={styles.errorText}>{errors[field]}</Text>
                    </View>
                )}
                {isRequired && !hasError && touched[field] && (
                    <View style={styles.successContainer}>
                        <Ionicons name="checkmark-circle-outline" size={16} color="#27AE60" />
                        <Text style={styles.successText}>Hợp lệ</Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <GradientBackground>
            <KeyboardAvoidingView 
                style={styles.container} 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <SafeAreaView style={styles.safeArea}>
                    <ScrollView 
                        contentContainerStyle={styles.scrollView}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Header */}
                        <View style={styles.header}>
                            <TouchableOpacity 
                                onPress={() => navigation.goBack()} 
                                style={styles.backButton}
                                disabled={loading}
                            >
                                <Ionicons name="arrow-back" size={24} color="#2c3e50" />
                            </TouchableOpacity>
                            <View style={styles.headerContent}>
                                <Text style={styles.title}>Tạo tài khoản</Text>
                                <Text style={styles.subtitle}>Điền thông tin để bắt đầu</Text>
                            </View>
                        </View>

                        {/* Form */}
                        <View style={styles.formContainer}>
                            {/* Tên đăng nhập */}
                            {renderInputField(
                                'username',
                                username,
                                'Tên đăng nhập (*)',
                                'person-outline',
                                { autoCapitalize: 'none' }
                            )}
                            
                            {/* Email */}
                            {renderInputField(
                                'email',
                                email,
                                'Email (*)',
                                'mail-outline',
                                { keyboardType: 'email-address', autoCapitalize: 'none' }
                            )}

                            {/* Mật khẩu */}
                            {renderInputField(
                                'password',
                                password,
                                'Mật khẩu (*)',
                                'lock-closed-outline',
                                { secureTextEntry: !showPassword }
                            )}

                            {/* Xác nhận mật khẩu */}
                            {renderInputField(
                                'confirmPassword',
                                confirmPassword,
                                'Xác nhận mật khẩu (*)',
                                'lock-closed-outline',
                                { secureTextEntry: !showConfirmPassword }
                            )}
                            
                            {/* Họ và tên */}
                            {renderInputField(
                                'customerName',
                                customerName,
                                'Họ và tên (*)',
                                'body-outline'
                            )}

                            {/* Số điện thoại */}
                            {renderInputField(
                                'phoneNumber',
                                phoneNumber,
                                'Số điện thoại',
                                'call-outline',
                                { keyboardType: 'phone-pad' }
                            )}

                            {/* Địa chỉ */}
                            {renderInputField(
                                'address',
                                address,
                                'Địa chỉ',
                                'location-outline'
                            )}

                            {/* Giới tính */}
                            <View style={styles.fieldContainer}>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="male-female-outline" size={22} color="#7f8c8d" style={styles.inputIcon} />
                                    <Picker
                                        selectedValue={gender}
                                        style={styles.picker}
                                        onValueChange={(itemValue: number) => setGender(itemValue)}
                                        enabled={!loading}
                                    >
                                        <Picker.Item label="Nam" value={0} />
                                        <Picker.Item label="Nữ" value={1} />
                                    </Picker>
                                </View>
                            </View>

                            {/* Register Button */}
                            <TouchableOpacity 
                                style={[
                                    styles.registerButton,
                                    loading && styles.registerButtonDisabled
                                ]} 
                                onPress={handleRegister} 
                                disabled={loading}
                            >
                                {loading ? (
                                    <View style={styles.loadingContainer}>
                                        <ActivityIndicator color="white" size="small" />
                                        <Text style={styles.loadingText}>Đang xử lý...</Text>
                                    </View>
                                ) : (
                                    <View style={styles.buttonContent}>
                                        <Ionicons name="person-add-outline" size={20} color="white" />
                                        <Text style={styles.registerButtonText}>Đăng ký</Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            {/* Login Link */}
                            <TouchableOpacity 
                                onPress={() => navigation.goBack()} 
                                disabled={loading}
                                style={styles.loginLink}
                            >
                                <Text style={styles.switchText}>
                                    Đã có tài khoản? 
                                    <Text style={styles.switchTextBold}> Đăng nhập</Text>
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </SafeAreaView>
            </KeyboardAvoidingView>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: { 
        flex: 1 
    },
    scrollView: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    
    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
        paddingTop: 20,
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        marginRight: 16,
    },
    headerContent: {
        flex: 1,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#2c3e50',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: '#7f8c8d',
    },
    
    // Form
    formContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
    },
    
    // Field Container
    fieldContainer: {
        marginBottom: 20,
    },
    
    // Input Container
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: '#e9ecef',
        minHeight: 56,
    },
    inputContainerError: {
        borderColor: '#E74C3C',
        backgroundColor: '#fdf2f2',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#2c3e50',
        paddingVertical: 12,
    },
    inputError: {
        color: '#E74C3C',
    },
    eyeButton: {
        padding: 8,
    },
    
    // Picker
    picker: {
        flex: 1,
        height: 50,
        color: '#2c3e50',
    },
    
    // Error & Success Messages
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        paddingLeft: 4,
    },
    errorText: {
        color: '#E74C3C',
        fontSize: 14,
        marginLeft: 6,
        fontWeight: '500',
    },
    successContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        paddingLeft: 4,
    },
    successText: {
        color: '#27AE60',
        fontSize: 14,
        marginLeft: 6,
        fontWeight: '500',
    },
    
    // Register Button
    registerButton: {
        backgroundColor: '#007bff',
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
        shadowColor: '#007bff',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
    },
    registerButtonDisabled: {
        backgroundColor: '#BDC3C7',
        shadowOpacity: 0.1,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    registerButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
        marginLeft: 8,
        letterSpacing: 0.5,
    },
    
    // Loading
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    loadingText: {
        color: 'white',
        fontSize: 16,
        marginLeft: 8,
        fontWeight: '600',
    },
    
    // Login Link
    loginLink: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    switchText: {
        fontSize: 16,
        color: '#7f8c8d',
        textAlign: 'center',
    },
    switchTextBold: {
        fontWeight: '700',
        color: '#007bff',
    },
}); 