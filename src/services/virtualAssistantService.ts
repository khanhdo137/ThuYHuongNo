import apiClient from '../api/client';
import geminiService, { fetchUserServiceHistory, fetchClinicDataForPrompt } from './geminiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AssistantSuggestion {
    id: string;
    message: string;
    actionType?: 'book_appointment' | 'view_service' | 'view_appointment' | 'dismiss';
    actionData?: any;
    priority: 'high' | 'medium' | 'low';
}

export interface SituationContext {
    screen: string;
    hasRecentAppointments: boolean;
    hasUpcomingAppointments: boolean;
    completedAppointments: any[];
    followUpDates: Array<{ date: string; serviceName: string; petName: string }>;
    lastServiceDate?: string;
    primaryPetName?: string;
    pets?: Array<{ id?: number | string; name?: string }>;
    weatherInfo?: any;
    customerId?: number;
}

class VirtualAssistantService {
    private readonly STORAGE_KEY = '@virtual_assistant_dismissed';
    private readonly STORAGE_KEY_TODAY = '@virtual_assistant_dismissed_today';
    // Store last suggested id per customer or global to rotate suggestions
    private readonly STORAGE_LAST_SUGGESTION_PREFIX = '@virtual_assistant_last_suggestion_';
    // Cached clinic services to build dynamic rules
    private cachedServices: any[] | null = null;

    /**
     * Kiểm tra xem trợ lý có bị tắt không
     */
    async isDismissed(): Promise<boolean> {
        try {
            const dismissed = await AsyncStorage.getItem(this.STORAGE_KEY);
            return dismissed === 'true';
        } catch {
            return false;
        }
    }

    /**
     * Kiểm tra xem trợ lý có bị ẩn hôm nay không
     */
    async isDismissedToday(): Promise<boolean> {
        try {
            const dismissedToday = await AsyncStorage.getItem(this.STORAGE_KEY_TODAY);
            if (!dismissedToday) return false;
            
            const dismissedDate = new Date(dismissedToday);
            const today = new Date();
            return dismissedDate.toDateString() === today.toDateString();
        } catch {
            return false;
        }
    }

    /**
     * Tắt trợ lý vĩnh viễn
     */
    async dismissPermanently(): Promise<void> {
        await AsyncStorage.setItem(this.STORAGE_KEY, 'true');
    }

    /**
     * Ẩn trợ lý hôm nay
     */
    async dismissToday(): Promise<void> {
        const today = new Date().toISOString();
        await AsyncStorage.setItem(this.STORAGE_KEY_TODAY, today);
    }

    /**
     * Bật lại trợ lý
     */
    async enable(): Promise<void> {
        await AsyncStorage.removeItem(this.STORAGE_KEY);
        await AsyncStorage.removeItem(this.STORAGE_KEY_TODAY);
    }

    /**
     * Lấy KNN recommendations từ backend
     */
    async getKNNRecommendations(customerId: number): Promise<any[]> {
        try {
            const response = await apiClient.get(`/Service/recommendations/${customerId}`);
            return response.data || [];
        } catch (error) {
            console.error('Error getting KNN recommendations:', error);
            return [];
        }
    }

    private async getStoredLastSuggestion(keySuffix: string): Promise<string | null> {
        try {
            return await AsyncStorage.getItem(this.STORAGE_LAST_SUGGESTION_PREFIX + keySuffix);
        } catch {
            return null;
        }
    }

    private async setStoredLastSuggestion(keySuffix: string, id: string): Promise<void> {
        try {
            await AsyncStorage.setItem(this.STORAGE_LAST_SUGGESTION_PREFIX + keySuffix, id);
        } catch {}
    }

