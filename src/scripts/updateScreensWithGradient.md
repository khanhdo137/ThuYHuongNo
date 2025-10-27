# Hướng dẫn cập nhật Gradient Background cho tất cả Screens

## Các bước thực hiện cho mỗi screen:

### 1. Import GradientBackground
Thêm import vào đầu file:
```typescript
import GradientBackground from '../components/GradientBackground';
```

### 2. Wrap component với GradientBackground
Thay đổi từ:
```typescript
return (
  <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
    {/* Content */}
  </SafeAreaView>
);
```

Thành:
```typescript
return (
  <GradientBackground>
    <SafeAreaView style={{ flex: 1 }}>
      {/* Content */}
    </SafeAreaView>
  </GradientBackground>
);
```

### 3. Loại bỏ backgroundColor cứng
- Xóa `backgroundColor: '#f5f5f5'` hoặc các màu cứng khác
- Hoặc đổi thành `backgroundColor: 'transparent'` nếu cần

## Danh sách Screens cần cập nhật:

- [x] HomeScreen.tsx ✅
- [ ] ProfileScreen.tsx
- [ ] BookingScreen.tsx
- [ ] MyPetsScreen.tsx
- [ ] LoginScreen.tsx
- [ ] RegisterScreen.tsx
- [ ] ContactScreen.tsx
- [ ] ChatBotScreen.tsx
- [ ] DirectConsultationScreen.tsx
- [ ] NotificationScreen.tsx
- [ ] MyAppointmentsScreen.tsx
- [ ] AppointmentDetailScreen.tsx
- [ ] MedicalHistoryScreen.tsx
- [ ] NewsDetailScreen.tsx
- [ ] ServiceDetailScreen.tsx
- [ ] ReviewScreen.tsx

## Lưu ý:
- Một số screen có thể có nhiều SafeAreaView hoặc View ở root level
- Đảm bảo GradientBackground wrap toàn bộ component
- Nếu có ScrollView, nó nên nằm bên trong GradientBackground

