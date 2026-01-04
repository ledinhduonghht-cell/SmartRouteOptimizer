
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3, delay = 1000): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const waitTime = error?.status === 429 ? delay * Math.pow(2, i) + Math.random() * 1000 : delay;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  throw lastError;
}

export const getSmartRouteAdvice = async (origin: string, destination: string) => {
  try {
    const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Tôi đang lập kế hoạch vận tải tại Hà Nội từ "${origin}" đến "${destination}". 
      Hãy phân tích và đưa ra 1 phương án tối ưu nhất. 
      Hãy liệt kê các cung đường thực tế tại Hà Nội. Trả về kết quả ngắn gọn bằng tiếng Việt.`,
    }));
    return response.text;
  } catch (error) {
    return `Lộ trình từ ${origin} đến ${destination}: Ưu tiên đi trục đường chính để tránh ùn tắc giờ cao điểm tại các nút giao trọng điểm của Hà Nội.`;
  }
};

export const getRouteContextAlerts = async (origin: string, destination: string) => {
  try {
    const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Giả lập các tình huống giao thông thực tế trên lộ trình từ ${origin} đến ${destination} tại Hà Nội. 
      Các tình huống bao gồm: tai nạn, thi công, thời tiết xấu, đường hỏng, hoặc biển cấm xe theo giờ.
      Trả về JSON array: [{"type": "accident"|"construction"|"weather"|"broken_road"|"restriction"|"traffic", "title": string, "location": string, "detail": string, "impact": "low"|"medium"|"high", "distance_mark": number}] 
      (với location là địa danh thực tế tại Hà Nội như "Ngã tư Sở", "Cầu Giấy", "Đê La Thành")`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              title: { type: Type.STRING },
              location: { type: Type.STRING },
              detail: { type: Type.STRING },
              impact: { type: Type.STRING },
              distance_mark: { type: Type.NUMBER }
            },
            required: ["type", "title", "location", "detail", "impact", "distance_mark"]
          }
        }
      }
    }));
    return JSON.parse(response.text || "[]");
  } catch (error) {
    return [
      { type: "traffic", title: "Ùn tắc cục bộ", location: "Nút giao Xuân Thủy", detail: "Mật độ phương tiện tăng cao phía trước", impact: "medium", distance_mark: 0.2 },
      { type: "accident", title: "Va chạm giao thông", location: "Cầu Nhật Tân", detail: "Có vụ va chạm nhẹ, làn trái bị hạn chế", impact: "high", distance_mark: 0.5 },
      { type: "construction", title: "Công trường thi công", location: "Đường Giải Phóng", detail: "Sửa chữa mặt đường, hạn chế tốc độ 20km/h", impact: "medium", distance_mark: 0.8 }
    ];
  }
};

export const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
    const data = await response.json();
    if (data && data.display_name) {
      const parts = data.display_name.split(',');
      return parts.slice(0, 3).join(',').trim();
    }
    return `Tọa độ: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch (error) {
    return `Tọa độ: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
};