    /**
     * Choose next recommendation from a list, rotating to avoid repeated suggestions.
     */
    private async pickNextFromList(keySuffix: string, items: any[], idFn: (it: any)=>string): Promise<any | null> {
        if (!items || items.length === 0) return null;
        const lastId = await this.getStoredLastSuggestion(keySuffix);
        // If lastId not present, choose first
        let idx = 0;
        if (lastId) {
            const lastIndex = items.findIndex(i => idFn(i) === lastId);
            if (lastIndex >= 0) {
                idx = (lastIndex + 1) % items.length;
            } else {
                // randomize a bit to prefer top ones
                idx = 0;
            }
        }
        const chosen = items[idx];
        try { await this.setStoredLastSuggestion(keySuffix, idFn(chosen)); } catch {}
        return chosen;
    }



    /**
     * Phân tích tình huống và tạo gợi ý
     */
    async analyzeSituation(screen: string, customerId?: number): Promise<SituationContext | null> {
        try {
            // Lấy appointments của user
            const appointmentsRes = await apiClient.get('/Appointment?limit=50');
            const appointments = appointmentsRes.data.appointments || appointmentsRes.data || [];
            
            const now = new Date();
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

            // Lọc appointments
            const recentAppointments = appointments.filter((apt: any) => {
                const aptDate = new Date(`${apt.appointmentDate} ${apt.appointmentTime}`);
                return aptDate >= sevenDaysAgo && apt.status === 2; // Hoàn thành
            });

            const upcomingAppointments = appointments.filter((apt: any) => {
                const aptDate = new Date(`${apt.appointmentDate} ${apt.appointmentTime}`);
                return aptDate >= now && (apt.status === 0 || apt.status === 1);
            });

            const completedAppointments = appointments.filter((apt: any) => apt.status === 2);

            // Tìm follow-up dates từ MedicalHistory (không có endpoint reliable),
            // thay vào đó lấy danh sách thú cưng và tham chiếu từ appointments nếu có.
            const followUpDates: Array<{ date: string; serviceName: string; petName: string }> = [];

            // Lấy thông tin pets của user để hiển thị tên thú cưng trong gợi ý
            let primaryPetName: string | undefined = undefined;
            const petsList: Array<{ id?: number | string; name?: string }> = [];
            try {
                const petsRes = await apiClient.get('/Pet');
                const pets = petsRes.data;
                if (Array.isArray(pets) && pets.length > 0) {
                    for (const p of pets) {
                        const name = p.name || p.Name || p.petName || undefined;
                        const id = p.id ?? p.petId ?? p.PetId ?? undefined;
                        if (name) {
                            petsList.push({ id, name });
                        }
                    }
                    primaryPetName = petsList[0]?.name;
                }
            } catch (err) {
                // Nếu không lấy được pets thì bỏ qua
            }

            // Fallback: nếu không có pets từ endpoint, lấy tên thú cưng từ appointments nếu có
            if (petsList.length === 0 && Array.isArray(appointments) && appointments.length > 0) {
                const foundNames = new Set<string>();
                for (const a of appointments) {
                    const nm = a.pet?.name || a.petName || a.pet?.Name || a.petName;
                    if (nm) foundNames.add(nm);
                }
                for (const nm of Array.from(foundNames)) {
                    petsList.push({ name: nm });
                }
                if (petsList.length > 0) primaryPetName = petsList[0].name;
            }

            return {
                screen,
                hasRecentAppointments: recentAppointments.length > 0,
                hasUpcomingAppointments: upcomingAppointments.length > 0,
                completedAppointments,
                followUpDates,
                lastServiceDate: completedAppointments.length > 0
                    ? completedAppointments[0].appointmentDate
                    : undefined,
                primaryPetName,
                pets: petsList,
                weatherInfo: undefined,
                customerId
            };
        } catch (error) {
            console.error('Error analyzing situation:', error);
            return null;
        }
    }

