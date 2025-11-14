import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import apiClient from '../api/client';
import { GEMINI_CONFIG } from '../constants/config';

// Cấu hình cho model
const generation_config = GEMINI_CONFIG.GENERATION_CONFIG;

// Danh sách các model có sẵn
export const AVAILABLE_MODELS = [
    { id: 'gemini-pro', name: 'Gemini Pro' },
    { id: 'gemini-pro-vision', name: 'Gemini Pro Vision' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
];

// Interface cho response từ Gemini
export interface GeminiResponse {
    text: string;
    error?: string;
}

// Interface cho request
export interface GeminiRequest {
    message: string;
    model?: string;
    userContext?: {
        hasPets: boolean;
        recentAppointments: any[];
        preferredServices: string[];
    };
    clinicData?: string;
    userHistory?: string;
}

class GeminiService {
    private genAI: GoogleGenerativeAI | null = null;
    private defaultModel = GEMINI_CONFIG.DEFAULT_MODEL;

    constructor() {
        // API key sẽ được set sau khi khởi tạo
        this.initializeAPI();
    }

    private initializeAPI() {
        // Sử dụng API key từ config
        const apiKey = GEMINI_CONFIG.API_KEY;
        
        if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY_HERE' && apiKey.length > 20) {
            try {
                this.genAI = new GoogleGenerativeAI(apiKey);
                console.log('Gemini API initialized successfully');
            } catch (error) {
                console.error('Failed to initialize Gemini API:', error);
                this.genAI = null;
            }
        } else {
            console.warn('Gemini API key not configured or invalid');
            this.genAI = null;
        }
    }

    // Phương thức để set API key từ bên ngoài
    public setApiKey(apiKey: string) {
        if (apiKey && apiKey.length > 20) {
            try {
                this.genAI = new GoogleGenerativeAI(apiKey);
                console.log('Gemini API key updated successfully');
            } catch (error) {
                console.error('Failed to set Gemini API key:', error);
                this.genAI = null;
            }
        } else {
            console.warn('Invalid API key provided');
            this.genAI = null;
        }
    }

    // Tạo model với cấu hình
    private createModel(modelName: string = this.defaultModel): GenerativeModel | null {
        if (!this.genAI) {
            return null;
        }

        return this.genAI.getGenerativeModel({
            model: modelName,
            generationConfig: generation_config,
        });
    }

    // Phương thức chính để gửi tin nhắn và nhận phản hồi
    public async sendMessage(request: GeminiRequest): Promise<GeminiResponse> {
        try {
            if (!this.genAI) {
                return {
                    text: 'Xin lỗi, API key chưa được cấu hình. Vui lòng liên hệ quản trị viên.',
                    error: 'API_KEY_NOT_CONFIGURED'
                };
            }

            const model = this.createModel(request.model || this.defaultModel);
            if (!model) {
                return {
                    text: 'Xin lỗi, không thể tạo model AI.',
                    error: 'MODEL_CREATION_FAILED'
                };
            }

            // Lấy ngày giờ hiện tại
            const now = new Date();
            const dayOfWeek = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'][now.getDay()];
            const currentDate = `${dayOfWeek}, ngày ${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
            const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            
            // Xây dựng prompt cho AI với context đầy đủ
            const prompt = `
Bạn là Dr. AI - Chatbot tư vấn thú y thông minh của phòng khám Thu Y Hương Nở.

THÔNG TIN THỜI GIAN HIỆN TẠI:
- Ngày: ${currentDate}
- Giờ: ${currentTime}

THÔNG TIN PHÒNG KHÁM:
- Địa chỉ: 235 Đ. Phú Lợi, Khu 4, Thủ Dầu Một, Bình Dương
- Giờ làm việc: 7:00 - 21:00 (Thứ 2 - Chủ nhật)
- Chuyên khoa: Thú y tổng quát, Phẫu thuật, Xét nghiệm

DỮ LIỆU HIỆN TẠI:
${request.clinicData || 'Đang tải dữ liệu...'}

CONTEXT NGƯỜI DÙNG:
${request.userContext ? `
- Có thú cưng: ${request.userContext.hasPets ? 'Có' : 'Chưa có'}
- Lịch hẹn gần đây: ${request.userContext.recentAppointments?.length || 0} cuộc hẹn
- Dịch vụ đã sử dụng: ${request.userContext.preferredServices?.join(', ') || 'Chưa có'}
` : 'Chưa đăng nhập'}

LỊCH SỬ KHÁCH HÀNG:
${request.userHistory || 'Chưa có lịch sử'}

NHIỆM VỤ:
1. Tư vấn chăm sóc thú cưng dựa trên tình huống cụ thể
2. Giới thiệu dịch vụ phù hợp dựa trên lịch sử
3. Hướng dẫn đặt lịch hẹn
4. Trả lời câu hỏi y tế (kèm khuyến cáo khám trực tiếp)
5. Cung cấp thông tin bác sĩ phù hợp
6. Đưa ra gợi ý dựa trên lịch sử sử dụng dịch vụ
7. Trả lời chính xác về lịch hẹn của khách hàng (ngày, giờ, trạng thái)

NGUYÊN TẮC:
- Luôn thân thiện, chuyên nghiệp
- Đưa ra lời khuyên dựa trên dữ liệu thực tế
- Khuyến cáo khám trực tiếp cho vấn đề nghiêm trọng
- Gợi ý dịch vụ cụ thể khi phù hợp
- Trả lời bằng tiếng Việt, ngắn gọn nhưng đầy đủ
- Sử dụng thông tin lịch sử để đưa ra gợi ý cá nhân hóa
- Sử dụng THÔNG TIN THỜI GIAN HIỆN TẠI khi trả lời các câu hỏi về ngày giờ, lịch hẹn, hoặc thời gian
- Khi trả lời về lịch hẹn: LUÔN sử dụng thông tin CHÍNH XÁC từ LỊCH SỬ LỊCH HẸN, bao gồm ngày, giờ cụ thể, bác sĩ, và trạng thái
- Hiểu rõ trạng thái lịch hẹn: "Chờ xác nhận" = chưa duyệt, "Đã xác nhận" = đã được duyệt, "Hoàn thành" = đã khám xong, "Đã hủy" = không còn hiệu lực
- So sánh ngày giờ lịch hẹn với THÔNG TIN THỜI GIAN HIỆN TẠI để xác định lịch đã qua, sắp tới, hay đang diễn ra

QUY TẮC FORMAT CÂU TRẢ LỜI (CỰC KỲ QUAN TRỌNG):
✅ ĐÚNG - Khi liệt kê nhiều items (dịch vụ, thú cưng, lịch hẹn, v.v.):
  • Mỗi item PHẢI xuống dòng riêng
  • Sử dụng số thứ tự hoặc bullet points
  • Có khoảng trống giữa các phần
  
  VÍ DỤ ĐÚNG:
  "Phòng khám có các dịch vụ sau:
  
  1. Khám tổng quát - 200,000đ
  2. Tiêm phòng - 150,000đ
  3. Tắm cắt lông - 180,000đ
  
  Bạn quan tâm dịch vụ nào ạ?"

❌ SAI - KHÔNG viết thành một dòng dài:
  "Phòng khám có các dịch vụ sau: 1. Khám tổng quát - 200,000đ, 2. Tiêm phòng - 150,000đ, 3. Tắm cắt lông - 180,000đ. Bạn quan tâm..."

⭐ CẤU TRÚC CÂU TRẢ LỜI:
- Mở đầu thân thiện (1 dòng)
- [Dòng trống]
- Nội dung chính với items xuống dòng
- [Dòng trống]  
- Kết luận/câu hỏi follow-up

⭐ KHI NÀO CẦN XUỐNG DÒNG:
- Liệt kê ≥2 items → PHẢI xuống dòng
- Các phần khác nhau (giá, mô tả, ghi chú) → xuống dòng
- Sau câu hỏi hoặc lời chào → xuống dòng
- Giữa các đoạn văn → xuống dòng 2 lần

Câu hỏi: ${request.message}

Trả lời:`;

            // Gửi prompt đến API của Google Generative AI
            const chat = model.startChat({
                history: [],
            });

            const result = await chat.sendMessage(prompt);
            const response = await result.response;
            const text = response.text();

            return {
                text: text || 'Xin lỗi, tôi không thể trả lời câu hỏi này lúc này. Vui lòng thử lại sau.'
            };

        } catch (error: any) {
            console.error('Lỗi khi gọi Gemini API:', error);
            
            // Xử lý các loại lỗi khác nhau
            let errorMessage = 'Xin lỗi, hiện tại tôi gặp sự cố kỹ thuật. Vui lòng thử lại sau hoặc liên hệ trực tiếp với phòng khám để được hỗ trợ.';
            let errorCode = 'API_ERROR';
            
            if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('API key')) {
                errorMessage = 'API key không hợp lệ hoặc đã hết hạn. Vui lòng liên hệ quản trị viên để cập nhật API key.';
                errorCode = 'API_KEY_INVALID';
            } else if (error.message?.includes('quota') || error.message?.includes('limit')) {
                errorMessage = 'Đã vượt quá giới hạn sử dụng API. Vui lòng thử lại sau.';
                errorCode = 'QUOTA_EXCEEDED';
            } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
                errorMessage = 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet và thử lại.';
                errorCode = 'NETWORK_ERROR';
            }
            
            return {
                text: errorMessage,
                error: errorCode
            };
        }
    }

    // Phương thức để kiểm tra xem service có sẵn sàng không
    public isReady(): boolean {
        return this.genAI !== null;
    }

    // Phương thức để lấy danh sách model
    public getAvailableModels() {
        return AVAILABLE_MODELS;
    }
}

// Hàm lấy toàn bộ dịch vụ và trả về chuỗi mô tả cho prompt
export async function fetchAllServicesForPrompt(): Promise<string> {
    try {
        const response = await apiClient.get('/Service');
        const services = response.data.data || response.data;
        if (!Array.isArray(services) || services.length === 0) return '';
        // Format: Tên dịch vụ: mô tả (giá, thời lượng)
        return services.map((s: any, idx: number) => {
            let line = `${idx + 1}. ${s.name || s.displayText || 'Dịch vụ'}: ${s.description || ''}`;
            if (s.priceText) line += ` (Giá: ${s.priceText})`;
            if (s.durationText) line += ` (Thời lượng: ${s.durationText})`;
            return line;
        }).join('\n');
    } catch (error) {
        console.error('Lỗi khi lấy danh sách dịch vụ:', error);
        return '';
    }
}

// Hàm lấy dữ liệu phòng khám đầy đủ cho prompt
export async function fetchClinicDataForPrompt(): Promise<string> {
    try {
        const [servicesRes, doctorsRes, newsRes] = await Promise.all([
            apiClient.get('/Service'),
            apiClient.get('/Doctor'), 
            apiClient.get('/News?limit=5')
        ]);

        let contextData = '';

        // Services
        const services = servicesRes.data.data || servicesRes.data;
        if (services?.length > 0) {
            contextData += 'DỊCH VỤ CỦA PHÒNG KHÁM:\n';
            contextData += services.map((s: any, idx: number) => {
                let line = `${idx + 1}. ${s.name || s.displayText || 'Dịch vụ'}: ${s.description || ''}`;
                if (s.priceText) line += ` (Giá: ${s.priceText})`;
                if (s.durationText) line += ` (Thời lượng: ${s.durationText})`;
                return line;
            }).join('\n') + '\n\n';
        }

        // Doctors
        const doctors = doctorsRes.data;
        if (doctors?.length > 0) {
            contextData += 'BÁC SĨ CỦA PHÒNG KHÁM:\n';
            contextData += doctors.map((d: any, idx: number) => 
                `${idx + 1}. ${d.fullName}: ${d.specialization || 'Thú y tổng quát'} - ${d.branch || 'Chi nhánh chính'}`
            ).join('\n') + '\n\n';
        }

        // Recent News
        const news = newsRes.data.news || newsRes.data;
        if (news?.length > 0) {
            contextData += 'TIN TỨC GẦN ĐÂY:\n';
            contextData += news.slice(0, 3).map((n: any, idx: number) => 
                `${idx + 1}. ${n.title}: ${n.content?.substring(0, 100)}...`
            ).join('\n') + '\n\n';
        }

        return contextData;
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu phòng khám:', error);
        return '';
    }
}

// Hàm lấy lịch sử dịch vụ của user
export async function fetchUserServiceHistory(): Promise<string> {
    try {
        const token = await import('@react-native-async-storage/async-storage').then(m => m.default.getItem('token'));
        if (!token) return '';

        const [appointmentsRes, petsRes] = await Promise.all([
            apiClient.get('/Appointment?limit=50'), // Tăng lên 50 để AI có đủ thông tin lịch sử
            apiClient.get('/Pet')
        ]);

        let historyData = '';

        // Pet info
        const pets = petsRes.data;
        if (pets?.length > 0) {
            historyData += 'THÚ CƯNG CỦA KHÁCH HÀNG:\n';
            historyData += pets.map((p: any, idx: number) => 
                `${idx + 1}. ${p.name} (${p.species || 'Không xác định'}) - ${p.age ? `${p.age} tuổi` : 'Tuổi chưa xác định'}`
            ).join('\n') + '\n\n';
        }

        // Appointment history
        const appointments = appointmentsRes.data.appointments || appointmentsRes.data;
        if (appointments?.length > 0) {
            historyData += 'LỊCH SỬ LỊCH HẸN:\n';
            historyData += appointments.map((a: any, idx: number) => {
                const statusText = a.status === 0 ? 'Chờ xác nhận' : 
                                 a.status === 1 ? 'Đã xác nhận (đã được duyệt)' : 
                                 a.status === 2 ? 'Hoàn thành' : 
                                 a.status === 3 ? 'Đã hủy' : 'Không rõ';
                
                // Format ngày giờ đầy đủ
                let dateTimeStr = '';
                if (a.appointmentDate) {
                    // Chuyển đổi format ngày nếu cần (từ yyyy-MM-dd sang dd/MM/yyyy)
                    let formattedDate = a.appointmentDate;
                    if (a.appointmentDate.includes('-')) {
                        const [yyyy, mm, dd] = a.appointmentDate.split('-');
                        formattedDate = `${dd}/${mm}/${yyyy}`;
                    }
                    dateTimeStr = `Ngày ${formattedDate}`;
                    if (a.appointmentTime) {
                        dateTimeStr += ` lúc ${a.appointmentTime}`;
                    }
                }
                
                // Thông tin bác sĩ
                const doctorInfo = a.doctorName ? ` - Bác sĩ: ${a.doctorName}` : '';
                
                // Ghi chú
                const notesInfo = a.notes ? ` - Ghi chú: ${a.notes}` : '';
                
                return `${idx + 1}. ${a.serviceName || 'Dịch vụ'} cho ${a.petName || 'thú cưng'} - ${dateTimeStr}${doctorInfo} (Trạng thái: ${statusText})${notesInfo}`;
            }).join('\n') + '\n\n';
        }

        return historyData;
    } catch (error) {
        console.error('Lỗi khi lấy lịch sử user:', error);
        return '';
    }
}

// Export singleton instance
export const geminiService = new GeminiService();
export default geminiService; 