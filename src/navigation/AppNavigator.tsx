import ChatBotScreen from '@/screens/ChatBotScreen';
import LoginScreen from '@/screens/LoginScreen';
import MedicalHistoryScreen from '@/screens/MedicalHistoryScreen';
import MyAppointmentsScreen from '@/screens/MyAppointmentsScreen';
import MyPetsScreen from '@/screens/MyPetsScreen';
import NewsDetailScreen from '@/screens/NewsDetailScreen';
import NotificationScreen from '@/screens/NotificationScreen';
import RegisterScreen from '@/screens/RegisterScreen';
import ServiceDetailScreen from '@/screens/ServiceDetailScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import AppointmentDetailScreen from '../screens/AppointmentDetailScreen';
import ReviewScreen from '../screens/ReviewScreen';
import TabNavigator from './TabNavigator';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen name="ChatBot" component={ChatBotScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="MyPets" component={MyPetsScreen} />
            <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} />
            <Stack.Screen name="NewsDetail" component={NewsDetailScreen} />
            <Stack.Screen name="MyAppointments" component={MyAppointmentsScreen} options={{ title: 'Lịch sử & hoạt động' }} />
            <Stack.Screen name="MedicalHistory" component={MedicalHistoryScreen} options={{ title: 'Hồ sơ bệnh án' }} />
            <Stack.Screen name="Notification" component={NotificationScreen} options={{ title: 'Thông báo' }} />
            <Stack.Screen name="Review" component={ReviewScreen} options={{ headerShown: false }} />
            <Stack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} options={{ title: 'Chi tiết lịch hẹn' }} />
        </Stack.Navigator>
    );
} 