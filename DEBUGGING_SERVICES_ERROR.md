# Hướng dẫn Debug lỗi "Xem dịch vụ đã sử dụng"

## Lỗi hiện tại
- **Status Code**: 404 (Not Found)
- **Nghĩa là**: Backend không tìm thấy endpoint `/api/Appointment/pet/{petId}`

## Các bước kiểm tra

### 1. Kiểm tra Backend đã rebuild chưa

**Backend PHẢI được rebuild** sau khi thêm endpoint mới!

```bash
# Dừng backend nếu đang chạy (Ctrl + C)

# Chuyển vào thư mục backend
cd ThuYBinhDuongAPI

# Build lại project
dotnet build

# Chạy lại backend
dotnet run
```

### 2. Xác nhận endpoint có sẵn

Sau khi backend chạy, kiểm tra Swagger UI:
- Mở trình duyệt: `http://192.168.1.27:5074/swagger`
- Tìm endpoint: **GET /api/Appointment/pet/{petId}**
- Nếu KHÔNG thấy endpoint này → Backend chưa build với code mới

### 3. Test endpoint trực tiếp với Postman/Browser

**Lấy token từ app:**
```javascript
// Trong React Native console, chạy:
import AsyncStorage from '@react-native-async-storage/async-storage';
AsyncStorage.getItem('token').then(token => console.log('Token:', token));
```

**Test với Postman:**
```
GET http://192.168.1.27:5074/api/Appointment/pet/1?onlyCompleted=true
Headers:
  Authorization: Bearer <YOUR_TOKEN_HERE>
```

### 4. Kiểm tra Mobile App logs

Sau khi thử lại, kiểm tra console logs:

```
=== FETCHING USED SERVICES ===
Pet ID: <số>
Full endpoint: /Appointment/pet/<số>?onlyCompleted=true
Base URL: http://192.168.1.27:5074/api
Full URL: http://192.168.1.27:5074/api/Appointment/pet/<số>?onlyCompleted=true
```

Nếu thấy **404**, có 2 khả năng:
1. Backend chưa rebuild → Làm bước 1
2. IP/Port sai → Kiểm tra backend đang chạy ở port nào

### 5. Các lỗi có thể gặp

#### Lỗi 404 - Not Found
- **Nguyên nhân**: Backend chưa có endpoint mới
- **Giải pháp**: Rebuild backend (bước 1)

#### Lỗi 401 - Unauthorized  
- **Nguyên nhân**: Token hết hạn hoặc không hợp lệ
- **Giải pháp**: Đăng xuất và đăng nhập lại

#### Lỗi 400 - Bad Request
- **Nguyên nhân**: Pet không thuộc về user hiện tại
- **Giải pháp**: Kiểm tra petId và customerId trong database

#### Lỗi Empty Array (không lỗi nhưng rỗng)
- **Nguyên nhân**: Pet chưa có appointment với status = 2 (Completed)
- **Giải pháp**: 
  1. Tạo appointment cho pet
  2. Admin cập nhật status thành 2 (Completed)
  3. Thử lại

### 6. Kiểm tra Database

Nếu backend chạy OK nhưng trả về array rỗng:

```sql
-- Kiểm tra pet có thuộc về customer không
SELECT p.pet_id, p.name, p.customer_id, c.customer_name
FROM pet p
JOIN customer c ON p.customer_id = c.customer_id
WHERE p.pet_id = <YOUR_PET_ID>;

-- Kiểm tra appointments của pet
SELECT a.appointment_id, a.pet_id, a.status, s.name as service_name,
       a.appointment_date, a.appointment_time
FROM appointment a
JOIN service s ON a.service_id = s.service_id
WHERE a.pet_id = <YOUR_PET_ID>;

-- Kiểm tra appointments đã hoàn thành
SELECT * FROM appointment 
WHERE pet_id = <YOUR_PET_ID> AND status = 2;
```

### 7. Test flow hoàn chỉnh

1. **Đăng nhập** với tài khoản customer
2. **Tạo pet** nếu chưa có
3. **Tạo appointment** cho pet đó
4. **Admin đổi status** appointment thành 2 (Completed)
5. **Thử lại** "Xem dịch vụ đã sử dụng"

## Code Changes Summary

### Backend (AppointmentController.cs)
Đã thêm endpoint mới:
```csharp
[HttpGet("pet/{petId}")]
[AuthorizeRole(0)] // Chỉ khách hàng
public async Task<ActionResult<IEnumerable<AppointmentResponseDto>>> GetAppointmentsByPet(
    int petId, 
    [FromQuery] bool onlyCompleted = false)
```

### Frontend (MyPetsScreen.tsx)
Gọi endpoint mới:
```typescript
const response = await apiClient.get(`/Appointment/pet/${petId}?onlyCompleted=true`);
```

## Kết luận

**Bước quan trọng nhất**: REBUILD BACKEND!

Nếu vẫn lỗi sau khi rebuild, check console logs và cho tôi biết:
1. Full URL được gọi
2. Status code
3. Response data (nếu có)
4. Token có trong headers không