    /**
     * Helper: tìm lần sử dụng dịch vụ gần nhất matching tên hoặc từ khóa
     * Trả về { serviceName, date, daysSince } hoặc null
     */
    private getLastServiceInfo(context: SituationContext, keywords: string[] | string): { serviceName: string; date: string; daysSince: number } | null {
        const kwds = Array.isArray(keywords) ? keywords : [keywords];
        const completed = context.completedAppointments || [];
        // tìm appointment khớp tên dịch vụ
        for (const apt of completed) {
            const svc = (apt.serviceName || apt.ServiceName || apt.service?.name || apt.service?.serviceName || '').toLowerCase();
            if (!svc) continue;
            for (const k of kwds) {
                if (svc.includes(k.toLowerCase())) {
                    const dateStr = apt.appointmentDate || apt.date || apt.completedAt || apt.appointmentDate;
                    if (!dateStr) continue;
                    const date = new Date(dateStr);
                    const daysSince = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
                    return { serviceName: svc, date: dateStr, daysSince };
                }
            }
        }
        return null;
    }

    /**
     * Helper: tìm lần sử dụng dịch vụ gần nhất matching serviceId list
     */
    private getLastServiceInfoByIds(context: SituationContext, serviceIds: Array<number | string>): { serviceName: string; date: string; daysSince: number } | null {
        if (!serviceIds || serviceIds.length === 0) return null;
        const completed = context.completedAppointments || [];
        for (const apt of completed) {
            const sid = apt.serviceId ?? apt.ServiceId ?? apt.service?.id ?? apt.service?.serviceId ?? null;
            if (!sid) continue;
            if (serviceIds.includes(sid)) {
                const dateStr = apt.appointmentDate || apt.date || apt.completedAt || apt.appointmentDate;
                if (!dateStr) continue;
                const date = new Date(dateStr);
                const daysSince = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
                const svcName = apt.serviceName || apt.ServiceName || apt.service?.name || apt.service?.serviceName || '';
                return { serviceName: svcName, date: dateStr, daysSince };
            }
        }
        return null;
    }

    /**
     * Fetch clinic services (dropdown) and cache them for short-term use
     */
    private async fetchClinicServices(): Promise<any[]> {
        if (this.cachedServices) return this.cachedServices;
        try {
            const svcRes = await apiClient.get('/Service/dropdown');
            const services = svcRes.data || svcRes.data?.data || [];
            const arr = Array.isArray(services) ? services : [];
            // filter out surgical-related services
            this.cachedServices = arr.filter((s: any) => {
                const name = (s.serviceName || s.Name || s.name || '').toString().toLowerCase();
                return !this.isSurgicalServiceName(name);
            });
            return this.cachedServices;
        } catch (e) {
            this.cachedServices = [];
            return [];
        }
    }

    /**
     * Check if a service name likely relates to surgery and should be excluded from suggestions
     */
    private isSurgicalServiceName(name: string | undefined | null): boolean {
        if (!name) return false;
        const n = name.toString().toLowerCase();
        const surgicalKeywords = ['phẫu thuật', 'phau thuat', 'phau-thuat', 'surgery', 'surgical', 'operation', 'mổ', 'mổ xẻ', 'mổ-xẻ', 'surg'];
        return surgicalKeywords.some(kw => n.includes(kw));
    }

    /**
     * Build a map of category -> serviceIds based on service names using keyword heuristics.
     * Categories and keywords can be extended.
     */
    private async buildCategoryMap(): Promise<Record<string, number[]>> {
        const services = await this.fetchClinicServices();
        const map: Record<string, number[]> = {
            dermatology: [],
            grooming: [],
            dental: [],
            vaccination: [],
            bath: [],
        };

        const keywords: Record<string, string[]> = {
            dermatology: ['da liễu', 'derma', 'skin', 'da-lieu', 'da_lieu'],
            grooming: ['tỉa lông', 'tỉa', 'groom', 'grooming', 'chải lông'],
            dental: ['răng', 'nha khoa', 'dental', 'cạo vôi', 'răng miệng'],
            vaccination: ['vaccine', 'tiêm', 'vắc xin', 'vaccination'],
            bath: ['tắm', 'bath', 'tắm rửa', 'shower', 'tắm gội'],
        };

        for (const s of services) {
            const name = (s.serviceName || s.Name || s.name || '').toString().toLowerCase();
            const id = s.serviceId ?? s.id ?? s.ServiceId ?? null;
            if (!id) continue;
            for (const cat of Object.keys(keywords)) {
                for (const kw of keywords[cat]) {
                    if (name.includes(kw)) {
                        if (!map[cat].includes(id)) map[cat].push(id);
                    }
                }
            }
        }

        return map;
    }

