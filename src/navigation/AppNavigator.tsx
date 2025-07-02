import ChatBotScreen from '@/screens/ChatBotScreen';
import LoginScreen from '@/screens/LoginScreen';
import MyPetsScreen from '@/screens/MyPetsScreen';
import RegisterScreen from '@/screens/RegisterScreen';
import ServiceDetailScreen from '@/screens/ServiceDetailScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import TabNavigator from './TabNavigator';
import NewsDetailScreen from '@/screens/NewsDetailScreen';

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
        </Stack.Navigator>
    );
} 