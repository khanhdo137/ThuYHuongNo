// IP Address configuration - Thay đổi IP tại đây để sử dụng chung cho toàn bộ app
export const API_IP = '192.168.1.30';
export const API_PORT = '5074';

// API configuration
export const API_CONFIG = {
  BASE_URL: `http://${API_IP}:${API_PORT}/api`,
  TIMEOUT: 10000,
};

// Gemini AI configuration
export const GEMINI_CONFIG = {
  // Trong production, API key nên được lưu trong environment variables
  // Hiện tại để ở đây để dễ sử dụng (không an toàn cho production)
  API_KEY: 'AIzaSyAqjf6H8O2rdLANSMRoN02DkyRUD6wcixY', // API key Gemini
  DEFAULT_MODEL: 'gemini-2.0-flash',
  GENERATION_CONFIG: {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
  }
};

// App configuration
export const APP_CONFIG = {
  NAME: 'Thu Y Hương No',
  VERSION: '1.0.0',
}; 