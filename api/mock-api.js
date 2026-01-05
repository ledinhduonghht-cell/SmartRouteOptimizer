// Mock API cho Hà Nội
const MockAPI = {
    // Dữ liệu thời tiết & giao thông thực tế Hà Nội
    getEnvironmentData: async (lat, lng) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Dữ liệu thực tế hơn cho Hà Nội
                const weathers = [
                    { condition: "Nắng ráo", icon: "fa-sun", impact: 1.0 },
                    { condition: "Mưa phùn", icon: "fa-cloud-rain", impact: 1.3 },
                    { condition: "Sương mù", icon: "fa-smog", impact: 1.5 },
                    { condition: "Nắng nóng", icon: "fa-temperature-high", impact: 1.1 }
                ];
                
                const traffics = [
                    { condition: "Thông thoáng", color: "#4CAF50", multiplier: 1.0 },
                    { condition: "Ùn tắc cục bộ", color: "#FF9800", multiplier: 1.4 },
                    { condition: "Kẹt xe", color: "#F44336", multiplier: 1.8 },
                    { condition: "Bình thường", color: "#2196F3", multiplier: 1.1 }
                ];
                
                const weather = weathers[Math.floor(Math.random() * weathers.length)];
                const traffic = traffics[Math.floor(Math.random() * traffics.length)];
                
                resolve({
                    weather: weather.condition,
                    weatherIcon: weather.icon,
                    weatherImpact: weather.impact,
                    traffic: traffic.condition,
                    trafficColor: traffic.color,
                    trafficMultiplier: traffic.multiplier,
                    temp: Math.floor(Math.random() * 15) + 20,
                    humidity: Math.floor(Math.random() * 50) + 50,
                    windSpeed: Math.floor(Math.random() * 15) + 5
                });
            }, 500);
        });
    },

    // Tìm kiếm địa điểm thực tế trong Hà Nội
    searchLocation: async (query) => {
        try {
            // Ưu tiên tìm trong Hà Nội
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ' Hà Nội')}&limit=10&addressdetails=1`
            );
            const data = await response.json();
            
            // Format data để tương thích với photon API format
            const formattedData = {
                features: data.map(item => ({
                    properties: {
                        name: item.display_name.split(',')[0],
                        street: item.address?.road || '',
                        city: item.address?.city || item.address?.town || 'Hà Nội',
                        state: 'Hanoi',
                        osm_value: this.getOSMType(item.type)
                    },
                    geometry: {
                        coordinates: [parseFloat(item.lon), parseFloat(item.lat)]
                    }
                }))
            };
            
            return formattedData;
        } catch (error) {
            console.error('Search error:', error);
            return { features: [] };
        }
    },
    
    // Xác định loại OSM
    getOSMType: function(type) {
        const typeMap = {
            'warehouse': 'warehouse',
            'industrial': 'warehouse',
            'port': 'port',
            'airport': 'airport',
            'station': 'station',
            'railway_station': 'station',
            'city': 'city'
        };
        return typeMap[type] || 'location';
    },

    // Tính toán tuyến đường thực tế
    calculateRealRoute: async (startCoords, endCoords, routeType = 'fastest', vehicleType = null) => {
        try {
            let profile = 'driving';
            
            if (routeType === 'truck' || (vehicleType && vehicleType.id.includes('container'))) {
                profile = 'driving';
            }
            
            const response = await fetch(
                `https://router.project-osrm.org/route/v1/${profile}/` +
                `${startCoords[1]},${startCoords[0]};` +
                `${endCoords[1]},${endCoords[0]}?` +
                `overview=full&geometries=geojson&steps=true&alternatives=3`
            );
            
            if (!response.ok) {
                throw new Error('OSRM API error: ' + response.status);
            }
            
            const data = await response.json();
            
            if (data.routes && data.routes.length > 0) {
                let selectedRoute = data.routes[0];
                
                if (data.routes.length > 1) {
                    selectedRoute = this.selectOptimalRoute(data.routes, routeType, vehicleType);
                }
                
                // Đảm bảo route có dữ liệu hợp lệ
                if (!selectedRoute.distance || !selectedRoute.duration) {
                    throw new Error('Route data is incomplete');
                }
                
                return {
                    distance: selectedRoute.distance,
                    duration: selectedRoute.duration,
                    geometry: selectedRoute.geometry,
                    steps: selectedRoute.legs[0]?.steps || [],
                    routeType: routeType
                };
            }
            
            throw new Error('No route found');
        } catch (error) {
            console.error('Route calculation error:', error);
            
            // Fallback với dữ liệu hợp lệ
            return this.calculateFallbackRoute(startCoords, endCoords, routeType, vehicleType);
        }
    },

    // Chọn route tối ưu
    selectOptimalRoute: function(routes, routeType, vehicleType) {
        // Đảm bảo routes có dữ liệu
        if (!routes || routes.length === 0) return null;
        
        if (routeType === 'fastest') {
            return routes.reduce((fastest, current) => 
                current.duration < fastest.duration ? current : fastest
            );
        }
        
        if (routeType === 'economic') {
            return routes.reduce((best, current) => {
                const bestScore = (best.distance || 0) * 0.7 + (best.duration || 0) * 0.3;
                const currentScore = (current.distance || 0) * 0.7 + (current.duration || 0) * 0.3;
                return currentScore < bestScore ? current : best;
            });
        }
        
        if (routeType === 'eco') {
            return routes.reduce((shortest, current) => 
                current.distance < shortest.distance ? current : shortest
            );
        }
        
        if (routeType === 'truck' || (vehicleType && vehicleType.heightRestricted)) {
            return routes.reduce((best, current) => {
                const bestSteps = best.legs?.[0]?.steps?.length || 0;
                const currentSteps = current.legs?.[0]?.steps?.length || 0;
                const bestScore = (best.distance || 0) + bestSteps * 1000;
                const currentScore = (current.distance || 0) + currentSteps * 1000;
                return currentScore < bestScore ? current : best;
            });
        }
        
        return routes[0];
    },

    // Tính toán khí thải
    calculateEmission: async (distance, vehicleType, vehicleAge, load, trafficMultiplier, routeType = 'fastest') => {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Đảm bảo có giá trị mặc định
                const safeDistance = distance || 0;
                const safeEmissionFactor = vehicleType?.emissionFactor || 0.15;
                const safeAge = vehicleAge || 0;
                const safeLoad = load || 0;
                const safeTrafficMultiplier = trafficMultiplier || 1.0;
                
                let baseEmission = safeEmissionFactor * (safeDistance / 1000);
                
                const ageFactor = 1 + (safeAge * 0.02);
                const loadFactor = 1 + (safeLoad * 0.01);
                const trafficFactor = safeTrafficMultiplier;
                
                let routeFactor = 1.0;
                switch(routeType) {
                    case 'eco':
                        routeFactor = 0.9;
                        break;
                    case 'economic':
                        routeFactor = 0.95;
                        break;
                    case 'truck':
                        routeFactor = 1.1;
                        break;
                }
                
                const totalEmission = baseEmission * ageFactor * loadFactor * trafficFactor * routeFactor;
                
                resolve({
                    co2: totalEmission.toFixed(2),
                    nox: (totalEmission * 0.02).toFixed(3),
                    pm: (totalEmission * 0.001).toFixed(4)
                });
            }, 300);
        });
    },

    // Gợi ý AI
    getAISuggestions: async (routeData, vehicleType, weather, traffic, routeType) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const suggestions = [];
                
                // Đảm bảo có dữ liệu
                const safeVehicleType = vehicleType || {};
                const safeWeather = weather || {};
                const safeTraffic = traffic || {};
                
                if (safeVehicleType.id && safeVehicleType.id.includes('container')) {
                    suggestions.push("• Ưu tiên đường tránh cầu hạn chế chiều cao (<4.2m)");
                    suggestions.push("• Kiểm tra trạm cân trước khi vào trung tâm");
                }
                
                if (safeVehicleType.id && (safeVehicleType.id === 'truck_heavy' || safeVehicleType.id.includes('container'))) {
                    suggestions.push("• Tránh đường phố nhỏ trong giờ cao điểm");
                    suggestions.push("• Ưu tiên đường vành đai 2, vành đai 3");
                }
                
                if (safeWeather.condition && safeWeather.condition.includes("Mưa")) {
                    suggestions.push("• Giảm tốc độ, tăng khoảng cách an toàn");
                }
                
                if (safeTraffic.condition && safeTraffic.condition.includes("Kẹt")) {
                    suggestions.push("• Ưu tiên đường vành đai");
                    suggestions.push("• Xuất phát trước 6h30 hoặc sau 9h");
                }
                
                if (routeType === 'eco') {
                    suggestions.push("• Duy trì tốc độ ổn định 50-60km/h");
                }
                
                // Gợi ý mặc định
                if (suggestions.length === 0) {
                    suggestions.push("• Kiểm tra áp suất lốp định kỳ");
                    suggestions.push("• Sử dụng điều hòa hợp lý");
                }
                
                resolve({
                    suggestions: suggestions,
                    timeSavings: Math.floor(Math.random() * 30) + 10,
                    fuelSavings: Math.floor(Math.random() * 20) + 5
                });
            }, 1000);
        });
    },

    // Tính toán fallback route
    calculateFallbackRoute: function(startCoords, endCoords, routeType = 'fastest', vehicleType = null) {
        const baseDistance = this.calculateHaversineDistance(startCoords, endCoords);
        
        let distanceMultiplier = 1.3;
        switch(routeType) {
            case 'eco':
                distanceMultiplier = 1.2;
                break;
            case 'economic':
                distanceMultiplier = 1.25;
                break;
            case 'truck':
                distanceMultiplier = 1.4;
                break;
        }
        
        let baseSpeed = 40;
        if (vehicleType) {
            baseSpeed = vehicleType.maxSpeed || 40;
        }
        
        let speedMultiplier = 1.0;
        switch(routeType) {
            case 'fastest':
                speedMultiplier = 1.2;
                break;
            case 'truck':
                speedMultiplier = 0.9;
                break;
        }
        
        const actualSpeed = baseSpeed * speedMultiplier;
        const actualDistance = baseDistance * distanceMultiplier * 1000;
        const duration = (actualDistance / 1000) / actualSpeed * 3600;
        
        const steps = 20;
        const geometry = {
            coordinates: [],
            type: "LineString"
        };
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const lat = startCoords[0] + (endCoords[0] - startCoords[0]) * t;
            const lng = startCoords[1] + (endCoords[1] - startCoords[1]) * t;
            
            if (i > 0 && i < steps) {
                const noiseLat = (Math.random() - 0.5) * 0.01;
                const noiseLng = (Math.random() - 0.5) * 0.01;
                geometry.coordinates.push([lng + noiseLng, lat + noiseLat]);
            } else {
                geometry.coordinates.push([lng, lat]);
            }
        }
        
        return {
            distance: actualDistance,
            duration: duration,
            geometry: geometry,
            steps: [],
            routeType: routeType
        };
    },

    // Tính khoảng cách Haversine
    calculateHaversineDistance: function(coord1, coord2) {
        const R = 6371;
        const dLat = (coord2[0] - coord1[0]) * Math.PI / 180;
        const dLon = (coord2[1] - coord1[1]) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(coord1[0] * Math.PI / 180) * Math.cos(coord2[0] * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    },

    // ====================
    // TRẠM SẠC ELECTRIC VEHICLE
    // ====================

    // Tìm trạm sạc gần vị trí
    findChargingStations: async (lat, lng, radius = 5000, vehicleType = null) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Dữ liệu trạm sạc mẫu cho Hà Nội
                const chargingStations = [
                    {
                        id: 'cs_evn_hanoi',
                        name: 'Trạm sạc EVN Hà Nội',
                        type: 'fast',
                        chargeSpeed: '50kW',
                        chargingTime: '1-2 giờ',
                        connectorType: 'CCS2, CHAdeMO, Type2',
                        address: '11 Cửa Bắc, Ba Đình, Hà Nội',
                        coordinates: [21.0405, 105.8347],
                        availablePlugs: 4,
                        pricePerKwh: 3500,
                        operatingHours: '24/7',
                        distance: Math.floor(Math.random() * 20) + 1
                    },
                    {
                        id: 'cs_vinfast_tran_duy_hung',
                        name: 'Trạm sạc VinFast Trần Duy Hưng',
                        type: 'ultra_fast',
                        chargeSpeed: '150kW',
                        chargingTime: '30-45 phút',
                        connectorType: 'CCS2',
                        address: 'Tầng hầm B1, tòa nhà Vincom, Trần Duy Hưng',
                        coordinates: [21.0094, 105.7954],
                        availablePlugs: 6,
                        pricePerKwh: 4500,
                        operatingHours: '6:00 - 22:00',
                        distance: Math.floor(Math.random() * 15) + 1
                    },
                    {
                        id: 'cs_green_charging',
                        name: 'Trạm sạc Green Charging',
                        type: 'medium',
                        chargeSpeed: '22kW',
                        chargingTime: '3-4 giờ',
                        connectorType: 'Type2',
                        address: '15 Láng Hạ, Ba Đình, Hà Nội',
                        coordinates: [21.0223, 105.8345],
                        availablePlugs: 8,
                        pricePerKwh: 3000,
                        operatingHours: '24/7',
                        distance: Math.floor(Math.random() * 25) + 1
                    },
                    {
                        id: 'cs_cau_giay',
                        name: 'Trạm sạc Cầu Giấy',
                        type: 'fast',
                        chargeSpeed: '50kW',
                        chargingTime: '1-2 giờ',
                        connectorType: 'CCS2, Type2',
                        address: 'Số 1 Phạm Văn Bạch, Cầu Giấy',
                        coordinates: [21.0333, 105.7994],
                        availablePlugs: 4,
                        pricePerKwh: 3500,
                        operatingHours: '24/7',
                        distance: Math.floor(Math.random() * 18) + 1
                    },
                    {
                        id: 'cs_ho_tay',
                        name: 'Trạm sạc Hồ Tây',
                        type: 'slow',
                        chargeSpeed: '7kW',
                        chargingTime: '6-8 giờ',
                        connectorType: 'Type2',
                        address: 'Đường Thanh Niên, Tây Hồ, Hà Nội',
                        coordinates: [21.0464, 105.8267],
                        availablePlugs: 10,
                        pricePerKwh: 2500,
                        operatingHours: '24/7',
                        distance: Math.floor(Math.random() * 30) + 1
                    }
                ];
                
                // Lọc theo loại xe nếu có
                let filteredStations = chargingStations;
                if (vehicleType && vehicleType.fuelType === 'electric') {
                    if (vehicleType.id === 'electric_van') {
                        // Xe tải điện có thể sử dụng tất cả loại trạm
                        filteredStations = chargingStations.filter(station => 
                            station.type !== 'slow' // Trừ loại chậm
                        );
                    }
                }
                
                // Sắp xếp theo khoảng cách
                filteredStations.sort((a, b) => a.distance - b.distance);
                
                resolve(filteredStations.slice(0, 5)); // Trả về 5 trạm gần nhất
            }, 400);
        });
    },

    // Tính toán nhu cầu sạc dựa trên quãng đường và loại xe
    calculateChargingNeeds: async (distance, vehicleType, currentBattery = 50) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const batteryCapacity = vehicleType.batteryCapacity || 50; // kWh
                const vehicleRange = vehicleType.range || 200; // km
                const consumptionPerKm = batteryCapacity / vehicleRange; // kWh/km
                
                // Tính năng lượng cần thiết
                const energyNeeded = distance * consumptionPerKm; // kWh
                
                // Tính phần trăm pin cần thêm
                const batteryNeededPercent = (energyNeeded / batteryCapacity) * 100;
                
                // Kiểm tra nếu cần sạc
                const needsCharging = (currentBattery - batteryNeededPercent) < 20;
                
                // Đề xuất loại trạm sạc
                let recommendedType = 'fast';
                if (distance > 100) {
                    recommendedType = 'ultra_fast';
                } else if (distance < 30) {
                    recommendedType = 'medium';
                }
                
                // Tính thời gian sạc
                let chargingTime = 0;
                switch(recommendedType) {
                    case 'ultra_fast':
                        chargingTime = energyNeeded / 120; // 120kW
                        break;
                    case 'fast':
                        chargingTime = energyNeeded / 50; // 50kW
                        break;
                    case 'medium':
                        chargingTime = energyNeeded / 22; // 22kW
                        break;
                    default:
                        chargingTime = energyNeeded / 7; // 7kW
                }
                
                // Đảm bảo thời gian tối thiểu
                chargingTime = Math.max(chargingTime, 0.5); // Tối thiểu 30 phút
                
                resolve({
                    needsCharging: needsCharging,
                    energyNeeded: energyNeeded.toFixed(1),
                    batteryNeededPercent: batteryNeededPercent.toFixed(1),
                    recommendedType: recommendedType,
                    estimatedChargingTime: chargingTime.toFixed(1),
                    estimatedCost: (energyNeeded * 3500).toFixed(0) // Giá trung bình 3500 VNĐ/kWh
                });
            }, 300);
        });
    },

    // Lên lịch sạc tối ưu
    optimizeChargingSchedule: async (routeData, vehicleType, chargingStations) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const suggestions = [];
                
                // Tính toán dựa trên quãng đường
                const totalDistance = routeData.distance / 1000; // km
                const estimatedTime = routeData.duration / 3600; // giờ
                
                if (vehicleType.fuelType === 'electric') {
                    const range = vehicleType.range || 200;
                    
                    // Kiểm tra nếu cần sạc giữa đường
                    if (totalDistance > range * 0.7) {
                        suggestions.push("• Nên sạc trước khi xuất phát đầy pin");
                        suggestions.push(`• Quãng đường ${totalDistance.toFixed(1)}km vượt 70% phạm vi hoạt động (${range}km)`);
                        
                        // Tìm trạm sạc gần điểm giữa
                        if (chargingStations.length > 0) {
                            const midPointStation = chargingStations[0]; // Trạm gần nhất
                            suggestions.push(`• Đề xuất sạc tại: ${midPointStation.name}`);
                            suggestions.push(`• Thời gian sạc ước tính: 30-45 phút`);
                        }
                    } else if (totalDistance > range * 0.4) {
                        suggestions.push("• Cân nhắc sạc nhanh tại điểm đến");
                        suggestions.push(`• Quãng đường ${totalDistance.toFixed(1)}km bằng ${(totalDistance/range*100).toFixed(0)}% phạm vi`);
                    }
                    
                    // Đề xuất dựa trên thời gian
                    const now = new Date();
                    const hour = now.getHours();
                    
                    if (hour >= 22 || hour < 6) {
                        suggestions.push("• Thời điểm tốt để sạc: Giờ thấp điểm (22h-6h)");
                        suggestions.push("• Giá điện thấp hơn 30%");
                    } else if (hour >= 17 && hour <= 20) {
                        suggestions.push("• Tránh sạc giờ cao điểm (17h-20h)");
                        suggestions.push("• Giá điện cao nhất trong ngày");
                    }
                    
                    // Đề xuất tiết kiệm
                    suggestions.push("• Sạc đến 80% để tối ưu tuổi thọ pin");
                    suggestions.push("• Tránh sạc quá 90% thường xuyên");
                }
                
                // Nếu không có đề xuất nào
                if (suggestions.length === 0) {
                    suggestions.push("• Không cần sạc thêm cho chuyến đi này");
                    suggestions.push("• Pin hiện tại đủ cho quãng đường dự kiến");
                }
                
                resolve({
                    suggestions: suggestions,
                    recommendedStations: chargingStations.slice(0, 3),
                    estimatedCostSavings: Math.floor(Math.random() * 50) + 20,
                    timeOptimization: Math.floor(Math.random() * 40) + 20
                });
            }, 500);
        });
    }
};

// Export cho Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MockAPI;
}