export const searchLocations = async (query: string): Promise<any[]> => {
  if (!query || query.length < 2) return [];
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ' Hà Nội')}&limit=5`);
    const data = await response.json();
    return data;
  } catch (error) {
    return [];
  }
};

export const searchHanoiLocationsStructured = async (type: 'charging' | 'bike') => {
  try {
    const query = type === 'charging' ? "15 trạm sạc xe điện VinFast" : "15 trạm xe đạp công cộng TNGo";
    const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Tìm 15 địa điểm thực tế của ${query} tại Hà Nội.
      Trả về kết quả dưới dạng JSON array: [{"name": string, "lat": number, "lng": number, "address": string, "power": string, "slots": string}]`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              lat: { type: Type.NUMBER },
              lng: { type: Type.NUMBER },
              address: { type: Type.STRING },
              power: { type: Type.STRING },
              slots: { type: Type.STRING }
            },
            required: ["name", "lat", "lng", "address", "power", "slots"]
          }
        }
      }
    }));
    return JSON.parse(response.text || "[]");
  } catch (error) {
    // Fallback data mở rộng 15 trạm
    if (type === 'charging') {
      return [
        { name: "VinFast Royal City", lat: 21.0028, lng: 105.8152, address: "72 Nguyễn Trãi, Thanh Xuân", power: "150kW", slots: "2/10" },
        { name: "VinFast Times City", lat: 20.9950, lng: 105.8677, address: "458 Minh Khai, Hai Bà Trưng", power: "60kW", slots: "4/8" },
        { name: "VinFast Ocean Park", lat: 20.9926, lng: 105.9405, address: "Đa Tốn, Gia Lâm", power: "250kW", slots: "10/24" },
        { name: "VinFast Metropolis", lat: 21.0315, lng: 105.8125, address: "29 Liễu Giai, Ba Đình", power: "150kW", slots: "1/4" },
        { name: "VinFast Skylake", lat: 21.0210, lng: 105.7830, address: "Phạm Hùng, Nam Từ Liêm", power: "60kW", slots: "2/6" },
        { name: "VinFast Aeon Hà Đông", lat: 20.9850, lng: 105.7510, address: "Dương Nội, Hà Đông", power: "150kW", slots: "5/12" },
        { name: "VinFast Long Biên", lat: 21.0450, lng: 105.8950, address: "Chu Huy Mân, Long Biên", power: "150kW", slots: "3/8" },
        { name: "VinFast IPH Cầu Giấy", lat: 21.0360, lng: 105.7820, address: "241 Xuân Thủy, Cầu Giấy", power: "60kW", slots: "0/4" },
        { name: "VinFast BigC Thăng Long", lat: 21.0060, lng: 105.7920, address: "222 Trần Duy Hưng", power: "150kW", slots: "2/6" },
        { name: "VinFast Gardenia", lat: 21.0390, lng: 105.7650, address: "Hàm Nghi, Mỹ Đình", power: "60kW", slots: "1/4" },
        { name: "VinFast Smart City", lat: 21.0010, lng: 105.7480, address: "Tây Mỗ, Nam Từ Liêm", power: "250kW", slots: "8/20" },
        { name: "VinFast Star City", lat: 21.0080, lng: 105.8050, address: "Lê Văn Lương, Thanh Xuân", power: "60kW", slots: "1/2" },
        { name: "VinFast Mipec Riverside", lat: 21.0410, lng: 105.8650, address: "Long Biên, Hà Nội", power: "60kW", slots: "2/4" },
        { name: "VinFast Lotte Tây Hồ", lat: 21.0720, lng: 105.8150, address: "Lạc Long Quân, Tây Hồ", power: "150kW", slots: "4/10" },
        { name: "VinFast Syrena", lat: 21.0620, lng: 105.8250, address: "51 Xuân Diệu, Tây Hồ", power: "60kW", slots: "1/2" }
      ];
    } else {
      return [
        { name: "Trạm Vườn Hoa Con Cóc", lat: 21.0264, lng: 105.8576, address: "Ngô Quyền, Hoàn Kiếm", slots: "12/20" },
        { name: "Trạm Nhà Hát Lớn", lat: 21.0245, lng: 105.8585, address: "Tràng Tiền, Hoàn Kiếm", slots: "5/15" },
        { name: "Trạm Ga Hà Nội", lat: 21.0240, lng: 105.8410, address: "Lê Duẩn, Đống Đa", slots: "8/20" },
        { name: "Trạm Cát Linh", lat: 21.0280, lng: 105.8290, address: "Hào Nam, Đống Đa", slots: "10/25" },
        { name: "Trạm Văn Miếu", lat: 21.0290, lng: 105.8350, address: "Quốc Tử Giám, Đống Đa", slots: "4/12" },
        { name: "Trạm Công Viên Thống Nhất", lat: 21.0150, lng: 105.8480, address: "Trần Nhân Tông", slots: "15/30" },
        { name: "Trạm ĐH Bách Khoa", lat: 21.0050, lng: 105.8430, address: "Giải Phóng, Hai Bà Trưng", slots: "20/40" },
        { name: "Trạm Vincom Bà Triệu", lat: 21.0120, lng: 105.8500, address: "191 Bà Triệu", slots: "2/10" },
        { name: "Trạm Chợ Đồng Xuân", lat: 21.0370, lng: 105.8490, address: "Đồng Xuân, Hoàn Kiếm", slots: "6/15" },
        { name: "Trạm Ô Chợ Dừa", lat: 21.0190, lng: 105.8260, address: "Đống Đa, Hà Nội", slots: "9/20" },
        { name: "Trạm Cầu Giấy", lat: 21.0300, lng: 105.8030, address: "ĐH Giao thông Vận tải", slots: "14/30" },
        { name: "Trạm Duy Tân", lat: 21.0310, lng: 105.7830, address: "Duy Tân, Cầu Giấy", slots: "22/40" },
        { name: "Trạm Trần Duy Hưng", lat: 21.0080, lng: 105.7950, address: "Big C Thăng Long", slots: "5/15" },
        { name: "Trạm Láng Hạ", lat: 21.0160, lng: 105.8150, address: "88 Láng Hạ", slots: "7/20" },
        { name: "Trạm Royal City", lat: 21.0020, lng: 105.8150, address: "72 Nguyễn Trãi", slots: "11/25" }
      ];
    }
  }
};
