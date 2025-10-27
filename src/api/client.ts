// This file will configure the Axios client.
// For example:
//
// import axios from 'axios';
//
// const client = axios.create({
//   baseURL: 'https://api.example.com',
//   timeout: 1000,
//   headers: {'X-Custom-Header': 'foobar'}
// });
//
// export default client; 

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// API URL, sử dụng IP thật để kết nối với API đang chạy

export const API_BASE_URL = 'http://192.168.1.33:5074/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// You can also add interceptors here for handling tokens, errors, etc.
// For example:
// client.interceptors.request.use(async (config) => {
//   const token = await AsyncStorage.getItem('userToken');
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

client.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      if (!config.headers) {
        config.headers = new axios.AxiosHeaders();
      }
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default client; 