    /**
     * Tạo gợi ý dựa trên tình huống
     */
    async generateSuggestion(context: SituationContext, opts?: { rotate?: boolean }): Promise<AssistantSuggestion | null> {
        // Build petName fallback from context or followUp/completed appointments
        const defaultPetName = context.primaryPetName || (context.followUpDates && context.followUpDates.length > 0 ? context.followUpDates[0].petName : undefined) || (context.completedAppointments && context.completedAppointments.length > 0 ? context.completedAppointments[0].petName : undefined);
    // Build an array of pet names (unique) to cycle through in rotating suggestions
        const petNames: string[] = [];
        if (Array.isArray(context.pets)) {
            for (const p of context.pets) {
                if (p?.name && !petNames.includes(p.name)) petNames.push(p.name);
            }
        }
        if (defaultPetName && !petNames.includes(defaultPetName)) petNames.unshift(defaultPetName);
        // fallback to empty array if no names
    const petCount = petNames.length || 0;
    // keep old variable `petName` for backward compatibility in existing rules
    const petName = defaultPetName;

        // Helper to format final message: pet name + reason + question
        const makeMessage = (pet: string | undefined, reason: string, serviceLabel?: string) => {
            const petPart = pet ? `${pet} - ` : '';
            const servicePart = serviceLabel ? ` ${serviceLabel}` : '';
            return `${petPart}${reason}.${servicePart} Bạn có muốn sử dụng dịch vụ không?`;
        };

        // Tình huống 1: Vào trang Home - không có lịch gần đây
        if (!opts?.rotate && context.screen === 'Home' && !context.hasRecentAppointments && !context.hasUpcomingAppointments) {
            const reason = 'Gợi ý kiểm tra sức khỏe định kỳ cho bé';
            return {
                id: 'home_no_appointments',
                message: makeMessage(petName, reason),
                actionType: 'book_appointment',
                actionData: { petName: context.primaryPetName, reason },
                priority: 'high'
            };
        }

        // Tình huống 2: Có follow-up date
        if (!opts?.rotate && context.followUpDates.length > 0) {
            const nextFollowUp = context.followUpDates[0];
            const followUpDate = new Date(nextFollowUp.date);
            const formattedDate = followUpDate.toLocaleDateString('vi-VN');
            const reason = `Cần tái khám ${nextFollowUp.serviceName} vào ${formattedDate}`;
            return {
                id: 'follow_up_reminder',
                message: makeMessage(nextFollowUp.petName || petName, reason, ''),
                actionType: 'view_appointment',
                actionData: { followUpDate: nextFollowUp.date, petName: nextFollowUp.petName, serviceName: nextFollowUp.serviceName, reason },
                priority: 'high'
            };
        }

        // Tình huống 3: Sử dụng KNN recommendations nếu có customerId
        if (!opts?.rotate && context.customerId) {
            const knnRecommendations = await this.getKNNRecommendations(context.customerId);
            const filteredKnn = (Array.isArray(knnRecommendations) ? knnRecommendations : []).filter((r: any) => {
                const svcName = (r.serviceName ?? r.Name ?? r.name ?? '').toString().toLowerCase();
                return !this.isSurgicalServiceName(svcName);
            });
            if (filteredKnn.length > 0) {
                // pick next recommendation in a rotating fashion to avoid repeating the same item
                const chosen = await this.pickNextFromList('cust_' + context.customerId, filteredKnn, (i: any) => String(i.serviceId ?? i.ServiceId ?? i.id ?? i.serviceId));
                const topRecommendation = chosen || filteredKnn[0];
                const svcName = topRecommendation.serviceName ?? topRecommendation.Name ?? topRecommendation.name;
                const reason = `Dựa trên hành vi, đề xuất dịch vụ ${svcName}`;
                return {
                    id: 'knn_recommendation',
                    message: makeMessage(petName, reason, `"${svcName}"`),
                    actionType: 'view_service',
                    actionData: { serviceId: topRecommendation.serviceId ?? topRecommendation.ServiceId ?? topRecommendation.id, serviceName: svcName, reason },
                    priority: 'high'
                };
            }
        }

        // Specific service rule-based suggestions (non-rotate mode) using clinic service categories
        if (!opts?.rotate) {
            const categoryMap = await this.buildCategoryMap();
            const dermInfo = this.getLastServiceInfoByIds(context, categoryMap.dermatology) || this.getLastServiceInfo(context, ['derma', 'da liễu', 'skin', 'dermatology']);
            if (dermInfo && dermInfo.daysSince >= 60) {
                const reason = `Đã ${dermInfo.daysSince} ngày kể từ lần khám da liễu gần nhất`;
                return {
                    id: 'rule_dermatology',
                    message: makeMessage(petName, reason, 'Khám da liễu'),
                    actionType: 'view_service',
                    actionData: { serviceName: 'Khám da liễu', daysSince: dermInfo.daysSince, reason },
                    priority: 'high'
                };
            }

            const groomInfo = this.getLastServiceInfoByIds(context, categoryMap.grooming) || this.getLastServiceInfo(context, ['groom', 'tỉa lông', 'tỉa', 'grooming']);
            if (groomInfo && groomInfo.daysSince >= 90) {
                const reason = `Đã ${groomInfo.daysSince} ngày chưa tỉa lông`;
                return {
                    id: 'rule_grooming',
                    message: makeMessage(petName, reason, 'Tỉa lông'),
                    actionType: 'view_service',
                    actionData: { serviceName: 'Tỉa lông', daysSince: groomInfo.daysSince, reason },
                    priority: 'high'
                };
            }

            const dentalInfo = this.getLastServiceInfoByIds(context, categoryMap.dental) || this.getLastServiceInfo(context, ['dental', 'răng', 'nha khoa', 'cạo vôi']);
            if (dentalInfo && dentalInfo.daysSince >= 180) {
                const reason = `Đã ${dentalInfo.daysSince} ngày chưa kiểm tra răng miệng`;
                return {
                    id: 'rule_dental',
                    message: makeMessage(petName, reason, 'Nha khoa'),
                    actionType: 'view_service',
                    actionData: { serviceName: 'Nha khoa', daysSince: dentalInfo.daysSince, reason },
                    priority: 'high'
                };
            }
        }

        // Tình huống 4: (bỏ gợi ý theo thời tiết tạm thời)

        // Tình huống 5: Lâu rồi chưa sử dụng dịch vụ
        if (!opts?.rotate && context.lastServiceDate) {
            const lastDate = new Date(context.lastServiceDate);
            const daysSince = Math.floor((new Date().getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysSince >= 60) {
                const reason = `Đã ${daysSince} ngày kể từ lần khám gần nhất`;
                return {
                    id: 'long_time_no_service',
                    message: makeMessage(petName, reason),
                    actionType: 'book_appointment',
                    actionData: { daysSince, reason },
                    priority: 'medium'
                };
            }
        }

        // Fallback: Gợi ý mặc định dựa trên màn hình
        if (context.screen === 'Home') {
            // Try to rotate popular clinic services if KNN not available
            try {
                const services = await this.fetchClinicServices();
                if (Array.isArray(services) && services.length > 0) {
                    const chosenService = await this.pickNextFromList('global', services, (i: any) => String(i.serviceId ?? i.ServiceId ?? i.id ?? i.serviceId));
                    if (chosenService && !opts?.rotate) {
                        const reason = `Gợi ý hôm nay: ${chosenService.serviceName ?? chosenService.Name ?? chosenService.name}`;
                        return {
                            id: 'clinic_recommendation',
                            message: `${reason}. Bạn muốn xem chi tiết không?`,
                            actionType: 'view_service',
                            actionData: { serviceId: chosenService.serviceId ?? chosenService.ServiceId ?? chosenService.id, serviceName: chosenService.serviceName ?? chosenService.Name ?? chosenService.name, petName: context.primaryPetName, reason },
                            priority: 'low'
                        };
                    }
                }
            } catch (e) {
                // ignore and fall back to default
            }

            return {
                id: 'default_home',
                message: 'Chào bạn! Mình có thể giúp bạn tìm dịch vụ phù hợp cho thú cưng. Bạn muốn xem dịch vụ nào?',
                actionType: 'view_service',
                actionData: { petName: context.primaryPetName },
                priority: 'low'
            };
        } else if (context.screen === 'Booking') {
            return {
                id: 'default_booking',
                message: 'Bạn đang đặt lịch hẹn? Mình có thể giúp bạn chọn dịch vụ phù hợp!',
                actionType: 'view_service',
                priority: 'low'
            };
        } else if (context.screen === 'MyAppointments') {
            return {
                id: 'default_appointments',
                message: 'Bạn có muốn đặt lịch hẹn mới không?',
                actionType: 'book_appointment',
                priority: 'low'
            };
        }

        // Fallback cuối cùng
        return {
            id: 'default_general',
            message: 'Xin chào! Mình là trợ lý ảo của phòng khám. Mình có thể giúp gì cho bạn?',
            priority: 'low'
        };
    }

    /**
     * Generate a rotating suggestion set for manual refreshes.
     * This collects multiple candidate suggestions and rotates among them to ensure variety.
     */
    async generateRotatingSuggestion(context: SituationContext): Promise<AssistantSuggestion | null> {
        const candidates: AssistantSuggestion[] = [];
        // Build default pet name and list of pet names to cycle through
        const defaultPetName = context.primaryPetName || (context.followUpDates && context.followUpDates.length > 0 ? context.followUpDates[0].petName : undefined) || (context.completedAppointments && context.completedAppointments.length > 0 ? context.completedAppointments[0].petName : undefined);
        const petNames: string[] = [];
        if (Array.isArray(context.pets)) {
            for (const p of context.pets) {
                if (p?.name && !petNames.includes(p.name)) petNames.push(p.name);
            }
        }
        if (defaultPetName && !petNames.includes(defaultPetName)) petNames.unshift(defaultPetName);
        const petCount = petNames.length || 0;
        const petName = defaultPetName; // fallback used in some candidates

        // 1) KNN recommendations (map to candidates)
        if (context.customerId) {
            try {
                const knn = await this.getKNNRecommendations(context.customerId);
                const knnArr = Array.isArray(knn) ? knn : [];
                let knnIdx = 0;
                for (const r of knnArr) {
                    const svcName = (r.serviceName ?? r.Name ?? r.name ?? '').toString();
                    if (this.isSurgicalServiceName(svcName.toLowerCase())) continue; // skip surgical services
                    const chosenPet = petCount > 0 ? petNames[knnIdx % petCount] : defaultPetName;
                    knnIdx += 1;
                    candidates.push({
                        id: `knn_${r.serviceId ?? r.id ?? svcName}`,
                        message: `${chosenPet ? chosenPet + ' - ' : ''}Gợi ý: ${svcName}. Bạn có muốn xem không?`,
                        actionType: 'view_service',
                        actionData: { serviceId: r.serviceId ?? r.id, serviceName: svcName, reason: `Dựa trên hành vi, đề xuất dịch vụ ${svcName}`, petName: chosenPet },
                        priority: 'high'
                    });
                }
            } catch (e) { /* ignore */ }
        }

        // 2) Clinic popular services
        try {
            const services = await this.fetchClinicServices();
                if (Array.isArray(services)) {
                let svcIdx = 0;
                for (const s of services) {
                    const svcName = s.serviceName ?? s.Name ?? s.name;
                    // fetchClinicServices already filters surgical services, but keep a guard
                    if (this.isSurgicalServiceName((svcName ?? '').toString().toLowerCase())) continue;
                    const chosenPet = petCount > 0 ? petNames[svcIdx % petCount] : defaultPetName;
                    svcIdx += 1;
                    candidates.push({
                        id: `svc_${s.serviceId ?? s.id ?? svcName}`,
                        message: `${chosenPet ? chosenPet + ' - ' : ''}Gợi ý hôm nay: ${svcName}. Bạn muốn xem chi tiết không?`,
                        actionType: 'view_service',
                        actionData: { serviceId: s.serviceId ?? s.id, serviceName: svcName, reason: `Gợi ý hôm nay: ${svcName}`, petName: chosenPet },
                        priority: 'low'
                    });
                }
            }
        } catch (e) { /* ignore */ }

        // 3) Time-based candidate (long time no service)
        if (context.lastServiceDate) {
            const lastDate = new Date(context.lastServiceDate);
            const daysSince = Math.floor((new Date().getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
            candidates.push({
                id: `long_${daysSince}`,
                message: `${petName ? petName + ' - ' : ''}Đã ${daysSince} ngày kể từ lần khám gần nhất. Bạn có muốn đặt dịch vụ kiểm tra không?`,
                actionType: 'book_appointment',
                actionData: { daysSince, reason: `Đã ${daysSince} ngày kể từ lần khám gần nhất` },
                priority: 'medium'
            });
        }

        // 3b) Specific service checks (dermatology, grooming, dental) using clinic service categories
        const categoryMap = await this.buildCategoryMap();
        const derm = this.getLastServiceInfoByIds(context, categoryMap.dermatology) || this.getLastServiceInfo(context, ['derma', 'da liễu', 'skin', 'dermatology']);
        if (derm && derm.daysSince >= 60) {
            candidates.unshift({
                id: `derm_${derm.date}`,
                    message: `${petName ? petName + ' - ' : ''}Thú cưng của bạn đã ${derm.daysSince} ngày chưa khám da liễu. Hãy kiểm tra da cho bé nhé. Bạn có muốn đặt dịch vụ da liễu?`,
                    actionType: 'view_service',
                    actionData: { serviceName: 'Khám da liễu', daysSince: derm.daysSince, reason: `Đã ${derm.daysSince} ngày kể từ lần khám da liễu gần nhất` },
                priority: 'high'
            });
        }

        const groom = this.getLastServiceInfoByIds(context, categoryMap.grooming) || this.getLastServiceInfo(context, ['groom', 'tỉa lông', 'tỉa', 'grooming']);
        if (groom && groom.daysSince >= 90) {
            candidates.unshift({
                id: `groom_${groom.date}`,
                    message: `${petName ? petName + ' - ' : ''}Thú cưng của bạn đã ${groom.daysSince} ngày chưa được tỉa lông. Việc tỉa lông giúp giữ vệ sinh và thoải mái cho bé. Bạn có muốn đặt dịch vụ tỉa lông?`,
                    actionType: 'view_service',
                    actionData: { serviceName: 'Tỉa lông', daysSince: groom.daysSince, reason: `Đã ${groom.daysSince} ngày chưa tỉa lông` },
                priority: 'high'
            });
        }

        const dental = this.getLastServiceInfoByIds(context, categoryMap.dental) || this.getLastServiceInfo(context, ['dental', 'răng', 'nha khoa', 'cạo vôi']);
        if (dental && dental.daysSince >= 180) {
            candidates.unshift({
                id: `dental_${dental.date}`,
                    message: `${petName ? petName + ' - ' : ''}Thú cưng của bạn đã ${dental.daysSince} ngày chưa kiểm tra răng miệng. Khám răng định kỳ giúp phòng ngừa bệnh răng miệng. Bạn muốn đặt dịch vụ nha khoa?`,
                    actionType: 'view_service',
                    actionData: { serviceName: 'Nha khoa', daysSince: dental.daysSince, reason: `Đã ${dental.daysSince} ngày chưa kiểm tra răng miệng` },
                priority: 'high'
            });
        }

        // 4) Generic fallbacks
    candidates.push({ id: 'default_1', message: `${petName ? petName + ' - ' : ''}Mình gợi ý kiểm tra sức khỏe định kỳ cho bé. Bạn muốn đặt lịch?`, actionType: 'book_appointment', actionData: { reason: 'Kiểm tra sức khỏe định kỳ' }, priority: 'low' });
    candidates.push({ id: 'default_2', message: `${petName ? petName + ' - ' : ''}Mình có thể giúp chọn dịch vụ phù hợp cho bé. Muốn mình gợi ý?`, actionType: 'view_service', actionData: { reason: 'Gợi ý chọn dịch vụ' }, priority: 'low' });

        if (candidates.length === 0) return null;

        // debug: log candidate ids and messages
        try {
            console.log('VirtualAssistantService: rotating candidates', candidates.map(c => ({ id: c.id, message: c.message })));
        } catch (e) { }

        // rotate using AsyncStorage so repeated refreshes pick the next item
        const keySuffix = `manual_${context.customerId ?? 'global'}`;
        const chosen = await this.pickNextFromList(keySuffix, candidates, (c: any) => c.id);
        return chosen;
    }

    /**
     * Sử dụng Gemini AI để tạo gợi ý thông minh hơn
     */
    async generateAISuggestion(context: SituationContext): Promise<string | null> {
        try {
            if (!geminiService.isReady()) {
                return null;
            }

            const clinicData = await fetchClinicDataForPrompt();
            const userHistory = await fetchUserServiceHistory();

            const prompt = `Bạn là trợ lý ảo thân thiện của phòng khám thú y. Dựa trên tình huống sau, hãy đưa ra 1 câu gợi ý ngắn gọn, thân thiện (tối đa 50 từ):

TÌNH HUỐNG:
- Màn hình hiện tại: ${context.screen}
- Có lịch hẹn gần đây: ${context.hasRecentAppointments ? 'Có' : 'Không'}
- Có lịch hẹn sắp tới: ${context.hasUpcomingAppointments ? 'Có' : 'Không'}
${context.primaryPetName ? `- Thú cưng chính: ${context.primaryPetName}` : ''}
${context.followUpDates.length > 0 ? `- Có ${context.followUpDates.length} lịch tái khám sắp tới` : ''}
${context.lastServiceDate ? `- Lần sử dụng dịch vụ cuối: ${context.lastServiceDate}` : '- Chưa có lịch sử sử dụng dịch vụ'}

LỊCH SỬ KHÁCH HÀNG:
${userHistory || 'Chưa có'}

DỊCH VỤ PHÒNG KHÁM:
${clinicData || 'Đang tải...'}

Hãy đưa ra 1 câu gợi ý ngắn gọn, thân thiện, phù hợp với tình huống. Chỉ trả lời câu gợi ý, không giải thích thêm.`;

            const response = await geminiService.sendMessage({
                message: prompt,
                clinicData,
                userHistory
            });

            return response.text || null;
        } catch (error) {
            console.error('Error generating AI suggestion:', error);
            return null;
        }
    }

    /**
     * Quyết định có nên hiển thị trợ lý không
     */
    async shouldShow(screen: string): Promise<boolean> {
        // Luôn hiển thị trên màn hình Home
        if (screen === 'Home') {
            return true;
        }
        
        // Kiểm tra các trường hợp khác
        if (await this.isDismissed()) {
            return false;
        }

        // Kiểm tra xem có bị ẩn hôm nay không
        if (await this.isDismissedToday()) {
            return false;
        }

        // Chỉ hiển thị ở một số màn hình nhất định
        const allowedScreens = ['Home', 'Booking', 'MyAppointments'];
        return allowedScreens.includes(screen);
    }
}

export const virtualAssistantService = new VirtualAssistantService();
export default virtualAssistantService;

