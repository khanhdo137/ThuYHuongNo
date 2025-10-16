# React Context API Integration

Dự án này đã được tích hợp với React Context API để quản lý state toàn cục một cách hiệu quả.

## 🏗️ Cấu trúc Context

### 1. **AppContext** - Quản lý state toàn cục
- **File**: `AppContext.tsx`
- **Hook**: `useApp()`
- **Chức năng**:
  - Quản lý trạng thái ứng dụng (loading, online, version)
  - Quản lý thông tin user
  - Các hàm utility (login, logout, updateUser, clearStorage)

### 2. **AuthContext** - Quản lý xác thực
- **File**: `AuthContext.tsx`
- **Hook**: `useAuth()`
- **Chức năng**:
  - Đăng nhập/đăng xuất
  - Đăng ký tài khoản
  - Cập nhật profile
  - Đổi mật khẩu
  - Refresh token

### 3. **ThemeContext** - Quản lý theme
- **File**: `ThemeContext.tsx`
- **Hook**: `useTheme()`
- **Chức năng**:
  - Light/Dark/System theme
  - Toggle theme
  - Quản lý màu sắc
  - Lưu trữ theme preference

### 4. **NotificationCountContext** - Quản lý thông báo
- **File**: `NotificationCountContext.tsx`
- **Hook**: `useNotificationCount()`
- **Chức năng**:
  - Đếm số thông báo
  - Cập nhật số lượng thông báo

## 🚀 Cách sử dụng

### Import hooks
```typescript
import { useApp, useAuth, useTheme, useNotificationCount } from '../context';
```

### Sử dụng trong component
```typescript
const MyComponent = () => {
  // App state
  const { appState, user, isAuthenticated } = useApp();
  
  // Auth functions
  const { login, logout, error, isLoading } = useAuth();
  
  // Theme
  const { theme, toggleTheme, setThemeMode } = useTheme();
  
  // Notifications
  const { count, setCount } = useNotificationCount();
  
  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      <Text style={{ color: theme.colors.text }}>
        Hello {user?.username}
      </Text>
    </View>
  );
};
```

## 📱 Ví dụ thực tế

### Đăng nhập
```typescript
const handleLogin = async () => {
  try {
    await login('username', 'password');
    // Đăng nhập thành công
  } catch (error) {
    // Xử lý lỗi
    console.error('Login failed:', error);
  }
};
```

### Thay đổi theme
```typescript
const handleThemeChange = async () => {
  try {
    await setThemeMode('dark'); // 'light', 'dark', 'system'
    // Hoặc toggle
    await toggleTheme();
  } catch (error) {
    console.error('Theme change failed:', error);
  }
};
```

### Cập nhật thông báo
```typescript
const handleNotificationUpdate = () => {
  setCount(count + 1);
};
```

## 🎨 Theme Colors

### Light Theme
- Primary: `#42A5F5`
- Secondary: `#FF6B9D`
- Background: `#FFFFFF`
- Text: `#212121`

### Dark Theme
- Primary: `#64B5F6`
- Secondary: `#FF8A9B`
- Background: `#121212`
- Text: `#FFFFFF`

## 🔧 Cấu hình

### App.tsx
```typescript
export default function App() {
  return (
    <AppProvider>
      <ThemeProvider>
        <AuthProvider>
          <NotificationCountProvider>
            <SafeAreaProvider>
              <ThemedApp />
            </SafeAreaProvider>
          </NotificationCountProvider>
        </AuthProvider>
      </ThemeProvider>
    </AppProvider>
  );
}
```

## 📦 Dependencies

- `@react-native-async-storage/async-storage` - Lưu trữ local
- `react-native-paper` - UI components
- `react-native-safe-area-context` - Safe area handling

## 🎯 Lợi ích

1. **State Management**: Quản lý state toàn cục dễ dàng
2. **Type Safety**: Full TypeScript support
3. **Performance**: Optimized với React.memo và useMemo
4. **Persistence**: Tự động lưu trữ state
5. **Theme Support**: Dark/Light mode
6. **Error Handling**: Xử lý lỗi toàn diện

## 🔄 Migration từ Redux

Nếu bạn đang sử dụng Redux, có thể dễ dàng migrate:

1. Thay thế `useSelector` bằng custom hooks
2. Thay thế `useDispatch` bằng context functions
3. Loại bỏ Redux store và reducers
4. Sử dụng AsyncStorage thay vì Redux Persist

## 📝 Best Practices

1. **Sử dụng custom hooks** thay vì useContext trực tiếp
2. **Error boundaries** cho error handling
3. **Loading states** cho UX tốt hơn
4. **TypeScript** cho type safety
5. **AsyncStorage** cho persistence
