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

            // Xây dựng prompt cho AI (tương tự như trong Python code)
            const prompt = `
Bạn là một chatbot tư vấn thú y thông minh và hữu ích. Bạn làm việc tại phòng khám thú y Hương Nở.

Nhiệm vụ của bạn:
1. Tư vấn về sức khỏe và chăm sóc thú cưng
2. Giải đáp các thắc mắc về dịch vụ của phòng khám
3. Hướng dẫn cách chăm sóc thú cưng hàng ngày
4. Đưa ra lời khuyên về dinh dưỡng cho thú cưng
5. Hỗ trợ thông tin về lịch làm việc và đặt lịch hẹn

Nguyên tắc trả lời:
- Luôn thân thiện, chuyên nghiệp
- Đưa ra thông tin chính xác và hữu ích
- Nếu không chắc chắn về vấn đề y tế, khuyên chủ thú cưng đến khám trực tiếp
- Trả lời bằng tiếng Việt
- Giữ câu trả lời ngắn gọn nhưng đầy đủ thông tin
- Trả lời bằng văn bản thuần túy, không sử dụng bất kỳ định dạng Markdown nào.
Câu hỏi của khách hàng: ${request.message}

Hãy trả lời một cách hữu ích và chuyên nghiệp:
            `;

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

// Export singleton instance
export const geminiService = new GeminiService();
export default geminiService; 