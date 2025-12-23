// Initialize Map
const map = L.map('map').setView([21.0285, 105.8542], 13);

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
}).addTo(map);

// Biến toàn cục
let startMarker = null;
let endMarker = null;
let routeLayer = null;
let allMarkers = [];
let vehicleData = [];
let currentRoute = null;
let watchId = null;
let currentPosition = null;
let currentRouteType = 'fastest';
let routeHistory = JSON.parse(localStorage.getItem('routeHistory')) || [];
let currentAddress = 'Đang xác định...';

// Danh sách gợi ý tập trung Hà Nội
const hanoiSuggestions = [
    { name: "ICD Mỹ Đình", type: "warehouse", lat: 21.0285, lng: 105.7842, category: "Kho bãi", alerts: ["Khu vực này thường xuyên có xe tải ra vào", "Giờ cao điểm hay ùn tắc"] },
    { name: "Kho Long Biên", type: "warehouse", lat: 21.0428, lng: 105.8700, category: "Kho bãi", alerts: ["Gần chợ đầu mối, giao thông phức tạp", "Cầu Chương Dương hay kẹt xe"] },
    { name: "Kho Gia Lâm", type: "warehouse", lat: 21.0409, lng: 105.8969, category: "Kho bãi", alerts: ["Khu công nghiệp, nhiều xe container", "Đường hẹp, khó di chuyển"] },
    { name: "Kho Đông Anh", type: "warehouse", lat: 21.1402, lng: 105.8508, category: "Kho bãi", alerts: ["Xa trung tâm, đường quốc lộ", "Thời tiết sương mù vào sáng sớm"] },
    { name: "Cảng Hà Nội", type: "port", lat: 20.9925, lng: 105.8658, category: "Cảng", alerts: ["Khu vực cảng biển, nhiều xe nâng", "Có trạm cân kiểm tra tải trọng"] },
    { name: "Trung tâm Hà Nội", type: "city", lat: 21.0285, lng: 105.8542, category: "Địa điểm", alerts: ["Cấm xe tải 6h-22h", "Kẹt xe giờ cao điểm"] },
    { name: "Sân bay Nội Bài", type: "airport", lat: 21.2211, lng: 105.8072, category: "Sân bay", alerts: ["Có trạm kiểm soát an ninh", "Đường cao tốc, tốc độ cao"] },
    { name: "Ga Hà Nội", type: "station", lat: 21.0245, lng: 105.8417, category: "Ga tàu", alerts: ["Khu vực đông đúc, nhiều người đi bộ", "Hạn chế đỗ xe"] }
];

// Danh sách cảnh báo thực tế Hà Nội
const hanoiAlerts = [
    { type: "construction", message: "Đường Võ Chí Công đang thi công đến 30/12", locations: ["Cầu Giấy", "Tây Hồ"], priority: "high" },
    { type: "traffic", message: "Kẹt xe các tuyến vào trung tâm sáng 7-9h", locations: ["Đường Trần Duy Hưng", "Phạm Hùng", "Láng Hạ"], priority: "medium" },
    { type: "restriction", message: "Xe tải >5 tấn cấm vào nội đô 6h-22h", locations: ["Quận Hoàn Kiếm", "Quận Ba Đình", "Quận Đống Đa"], priority: "high" },
    { type: "weather", message: "Đường vành đai 3 hay ngập khi mưa lớn", locations: ["Đường vành đai 3", "Khu vực Gia Lâm"], priority: "medium" },
    { type: "accident", message: "Cầu Chương Dương hay xảy ra tai nạn", locations: ["Cầu Chương Dương", "Khu vực Long Biên"], priority: "medium" },
    { type: "weight", message: "Cầu Đuống hạn chế xe >10 tấn", locations: ["Cầu Đuống", "Đường 5"], priority: "high" }
];

// Khởi tạo ứng dụng
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Hàm khởi tạo chính
async function initializeApp() {
    try {
        showLoading(true);
        
        // Tải dữ liệu xe
        await loadVehicleData();
        
        // Thiết lập event listeners
        setupEventListeners();
        
        // Thiết lập autocomplete tìm kiếm
        setupSearchAutocomplete();
        
        // Thêm địa điểm Hà Nội lên bản đồ
        addHanoiLocationsToMap();
        
        // Thiết lập giá trị mặc định cho range inputs
        updateRangeValues();
        
        // Cập nhật trạng thái thời tiết và giao thông
        updateEnvironmentData();
        
        // Tải lịch sử route
        loadRouteHistory();
        
        console.log('Ứng dụng đã khởi tạo thành công!');
    } catch (error) {
        console.error('Lỗi khi khởi tạo ứng dụng:', error);
        showNotification('Có lỗi xảy ra khi khởi tạo ứng dụng. Vui lòng tải lại trang.', 'error');
    } finally {
        showLoading(false);
    }
}

// Hiển thị/ẩn loading overlay
function showLoading(show) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }
}

// Tải dữ liệu xe từ file JSON
async function loadVehicleData() {
    try {
        const response = await fetch('data/vehicles.json');
        if (!response.ok) throw new Error('Không thể tải dữ liệu xe');
        const data = await response.json();
        vehicleData = data.vehicles;
        
        const select = document.getElementById('vehicleType');
        select.innerHTML = '<option value="">Chọn loại xe</option>';
        
        vehicleData.forEach(vehicle => {
            const option = document.createElement('option');
            option.value = vehicle.id;
            option.textContent = vehicle.name;
            option.setAttribute('data-description', vehicle.description);
            select.appendChild(option);
        });
        
        // Chọn xe tải nhẹ làm mặc định
        select.value = 'truck_light';
        
        // Hiển thị thông tin xe mặc định
        updateVehicleInfo();
        
        console.log('Đã tải dữ liệu xe:', vehicleData.length, 'loại xe');
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu xe:', error);
        // Fallback data
        vehicleData = [
            { id: 'truck_light', name: 'Xe tải nhẹ (1.5 - 5 tấn)', emissionFactor: 0.12, fuelConsumption: 0.25, maxSpeed: 60 }
        ];
    }
}

// Cập nhật thông tin xe
function updateVehicleInfo() {
    const select = document.getElementById('vehicleType');
    const selectedVehicle = vehicleData.find(v => v.id === select.value);
    
    if (selectedVehicle) {
        // Cập nhật giá trị mặc định cho trọng tải dựa trên loại xe
        const loadWeightInput = document.getElementById('loadWeight');
        const loadWeightValue = document.getElementById('loadWeightValue');
        
        if (selectedVehicle.weight) {
            loadWeightInput.value = selectedVehicle.weight;
            loadWeightValue.textContent = selectedVehicle.weight + ' tấn';
        }
    }
}

// Thiết lập event listeners
function setupEventListeners() {
    // GPS Button
    document.getElementById('gpsBtn').addEventListener('click', toggleGPSTracking);
    
    // Calculate Route Button
    document.getElementById('calculateRoute').addEventListener('click', calculateOptimalRoute);
    
    // AI Optimize Button
    document.getElementById('optimizeRoute').addEventListener('click', runAIOptimization);
    
    // Map Controls
    document.getElementById('zoomIn').addEventListener('click', () => map.zoomIn());
    document.getElementById('zoomOut').addEventListener('click', () => map.zoomOut());
    document.getElementById('locateMe').addEventListener('click', centerOnUser);
    document.getElementById('showHanoiLocations').addEventListener('click', showHanoiLocations);
    
    // Range inputs
    document.getElementById('vehicleAge').addEventListener('input', function(e) {
        document.getElementById('vehicleAgeValue').textContent = e.target.value + ' năm';
        updateCalculations();
    });
    
    document.getElementById('loadWeight').addEventListener('input', function(e) {
        document.getElementById('loadWeightValue').textContent = e.target.value + ' tấn';
        updateCalculations();
    });
    
    // Vehicle type change
    document.getElementById('vehicleType').addEventListener('change', function() {
        updateVehicleInfo();
        updateCalculations();
    });
    
    // Clear route button
    document.getElementById('clearRoute').addEventListener('click', clearRoute);
    
    // Toggle traffic
    document.getElementById('toggleTraffic').addEventListener('click', function() {
        this.classList.toggle('active');
        // Simulate traffic layer
        if (this.classList.contains('active')) {
            showNotification('Đã bật hiển thị giao thông', 'info');
        } else {
            showNotification('Đã tắt hiển thị giao thông', 'info');
        }
    });
    
    // Route Options
    document.querySelectorAll('.option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.option').forEach(o => o.classList.remove('active'));
            this.classList.add('active');
            currentRouteType = this.dataset.route;
            
            if (currentRoute) {
                recalculateRoute(currentRouteType);
            }
        });
    });
    
    // Export button
    document.getElementById('exportBtn').addEventListener('click', exportRouteData);
    
    // Toggle sidebar button
    const toggleBtn = document.getElementById('toggleSidebar');
    const sidebar = document.querySelector('.sidebar');
    
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            this.innerHTML = sidebar.classList.contains('active') ? 
                '<i class="fas fa-times"></i>' : 
                '<i class="fas fa-bars"></i>';
        });
    }
    
    // Click ra ngoài để đóng sidebar trên mobile
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 1024 && 
            !sidebar.contains(e.target) && 
            !toggleBtn.contains(e.target) && 
            sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
            toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
        }
    });
    
    // Click trên bản đồ để chọn điểm
    map.on('click', function(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        
        // Hỏi người dùng muốn đặt làm điểm gì
        const action = confirm(`Bạn muốn đặt vị trí này làm:\n\nOK - Điểm xuất phát\nCancel - Điểm đến`);
        
        if (action === true) {
            setAsStartPoint(lat, lng, 'Vị trí được chọn');
        } else {
            setAsEndPoint(lat, lng, 'Vị trí được chọn');
        }
    });
}

// Cập nhật giá trị range inputs
function updateRangeValues() {
    const vehicleAgeInput = document.getElementById('vehicleAge');
    const loadWeightInput = document.getElementById('loadWeight');
    
    if (vehicleAgeInput) {
        document.getElementById('vehicleAgeValue').textContent = vehicleAgeInput.value + ' năm';
    }
    
    if (loadWeightInput) {
        document.getElementById('loadWeightValue').textContent = loadWeightInput.value + ' tấn';
    }
}

// Thiết lập autocomplete cho tìm kiếm
function setupSearchAutocomplete() {
    const searchInput = document.getElementById('searchInput');
    const suggestionsContainer = document.getElementById('searchSuggestions');
    
    if (!searchInput || !suggestionsContainer) return;
    
    // Debounce search
    let debounceTimer;
    searchInput.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        const query = this.value.trim();
        
        if (query.length < 2) {
            suggestionsContainer.style.display = 'none';
            return;
        }
        
        debounceTimer = setTimeout(() => {
            performSearch(query);
        }, 300);
    });
    
    // Ẩn suggestions khi click ra ngoài
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
            suggestionsContainer.style.display = 'none';
        }
    });
}

// Thực hiện tìm kiếm
async function performSearch(query) {
    const suggestionsContainer = document.getElementById('searchSuggestions');
    
    try {
        // Hiển thị gợi ý địa phương trước
        showLocalSuggestions(query);
        
        // Sau đó tìm kiếm thực tế
        const searchData = await MockAPI.searchLocation(query);
        
        if (searchData.features && searchData.features.length > 0) {
            showSearchResults(searchData.features);
        }
    } catch (error) {
        console.error('Search error:', error);
        // Giữ lại gợi ý địa phương nếu có lỗi
    }
}

// Hiển thị gợi ý địa phương
function showLocalSuggestions(query) {
    const suggestionsContainer = document.getElementById('searchSuggestions');
    const filtered = hanoiSuggestions.filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
    );
    
    if (filtered.length > 0) {
        suggestionsContainer.innerHTML = filtered.map(item => `
            <div class="suggestion-item" data-lat="${item.lat}" data-lng="${item.lng}" data-name="${item.name}" data-type="${item.type}">
                <i class="fas fa-${getIconForType(item.type)}"></i>
                <div>
                    <div>${item.name}</div>
                    <small>${item.category}</small>
                </div>
                <span class="category">${item.category}</span>
            </div>
        `).join('');
        
        suggestionsContainer.style.display = 'block';
        
        // Thêm sự kiện click
        attachSuggestionEvents();
    }
}

// Hiển thị kết quả tìm kiếm
function showSearchResults(features) {
    const suggestionsContainer = document.getElementById('searchSuggestions');
    
    const resultsHTML = features.slice(0, 8).map(feature => {
        const name = feature.properties.name || 'Không có tên';
        const address = feature.properties.street || feature.properties.city || feature.properties.county || '';
        const type = getFeatureType(feature);
        
        return `
            <div class="suggestion-item" 
                 data-lat="${feature.geometry.coordinates[1]}" 
                 data-lng="${feature.geometry.coordinates[0]}" 
                 data-name="${name}"
                 data-type="${type}">
                <i class="fas fa-${getIconForType(type)}"></i>
                <div>
                    <div>${name}</div>
                    <small>${address}</small>
                </div>
                <span class="category">${type}</span>
            </div>
        `;
    }).join('');
    
    // Thêm vào suggestions container (không ghi đè hoàn toàn)
    if (suggestionsContainer.innerHTML === '') {
        suggestionsContainer.innerHTML = resultsHTML;
    } else {
        suggestionsContainer.innerHTML += resultsHTML;
    }
    
    suggestionsContainer.style.display = 'block';
    
    // Thêm sự kiện click
    attachSuggestionEvents();
}

// Gắn sự kiện click cho suggestions
function attachSuggestionEvents() {
    document.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', function() {
            const lat = parseFloat(this.dataset.lat);
            const lng = parseFloat(this.dataset.lng);
            const name = this.dataset.name;
            const type = this.dataset.type;
            
            document.getElementById('searchInput').value = name;
            document.getElementById('searchSuggestions').style.display = 'none';
            
            // Center map và thêm marker
            map.setView([lat, lng], 15);
            addLocationMarker([lat, lng], name, type);
            
            // Gợi ý đặt làm điểm xuất phát/điểm đến
            showLocationActionPrompt(lat, lng, name);
        });
    });
}

// Xác định loại feature
function getFeatureType(feature) {
    if (feature.properties.osm_value === 'warehouse') return 'warehouse';
    if (feature.properties.osm_value === 'port') return 'port';
    if (feature.properties.osm_value === 'airport') return 'airport';
    if (feature.properties.osm_value === 'station') return 'station';
    if (feature.properties.osm_value === 'city') return 'city';
    return 'location';
}

// Lấy icon cho loại địa điểm
function getIconForType(type) {
    switch(type) {
        case 'warehouse': return 'warehouse';
        case 'port': return 'anchor';
        case 'airport': return 'plane';
        case 'station': return 'train';
        case 'city': return 'city';
        default: return 'map-marker-alt';
    }
}

// Thêm các địa điểm Hà Nội lên bản đồ
function addHanoiLocationsToMap() {
    hanoiSuggestions.forEach(location => {
        const marker = L.marker([location.lat, location.lng], {
            icon: L.divIcon({
                className: 'hanoi-location-marker',
                html: `<i class="fas fa-${getIconForType(location.type)}" style="color: #3498db; font-size: 18px;"></i>`,
                iconSize: [25, 25]
            })
        }).addTo(map);
        
        marker.bindPopup(`
            <div class="warehouse-details">
                <h3>${location.name}</h3>
                <p><i class="fas fa-tag"></i> ${location.category}</p>
                <p><i class="fas fa-map-marker-alt"></i> Hà Nội</p>
                ${location.alerts ? `<p><i class="fas fa-exclamation-triangle" style="color: #e74c3c;"></i> ${location.alerts[0]}</p>` : ''}
                <div style="margin-top: 10px;">
                    <button class="btn-sm" onclick="setAsStartPoint(${location.lat}, ${location.lng}, '${location.name}')">
                        <i class="fas fa-flag"></i> Điểm xuất phát
                    </button>
                    <button class="btn-sm" onclick="setAsEndPoint(${location.lat}, ${location.lng}, '${location.name}')">
                        <i class="fas fa-flag-checkered"></i> Điểm đến
                    </button>
                </div>
            </div>
        `);
        
        allMarkers.push(marker);
    });
}

// Hiển thị prompt cho hành động với địa điểm
function showLocationActionPrompt(lat, lng, name) {
    const action = confirm(`Bạn muốn đặt "${name}" làm:\n\nOK - Điểm xuất phát\nCancel - Điểm đến`);
    
    if (action === true) {
        setAsStartPoint(lat, lng, name);
    } else {
        setAsEndPoint(lat, lng, name);
    }
}

// Thiết lập điểm xuất phát
function setAsStartPoint(lat, lng, name) {
    document.getElementById('startPoint').value = name;
    setStartLocation([lat, lng], name);
}

// Thiết lập điểm đến
function setAsEndPoint(lat, lng, name) {
    document.getElementById('endPoint').value = name;
    setEndLocation([lat, lng], name);
}

// Thiết lập điểm xuất phát trên bản đồ
function setStartLocation(coords, name) {
    // Xóa marker cũ
    if (startMarker) {
        map.removeLayer(startMarker);
    }
    
    // Thêm marker mới
    startMarker = L.marker(coords, {
        icon: L.divIcon({
            className: 'start-marker',
            html: '<i class="fas fa-flag" style="color: #2ecc71; font-size: 24px;"></i>',
            iconSize: [30, 30]
        })
    }).addTo(map);
    
    startMarker.bindPopup(`<b>Điểm xuất phát:</b> ${name}`).openPopup();
    
    // Lưu tọa độ
    window.startCoords = coords;
    
    // Cập nhật cảnh báo dựa trên điểm xuất phát
    updateAlertsForLocation(coords, 'start');
}

// Thiết lập điểm đến trên bản đồ
function setEndLocation(coords, name) {
    // Xóa marker cũ
    if (endMarker) {
        map.removeLayer(endMarker);
    }
    
    // Thêm marker mới
    endMarker = L.marker(coords, {
        icon: L.divIcon({
            className: 'end-marker',
            html: '<i class="fas fa-flag-checkered" style="color: #e74c3c; font-size: 24px;"></i>',
            iconSize: [30, 30]
        })
    }).addTo(map);
    
    endMarker.bindPopup(`<b>Điểm đến:</b> ${name}`).openPopup();
    
    // Lưu tọa độ
    window.endCoords = coords;
    
    // Cập nhật cảnh báo dựa trên điểm đến
    updateAlertsForLocation(coords, 'end');
}

// Thêm marker cho vị trí tìm kiếm
function addLocationMarker(coords, name, type) {
    const marker = L.marker(coords, {
        icon: L.divIcon({
            className: 'location-marker',
            html: `<i class="fas fa-${getIconForType(type)}" style="color: #3498db; font-size: 20px;"></i>`,
            iconSize: [30, 30]
        })
    }).addTo(map);
    
    marker.bindPopup(`
        <div class="warehouse-details">
            <h3>${name}</h3>
            <p><i class="fas fa-tag"></i> ${type}</p>
            <div style="margin-top: 10px;">
                <button class="btn-sm" onclick="setAsStartPoint(${coords[0]}, ${coords[1]}, '${name}')">
                    <i class="fas fa-flag"></i> Điểm xuất phát
                </button>
                <button class="btn-sm" onclick="setAsEndPoint(${coords[0]}, ${coords[1]}, '${name}')">
                    <i class="fas fa-flag-checkered"></i> Điểm đến
                </button>
            </div>
        </div>
    `).openPopup();
    
    allMarkers.push(marker);
}

// Cập nhật dữ liệu môi trường
async function updateEnvironmentData() {
    try {
        const envData = await MockAPI.getEnvironmentData(21.0285, 105.8542);
        updateTrafficStatus(envData);
    } catch (error) {
        console.error('Lỗi khi cập nhật dữ liệu môi trường:', error);
    }
}

// Tính toán tuyến đường tối ưu
async function calculateOptimalRoute() {
    const startName = document.getElementById('startPoint').value;
    const endName = document.getElementById('endPoint').value;
    const vehicleTypeId = document.getElementById('vehicleType').value;
    
    // VALIDATION FIXED: Kiểm tra điều kiện đầy đủ
    if (!startName.trim() || !endName.trim()) {
        alert('Vui lòng nhập điểm xuất phát và điểm đến');
        return;
    }
    
    if (!window.startCoords || !window.endCoords) {
        alert('Vui lòng chọn vị trí trên bản đồ hoặc từ gợi ý');
        return;
    }
    
    if (!vehicleTypeId) {
        alert('Vui lòng chọn loại xe');
        return;
    }
    
    // Hiển thị loading
    const calculateBtn = document.getElementById('calculateRoute');
    const originalText = calculateBtn.innerHTML;
    calculateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang tính toán...';
    calculateBtn.disabled = true;
    
    showLoading(true);
    
    try {
        // Lấy dữ liệu thời tiết và giao thông
        const envData = await MockAPI.getEnvironmentData(
            window.startCoords[0], 
            window.startCoords[1]
        );
        
        // Lấy loại route hiện tại
        const activeOption = document.querySelector('.option.active');
        const routeType = activeOption ? activeOption.dataset.route : 'fastest';
        currentRouteType = routeType;
        
        // Lấy thông tin xe
        const vehicle = vehicleData.find(v => v.id === vehicleTypeId);
        
        // Tính toán tuyến đường thực tế với optimization
        const routeData = await MockAPI.calculateRealRoute(
            window.startCoords,
            window.endCoords,
            routeType,
            vehicle
        );
        
        // Lưu route hiện tại
        currentRoute = {
            data: routeData,
            start: window.startCoords,
            end: window.endCoords,
            env: envData,
            vehicle: vehicle,
            routeType: routeType,
            startName: startName,
            endName: endName,
            timestamp: new Date().toISOString()
        };
        
        // Vẽ tuyến đường lên bản đồ
        drawRealRoute(routeData, routeType);
        
        // Cập nhật thông tin tuyến đường - FIXED: Đảm bảo luôn có giá trị
        await updateRouteInfo(routeData, envData, vehicleTypeId, routeType);
        
        // Cập nhật trạng thái giao thông
        updateTrafficStatus(envData);
        
        // Cập nhật cảnh báo cho tuyến đường
        updateAlertsForRoute(window.startCoords, window.endCoords, vehicle);
        
        // Tạo đề xuất AI
        await generateAISuggestions(routeData, vehicleTypeId, envData, routeType);
        
        // Lưu vào lịch sử
        saveToRouteHistory(currentRoute);
        
        // Hiển thị thông báo thành công
        showNotification('Tính toán tuyến đường thành công!', 'success');
        
    } catch (error) {
        console.error('Lỗi tính toán tuyến đường:', error);
        showNotification('Có lỗi xảy ra khi tính toán tuyến đường. Vui lòng thử lại.', 'error');
        
        // FALLBACK: Hiển thị giá trị mặc định nếu có lỗi
        document.getElementById('distance').textContent = '-- km';
        document.getElementById('duration').textContent = '-- phút';
        document.getElementById('co2').textContent = '-- kg';
        document.getElementById('fuelCost').textContent = '-- VNĐ';
    } finally {
        // Khôi phục button
        calculateBtn.innerHTML = originalText;
        calculateBtn.disabled = false;
        showLoading(false);
    }
}

// Vẽ tuyến đường thực tế
function drawRealRoute(routeData, routeType) {
    // Xóa route cũ
    if (routeLayer) {
        map.removeLayer(routeLayer);
    }
    
    // Tạo style dựa trên loại route
    let routeColor = '#3498db';
    let routeWeight = 5;
    let dashArray = null;
    
    switch(routeType) {
        case 'fastest':
            routeColor = '#e74c3c';
            routeWeight = 6;
            break;
        case 'economic':
            routeColor = '#2ecc71';
            routeWeight = 4;
            dashArray = '5, 5';
            break;
        case 'eco':
            routeColor = '#27ae60';
            routeWeight = 4;
            break;
        case 'truck':
            routeColor = '#f39c12';
            routeWeight = 6;
            dashArray = '10, 5';
            break;
    }
    
    // Vẽ route từ geometry GeoJSON
    routeLayer = L.geoJSON(routeData.geometry, {
        style: {
            color: routeColor,
            weight: routeWeight,
            opacity: 0.8,
            lineCap: 'round',
            lineJoin: 'round',
            dashArray: dashArray
        }
    }).addTo(map);
    
    // Fit bounds để hiển thị toàn bộ route
    map.fitBounds(routeLayer.getBounds().pad(0.1));
    
    // Thêm popup cho route
    const distanceKm = (routeData.distance / 1000).toFixed(1);
    const durationMinutes = Math.ceil(routeData.duration / 60);
    
    routeLayer.bindPopup(`
        <div class="route-popup">
            <h4>Thông tin tuyến đường</h4>
            <p><i class="fas fa-road"></i> Khoảng cách: ${distanceKm} km</p>
            <p><i class="fas fa-clock"></i> Thời gian: ${durationMinutes} phút</p>
            <p><i class="fas fa-route"></i> Loại đường: ${getRouteTypeName(routeType)}</p>
            <p><i class="fas fa-palette" style="color: ${routeColor}"></i> Màu đường: ${getRouteTypeName(routeType)}</p>
        </div>
    `);
}

// Lấy tên loại route
function getRouteTypeName(routeType) {
    switch(routeType) {
        case 'fastest': return 'Nhanh nhất';
        case 'economic': return 'Tiết kiệm nhất';
        case 'eco': return 'Xanh nhất';
        case 'truck': return 'Cho xe tải';
        default: return 'Tiêu chuẩn';
    }
}

// Cập nhật thông tin tuyến đường - FIXED VERSION
async function updateRouteInfo(routeData, envData, vehicleTypeId, routeType) {
    const vehicle = vehicleData.find(v => v.id === vehicleTypeId);
    const vehicleAge = parseInt(document.getElementById('vehicleAge').value) || 0;
    const loadWeight = parseFloat(document.getElementById('loadWeight').value) || 0;
    
    if (!vehicle) {
        console.error('Không tìm thấy thông tin xe:', vehicleTypeId);
        // Set default values
        document.getElementById('distance').textContent = '-- km';
        document.getElementById('duration').textContent = '-- phút';
        document.getElementById('co2').textContent = '-- kg';
        document.getElementById('fuelCost').textContent = '-- VNĐ';
        return;
    }
    
    try {
        // Tính toán khoảng cách và thời gian - FIXED: Đảm bảo luôn có giá trị
        const distanceKm = routeData && routeData.distance ? (routeData.distance / 1000).toFixed(1) : '0.0';
        const durationMinutes = routeData && routeData.duration ? Math.ceil(routeData.duration / 60) : 0;
        
        // Tính toán khí thải
        const emissionData = await MockAPI.calculateEmission(
            routeData?.distance || 0,
            vehicle,
            vehicleAge,
            loadWeight,
            envData?.trafficMultiplier || 1.0,
            routeType
        );
        
        // Tính chi phí nhiên liệu
        const fuelCost = calculateFuelCost(parseFloat(distanceKm) || 0, vehicle, envData?.trafficMultiplier || 1.0, routeType);
        
        // Cập nhật giao diện - FIXED: Luôn đảm bảo có giá trị hợp lệ
        document.getElementById('distance').textContent = `${distanceKm} km`;
        document.getElementById('duration').textContent = `${durationMinutes} phút`;
        document.getElementById('co2').textContent = `${emissionData?.co2 || '0.00'} kg`;
        document.getElementById('fuelCost').textContent = `${fuelCost?.toLocaleString('vi-VN') || '0'} VNĐ`;
        
        // Cập nhật thống kê
        updateStatistics(parseFloat(distanceKm) || 0, parseFloat(emissionData?.co2) || 0, durationMinutes, vehicle, routeType);
        
    } catch (error) {
        console.error('Lỗi khi cập nhật thông tin route:', error);
        // Set safe default values
        document.getElementById('distance').textContent = '-- km';
        document.getElementById('duration').textContent = '-- phút';
        document.getElementById('co2').textContent = '-- kg';
        document.getElementById('fuelCost').textContent = '-- VNĐ';
    }
}

// Tính chi phí nhiên liệu
function calculateFuelCost(distance, vehicle, trafficMultiplier, routeType) {
    const fuelPrice = 24000; // VNĐ/lít
    const baseConsumption = vehicle.fuelConsumption * distance;
    const actualConsumption = baseConsumption * trafficMultiplier;
    
    // Điều chỉnh theo loại route
    let routeFactor = 1.0;
    switch(routeType) {
        case 'economic':
            routeFactor = 0.9;
            break;
        case 'eco':
            routeFactor = 0.85;
            break;
        case 'truck':
            routeFactor = 1.1;
            break;
    }
    
    const adjustedConsumption = actualConsumption * routeFactor;
    const fuelCost = adjustedConsumption * fuelPrice;
    
    // Thêm chi phí khác
    const tollCost = distance > 50 ? 50000 : 0;
    const driverCost = (distance / 100) * 200000;
    const maintenanceCost = distance * 500;
    
    return Math.round(fuelCost + tollCost + driverCost + maintenanceCost);
}

// Cập nhật thống kê
function updateStatistics(distance, co2, duration, vehicle, routeType) {
    // Tính toán giá trị tối ưu dựa trên loại route
    let optimizationFactor = 1.0;
    
    switch(routeType) {
        case 'eco':
            optimizationFactor = 0.85;
            break;
        case 'economic':
            optimizationFactor = 0.88;
            break;
        case 'fastest':
            optimizationFactor = 0.92;
            break;
        case 'truck':
            optimizationFactor = 0.90;
            break;
    }
    
    const optimizedDistance = (distance * optimizationFactor).toFixed(1);
    const optimizedCO2 = (co2 * optimizationFactor).toFixed(1);
    const optimizedTime = Math.ceil(duration * optimizationFactor);
    
    // Tính nhiên liệu tiêu thụ
    const fuelConsumption = vehicle ? (distance * vehicle.fuelConsumption).toFixed(1) : '0';
    const optimizedFuelConsumption = (fuelConsumption * optimizationFactor).toFixed(1);
    
    // Cập nhật giao diện - FIXED: Đảm bảo luôn có giá trị
    document.getElementById('totalDistance').textContent = `${optimizedDistance || '0'} km`;
    document.getElementById('fuelConsumption').textContent = `${optimizedFuelConsumption || '0'} L`;
    document.getElementById('co2Saved').textContent = `${((co2 || 0) - (optimizedCO2 || 0)).toFixed(1)} kg`;
    document.getElementById('timeSaved').textContent = `${(duration || 0) - (optimizedTime || 0)} phút`;
}

// Cập nhật trạng thái giao thông
function updateTrafficStatus(envData) {
    const trafficElem = document.getElementById('trafficStatus');
    const weatherElem = document.getElementById('weatherStatus');
    
    if (!trafficElem || !weatherElem) return;
    
    // Xác định trạng thái giao thông
    let trafficClass = 'normal';
    if (envData.traffic.includes('Kẹt')) {
        trafficClass = 'danger';
    } else if (envData.traffic.includes('Ùn')) {
        trafficClass = 'warning';
    }
    
    // Cập nhật giao thông
    trafficElem.className = `status ${trafficClass}`;
    trafficElem.style.borderLeftColor = envData.trafficColor;
    trafficElem.style.backgroundColor = `${envData.trafficColor}20`;
    trafficElem.innerHTML = `
        <i class="fas fa-traffic-light"></i>
        Giao thông: ${envData.traffic}
    `;
    
    // Cập nhật thời tiết
    weatherElem.innerHTML = `
        <i class="fas ${envData.weatherIcon}"></i>
        Thời tiết: ${envData.weather} (${envData.temp}°C)
    `;
}

// Cập nhật cảnh báo dựa trên vị trí
function updateAlertsForLocation(coords, type) {
    const alertsContainer = document.getElementById('alertsContainer');
    let relevantAlerts = [];
    
    // Tìm cảnh báo liên quan đến khu vực
    hanoiAlerts.forEach(alert => {
        // Đơn giản: lấy cảnh báo có priority cao
        if (alert.priority === 'high') {
            relevantAlerts.push(alert);
        }
    });
    
    // Thêm cảnh báo cụ thể cho loại vị trí
    if (type === 'start') {
        relevantAlerts.push({
            type: 'info',
            message: 'Điểm xuất phát đã được thiết lập',
            priority: 'low'
        });
    } else if (type === 'end') {
        relevantAlerts.push({
            type: 'info',
            message: 'Điểm đến đã được thiết lập',
            priority: 'low'
        });
    }
    
    // Hiển thị cảnh báo
    displayAlerts(relevantAlerts);
}

// Cập nhật cảnh báo cho tuyến đường
function updateAlertsForRoute(startCoords, endCoords, vehicle) {
    const alertsContainer = document.getElementById('alertsContainer');
    let routeAlerts = [];
    
    // Kiểm tra các cảnh báo liên quan
    hanoiAlerts.forEach(alert => {
        // Kiểm tra nếu cảnh báo liên quan đến xe tải/container
        if (vehicle && (vehicle.id.includes('truck') || vehicle.id.includes('container'))) {
            if (alert.type === 'restriction' || alert.type === 'weight') {
                routeAlerts.push(alert);
            }
        }
        
        // Thêm cảnh báo về thi công và tai nạn
        if (alert.type === 'construction' || alert.type === 'accident') {
            routeAlerts.push(alert);
        }
    });
    
    // Thêm cảnh báo về giờ cao điểm
    const now = new Date();
    const hour = now.getHours();
    if ((hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 19)) {
        routeAlerts.push({
            type: 'traffic',
            message: 'Hiện đang là giờ cao điểm, dự kiến ùn tắc',
            priority: 'high'
        });
    }
    
    // Giới hạn số lượng cảnh báo
    routeAlerts = routeAlerts.slice(0, 5);
    
    // Hiển thị cảnh báo
    displayAlerts(routeAlerts);
}

// Hiển thị cảnh báo
function displayAlerts(alerts) {
    const alertsContainer = document.getElementById('alertsContainer');
    
    if (!alerts || alerts.length === 0) {
        alertsContainer.innerHTML = `
            <div class="alert-item">
                <i class="fas fa-check-circle" style="color: #4CAF50;"></i>
                <span>Không có cảnh báo nào cho tuyến đường này</span>
            </div>
        `;
        return;
    }
    
    const alertsHTML = alerts.map(alert => {
        let icon = 'fa-info-circle';
        let color = '#3498db';
        
        switch(alert.type) {
            case 'construction':
                icon = 'fa-hard-hat';
                color = '#f39c12';
                break;
            case 'traffic':
                icon = 'fa-traffic-light';
                color = '#e74c3c';
                break;
            case 'restriction':
                icon = 'fa-ban';
                color = '#e74c3c';
                break;
            case 'weather':
                icon = 'fa-cloud-rain';
                color = '#3498db';
                break;
            case 'accident':
                icon = 'fa-car-crash';
                color = '#e74c3c';
                break;
            case 'weight':
                icon = 'fa-weight-hanging';
                color = '#f39c12';
                break;
        }
        
        return `
            <div class="alert-item">
                <i class="fas ${icon}" style="color: ${color};"></i>
                <span>${alert.message}</span>
            </div>
        `;
    }).join('');
    
    alertsContainer.innerHTML = alertsHTML;
}

// Tạo đề xuất AI
async function generateAISuggestions(routeData, vehicleTypeId, envData, routeType) {
    const vehicle = vehicleData.find(v => v.id === vehicleTypeId);
    
    if (!vehicle) return;
    
    try {
        const suggestions = await MockAPI.getAISuggestions(
            routeData,
            vehicle,
            envData,
            { condition: envData.traffic, multiplier: envData.trafficMultiplier },
            routeType
        );
        
        const routeTypeName = getRouteTypeName(routeType);
        
        const suggestionsHTML = `
            <p><i class="fas fa-route"></i> <strong>Tuyến đường ${routeTypeName}:</strong> ${(routeData.distance/1000).toFixed(1)}km, ${Math.ceil(routeData.duration/60)} phút</p>
            <p><i class="fas ${envData.weatherIcon}"></i> <strong>Thời tiết:</strong> ${envData.weather}, ${envData.temp}°C</p>
            <p><i class="fas fa-traffic-light"></i> <strong>Giao thông:</strong> ${envData.traffic}</p>
            <p><i class="fas fa-truck"></i> <strong>Loại xe:</strong> ${vehicle.name}</p>
            <hr>
            <p><strong><i class="fas fa-robot"></i> Đề xuất AI:</strong></p>
            ${suggestions.suggestions.map(s => `<p><i class="fas fa-check-circle" style="color: #4CAF50;"></i> ${s}</p>`).join('')}
            <p style="margin-top: 10px; color: #2ecc71;">
                <i class="fas fa-chart-line"></i> Ước tính tiết kiệm: 
                Thời gian ${suggestions.timeSavings} phút | 
                Nhiên liệu ${suggestions.fuelSavings}%
            </p>
        `;
        
        document.getElementById('aiSuggestions').innerHTML = suggestionsHTML;
    } catch (error) {
        console.error('Lỗi tạo đề xuất AI:', error);
        document.getElementById('aiSuggestions').innerHTML = `
            <p><i class="fas fa-lightbulb"></i> Đề xuất AI tạm thời không khả dụng. Vui lòng thử lại sau.</p>
        `;
    }
}

// Tính toán lại route dựa trên option
async function recalculateRoute(routeType) {
    if (!currentRoute) return;
    
    const calculateBtn = document.getElementById('calculateRoute');
    const originalText = calculateBtn.innerHTML;
    calculateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang tính toán lại...';
    calculateBtn.disabled = true;
    
    showLoading(true);
    
    try {
        // Tính toán route mới với loại optimization mới
        const routeData = await MockAPI.calculateRealRoute(
            currentRoute.start,
            currentRoute.end,
            routeType,
            currentRoute.vehicle
        );
        
        // Cập nhật current route
        currentRoute.data = routeData;
        currentRoute.routeType = routeType;
        
        // Vẽ lại route
        if (routeLayer) {
            map.removeLayer(routeLayer);
        }
        drawRealRoute(routeData, routeType);
        
        // Cập nhật thông tin
        await updateRouteInfo(routeData, currentRoute.env, currentRoute.vehicle.id, routeType);
        
        // Tạo đề xuất AI mới
        await generateAISuggestions(routeData, currentRoute.vehicle.id, currentRoute.env, routeType);
        
        showNotification(`Đã chuyển sang tuyến đường ${getRouteTypeName(routeType)}`, 'success');
        
    } catch (error) {
        console.error('Lỗi tính toán lại route:', error);
        showNotification('Có lỗi xảy ra khi tính toán lại tuyến đường', 'error');
    } finally {
        calculateBtn.innerHTML = originalText;
        calculateBtn.disabled = false;
        showLoading(false);
    }
}

// Chạy tối ưu hóa AI
async function runAIOptimization() {
    if (!currentRoute) {
        alert('Vui lòng tính toán tuyến đường trước');
        return;
    }
    
    const aiBtn = document.getElementById('optimizeRoute');
    const originalText = aiBtn.innerHTML;
    
    // Hiển thị loading
    aiBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> AI đang tối ưu hóa...';
    aiBtn.disabled = true;
    
    showLoading(true);
    
    try {
        // Mô phỏng xử lý AI
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Lấy dữ liệu hiện tại - FIXED: Xử lý giá trị không hợp lệ
        const distanceText = document.getElementById('distance').textContent;
        const co2Text = document.getElementById('co2').textContent;
        const durationText = document.getElementById('duration').textContent;
        const fuelCostText = document.getElementById('fuelCost').textContent;
        
        const currentDistance = parseFloat(distanceText) || 0;
        const currentCO2 = parseFloat(co2Text) || 0;
        const currentTime = parseFloat(durationText) || 0;
        const currentFuelCost = parseFloat(fuelCostText.replace(/[^0-9]/g, '')) || 0;
        
        // Tính toán giá trị tối ưu
        const optimizationFactor = 0.85 + (Math.random() * 0.1);
        const optimizedDistance = (currentDistance * optimizationFactor).toFixed(1);
        const optimizedCO2 = (currentCO2 * optimizationFactor).toFixed(1);
        const optimizedTime = Math.ceil(currentTime * optimizationFactor);
        const optimizedFuelCost = Math.round(currentFuelCost * optimizationFactor);
        
        // Cập nhật giao diện - FIXED: Đảm bảo giá trị hợp lệ
        document.getElementById('distance').textContent = `${optimizedDistance} km`;
        document.getElementById('duration').textContent = `${optimizedTime} phút`;
        document.getElementById('co2').textContent = `${optimizedCO2} kg`;
        document.getElementById('fuelCost').textContent = `${optimizedFuelCost.toLocaleString('vi-VN')} VNĐ`;
        
        // Cập nhật thống kê
        updateStatistics(optimizedDistance, optimizedCO2, optimizedTime, currentRoute.vehicle, currentRouteType);
        
        // Hiển thị kết quả AI
        const savingsDistance = (currentDistance - optimizedDistance).toFixed(1);
        const savingsCO2 = (currentCO2 - optimizedCO2).toFixed(1);
        const savingsTime = currentTime - optimizedTime;
        const savingsCost = (currentFuelCost - optimizedFuelCost);
        
        document.getElementById('aiSuggestions').innerHTML = `
            <p><i class="fas fa-check-circle" style="color: #4CAF50;"></i> <strong>AI đã tối ưu thành công!</strong></p>
            <p><i class="fas fa-road"></i> Quãng đường giảm: <strong>${savingsDistance} km (${(100 - optimizationFactor*100).toFixed(1)}%)</strong></p>
            <p><i class="fas fa-smog"></i> CO2 giảm: <strong>${savingsCO2} kg (${(100 - optimizationFactor*100).toFixed(1)}%)</strong></p>
            <p><i class="fas fa-clock"></i> Thời gian tiết kiệm: <strong>${savingsTime} phút (${(100 - optimizationFactor*100).toFixed(1)}%)</strong></p>
            <p><i class="fas fa-money-bill-wave"></i> Tiết kiệm chi phí: <strong>${savingsCost.toLocaleString('vi-VN')} VNĐ</strong></p>
            <hr>
            <p><strong><i class="fas fa-lightbulb"></i> Đề xuất tiếp theo:</strong></p>
            <p><i class="fas fa-check-circle" style="color: #4CAF50;"></i> Kiểm tra áp suất lốp để tiết kiệm thêm 5% nhiên liệu</p>
            <p><i class="fas fa-check-circle" style="color: #4CAF50;"></i> Sử dụng điều hòa hợp lý để giảm 3% khí thải</p>
            <p><i class="fas fa-check-circle" style="color: #4CAF50;"></i> Lên lịch giao hàng ngoài giờ cao điểm</p>
        `;
        
        showNotification('Tối ưu hóa AI thành công!', 'success');
        
    } catch (error) {
        console.error('Lỗi tối ưu hóa AI:', error);
        showNotification('Có lỗi xảy ra khi tối ưu hóa.', 'error');
    } finally {
        // Khôi phục button
        aiBtn.innerHTML = originalText;
        aiBtn.disabled = false;
        showLoading(false);
    }
}

// Cập nhật tính toán
function updateCalculations() {
    if (!currentRoute) return;
    
    const vehicleTypeId = document.getElementById('vehicleType').value;
    updateRouteInfo(currentRoute.data, currentRoute.env, vehicleTypeId, currentRouteType);
}

// Hiển thị địa điểm Hà Nội
function showHanoiLocations() {
    // Zoom đến Hà Nội và hiển thị tất cả markers
    map.setView([21.0285, 105.8542], 12);
    
    // Mở popup cho marker đầu tiên
    if (allMarkers.length > 0) {
        allMarkers[0].openPopup();
    }
    
    // Highlight nút
    const btn = document.getElementById('showHanoiLocations');
    btn.classList.add('active');
    
    showNotification('Đang hiển thị các kho và cảng tại Hà Nội', 'info');
}

// Xóa tuyến đường
function clearRoute() {
    if (routeLayer) {
        map.removeLayer(routeLayer);
        routeLayer = null;
    }
    if (startMarker) {
        map.removeLayer(startMarker);
        startMarker = null;
    }
    if (endMarker) {
        map.removeLayer(endMarker);
        endMarker = null;
    }
    
    window.startCoords = null;
    window.endCoords = null;
    currentRoute = null;
    currentRouteType = 'fastest';
    
    // Reset UI - FIXED: Sử dụng giá trị mặc định an toàn
    document.getElementById('startPoint').value = '';
    document.getElementById('endPoint').value = '';
    document.getElementById('distance').textContent = '-- km';
    document.getElementById('duration').textContent = '-- phút';
    document.getElementById('co2').textContent = '-- kg';
    document.getElementById('fuelCost').textContent = '-- VNĐ';
    document.getElementById('aiSuggestions').innerHTML = `
        <p><i class="fas fa-lightbulb"></i> Nhập điểm xuất phát và điểm đến để nhận đề xuất tối ưu...</p>
    `;
    
    // Reset statistics
    document.getElementById('totalDistance').textContent = '0 km';
    document.getElementById('fuelConsumption').textContent = '0 L';
    document.getElementById('co2Saved').textContent = '0 kg';
    document.getElementById('timeSaved').textContent = '0 phút';
    
    // Reset route options
    document.querySelectorAll('.option').forEach(o => o.classList.remove('active'));
    document.querySelector('.option[data-route="fastest"]').classList.add('active');
    
    // Reset cảnh báo
    displayAlerts([]);
    
    showNotification('Đã xóa tuyến đường', 'info');
}

// Hiển thị thông báo
function showNotification(message, type = 'info') {
    // Tạo element thông báo
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Thêm CSS cho notification
    if (!document.querySelector('.notification-style')) {
        const style = document.createElement('style');
        style.className = 'notification-style';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                display: flex;
                align-items: center;
                gap: 10px;
                z-index: 9999;
                animation: slideIn 0.3s ease;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                max-width: 400px;
            }
            .notification-success { background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%); }
            .notification-error { background: linear-gradient(135deg, #F44336 0%, #D32F2F 100%); }
            .notification-info { background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Tự động xóa sau 3 giây
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// GPS Tracking Functions
function toggleGPSTracking() {
    const btn = document.getElementById('gpsBtn');
    
    if (!watchId) {
        if ('geolocation' in navigator) {
            watchId = navigator.geolocation.watchPosition(
                updatePosition,
                handleGPSError,
                {
                    enableHighAccuracy: true,
                    maximumAge: 0,
                    timeout: 10000
                }
            );
            
            btn.innerHTML = '<i class="fas fa-map-marker-alt"></i> Dừng theo dõi GPS';
            btn.classList.add('tracking');
            
            showNotification('Đã bật theo dõi GPS', 'success');
        } else {
            showNotification('Trình duyệt của bạn không hỗ trợ GPS', 'error');
        }
    } else {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
        btn.innerHTML = '<i class="fas fa-map-marker-alt"></i> Bật theo dõi GPS';
        btn.classList.remove('tracking');
        
        showNotification('Đã dừng theo dõi GPS', 'info');
    }
}

// Cập nhật vị trí GPS
function updatePosition(position) {
    currentPosition = position;
    
    // Update display
    document.getElementById('latitude').textContent = position.coords.latitude.toFixed(6);
    document.getElementById('longitude').textContent = position.coords.longitude.toFixed(6);
    document.getElementById('accuracy').textContent = position.coords.accuracy ? 
        `${position.coords.accuracy.toFixed(1)}m` : 'N/A';
    document.getElementById('speed').textContent = position.coords.speed ? 
        `${(position.coords.speed * 3.6).toFixed(1)} km/h` : '0 km/h';
    
    // Lấy địa chỉ thực tế
    getAddressFromCoordinates(position.coords.latitude, position.coords.longitude);
    
    // Update user marker
    updateUserMarker(position);
}

// Lấy địa chỉ từ tọa độ
async function getAddressFromCoordinates(lat, lng) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
        const data = await response.json();
        
        if (data && data.address) {
            const address = data.address;
            let formattedAddress = '';
            
            // Xây dựng địa chỉ từ chi tiết đến tổng quát
            if (address.road) formattedAddress += address.road;
            if (address.hamlet) formattedAddress += `, ${address.hamlet}`;
            else if (address.village) formattedAddress += `, ${address.village}`;
            else if (address.town) formattedAddress += `, ${address.town}`;
            else if (address.city) formattedAddress += `, ${address.city}`;
            else if (address.county) formattedAddress += `, ${address.county}`;
            
            if (address.state) formattedAddress += `, ${address.state}`;
            
            currentAddress = formattedAddress || 'Không xác định được địa chỉ';
            
            // Hiển thị địa chỉ trong GPS info
            const gpsInfo = document.querySelector('.gps-info');
            if (gpsInfo) {
                // Kiểm tra xem đã có dòng địa chỉ chưa
                let addressItem = gpsInfo.querySelector('.info-item.address');
                if (!addressItem) {
                    addressItem = document.createElement('div');
                    addressItem.className = 'info-item address';
                    gpsInfo.appendChild(addressItem);
                }
                
                addressItem.innerHTML = `
                    <span>Địa chỉ:</span>
                    <span style="font-weight: 500; color: #2d3436; font-family: 'Roboto', sans-serif;">${currentAddress}</span>
                `;
            }
        }
    } catch (error) {
        console.error('Lỗi khi lấy địa chỉ:', error);
        currentAddress = 'Không thể xác định địa chỉ';
    }
}

// Cập nhật marker người dùng
function updateUserMarker(position) {
    // Xóa marker cũ của user
    const userMarkers = allMarkers.filter(m => m.options.icon?.options?.className === 'user-marker');
    userMarkers.forEach(marker => {
        map.removeLayer(marker);
        allMarkers = allMarkers.filter(m => m !== marker);
    });
    
    // Thêm marker mới
    const userMarker = L.marker([position.coords.latitude, position.coords.longitude], {
        icon: L.divIcon({
            className: 'user-marker',
            html: '<i class="fas fa-truck-moving" style="color: #3498db; font-size: 24px;"></i>',
            iconSize: [30, 30]
        })
    }).addTo(map);
    
    const speedText = position.coords.speed ? (position.coords.speed * 3.6).toFixed(1) : '0';
    
    userMarker.bindPopup(`
        <div class="warehouse-details">
            <h3>Vị trí của bạn</h3>
            <p><i class="fas fa-map-marker-alt"></i> ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}</p>
            <p><i class="fas fa-road"></i> ${currentAddress}</p>
            <p><i class="fas fa-tachometer-alt"></i> Tốc độ: ${speedText} km/h</p>
            <div style="margin-top: 10px;">
                <button class="btn-sm" onclick="setAsStartPoint(${position.coords.latitude}, ${position.coords.longitude}, 'Vị trí hiện tại')">
                    <i class="fas fa-flag"></i> Điểm xuất phát
                </button>
            </div>
        </div>
    `);
    
    allMarkers.push(userMarker);
    
    // Center map nếu đang tracking
    if (document.getElementById('gpsBtn').classList.contains('tracking')) {
        map.setView([position.coords.latitude, position.coords.longitude], 15);
    }
}

// Center Map on User
function centerOnUser() {
    if (currentPosition) {
        map.setView([currentPosition.coords.latitude, currentPosition.coords.longitude], 15);
        showNotification('Đã định vị về vị trí của bạn', 'success');
    } else {
        showNotification('Vui lòng bật GPS để định vị', 'error');
    }
}

// Xử lý lỗi GPS
function handleGPSError(error) {
    console.error('GPS Error:', error);
    
    let message = 'Lỗi GPS: ';
    switch(error.code) {
        case error.PERMISSION_DENIED:
            message = 'Truy cập vị trí bị từ chối. Vui lòng cho phép quyền truy cập vị trí.';
            break;
        case error.POSITION_UNAVAILABLE:
            message = 'Vị trí không khả dụng. Vui lòng kiểm tra kết nối.';
            break;
        case error.TIMEOUT:
            message = 'Hết thời gian chờ lấy vị trí. Vui lòng thử lại.';
            break;
        default:
            message = error.message;
    }
    
    showNotification(message, 'error');
}

// Lưu route vào lịch sử
function saveToRouteHistory(route) {
    const historyItem = {
        id: Date.now(),
        timestamp: route.timestamp,
        start: {
            name: route.startName,
            coords: route.start
        },
        end: {
            name: route.endName,
            coords: route.end
        },
        vehicle: route.vehicle.name,
        routeType: route.routeType,
        distance: parseFloat(document.getElementById('distance').textContent) || 0,
        duration: parseInt(document.getElementById('duration').textContent) || 0,
        co2: parseFloat(document.getElementById('co2').textContent) || 0,
        fuelCost: parseInt(document.getElementById('fuelCost').textContent.replace(/[^0-9]/g, '')) || 0
    };
    
    // Thêm vào đầu mảng
    routeHistory.unshift(historyItem);
    
    // Giới hạn lịch sử (50 item)
    if (routeHistory.length > 50) {
        routeHistory = routeHistory.slice(0, 50);
    }
    
    // Lưu vào localStorage
    localStorage.setItem('routeHistory', JSON.stringify(routeHistory));
    
    // Cập nhật hiển thị
    displayRouteHistory();
}

// Tải lịch sử route
function loadRouteHistory() {
    try {
        const savedHistory = localStorage.getItem('routeHistory');
        if (savedHistory) {
            routeHistory = JSON.parse(savedHistory);
            displayRouteHistory();
        }
    } catch (error) {
        console.error('Lỗi khi tải lịch sử:', error);
        routeHistory = [];
    }
}

// Hiển thị lịch sử route
function displayRouteHistory() {
    // Tạo modal hoặc sidebar cho lịch sử
    if (!document.getElementById('historyModal')) {
        createHistoryModal();
    }
    
    // Cập nhật nội dung modal
    const historyContent = document.getElementById('historyContent');
    if (!historyContent) return;
    
    if (routeHistory.length === 0) {
        historyContent.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #7f8c8d;">
                <i class="fas fa-history fa-3x" style="margin-bottom: 10px;"></i>
                <p>Chưa có lịch sử tính toán</p>
            </div>
        `;
        return;
    }
    
    const historyHTML = routeHistory.map(item => `
        <div class="history-item" data-id="${item.id}">
            <div class="history-header">
                <span class="history-date">${new Date(item.timestamp).toLocaleDateString('vi-VN')}</span>
                <span class="history-time">${new Date(item.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div class="history-route">
                <div class="route-point">
                    <i class="fas fa-flag" style="color: #2ecc71;"></i>
                    <span>${item.start.name || 'Điểm xuất phát'}</span>
                </div>
                <div class="route-arrow">
                    <i class="fas fa-arrow-down"></i>
                </div>
                <div class="route-point">
                    <i class="fas fa-flag-checkered" style="color: #e74c3c;"></i>
                    <span>${item.end.name || 'Điểm đến'}</span>
                </div>
            </div>
            <div class="history-details">
                <div class="detail-item">
                    <i class="fas fa-road"></i>
                    <span>${item.distance} km</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-clock"></i>
                    <span>${item.duration} phút</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-truck"></i>
                    <span>${item.vehicle}</span>
                </div>
            </div>
            <div class="history-actions">
                <button class="btn-sm" onclick="loadRouteFromHistory(${item.id})">
                    <i class="fas fa-redo"></i> Tải lại
                </button>
                <button class="btn-sm" onclick="deleteRouteFromHistory(${item.id})">
                    <i class="fas fa-trash"></i> Xóa
                </button>
            </div>
        </div>
    `).join('');
    
    historyContent.innerHTML = historyHTML;
}

// Tạo modal hiển thị lịch sử
function createHistoryModal() {
    const modalHTML = `
        <div id="historyModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-history"></i> Lịch sử tính toán</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div id="historyContent"></div>
                </div>
                <div class="modal-footer">
                    <button id="clearAllHistory" class="btn btn-danger">
                        <i class="fas fa-trash"></i> Xóa tất cả lịch sử
                    </button>
                </div>
            </div>
        </div>
        
        <button id="showHistoryBtn" class="history-btn">
            <i class="fas fa-history"></i>
        </button>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Thêm CSS cho modal
    const style = document.createElement('style');
    style.textContent = `
        .modal {
            display: none;
            position: fixed;
            z-index: 1003;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
        }
        
        .modal-content {
            background-color: white;
            margin: 5% auto;
            padding: 0;
            width: 90%;
            max-width: 800px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            max-height: 80vh;
            display: flex;
            flex-direction: column;
        }
        
        .modal-header {
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 12px 12px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .modal-header h3 {
            margin: 0;
            font-size: 18px;
        }
        
        .modal-close {
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
        }
        
        .modal-body {
            padding: 20px;
            overflow-y: auto;
            flex: 1;
        }
        
        .modal-footer {
            padding: 15px 20px;
            border-top: 1px solid #e0e6ef;
            display: flex;
            justify-content: flex-end;
        }
        
        .history-item {
            background: #f8fafc;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            border-left: 4px solid #3498db;
            transition: transform 0.2s;
        }
        
        .history-item:hover {
            transform: translateX(-2px);
            background: #e3f2fd;
        }
        
        .history-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 12px;
            color: #636e72;
        }
        
        .history-route {
            margin-bottom: 10px;
        }
        
        .route-point {
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 5px 0;
        }
        
        .route-arrow {
            text-align: center;
            margin: 5px 0;
            color: #3498db;
        }
        
        .history-details {
            display: flex;
            gap: 15px;
            margin-bottom: 10px;
            flex-wrap: wrap;
        }
        
        .detail-item {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 12px;
            color: #636e72;
        }
        
        .history-actions {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        }
        
        .history-btn {
            position: fixed;
            right: 20px;
            bottom: 100px;
            z-index: 1002;
            background: linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%);
            color: white;
            border: none;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 20px;
            transition: all 0.3s;
        }
        
        .history-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        }
        
        .btn-danger {
            background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .btn-danger:hover {
            opacity: 0.9;
        }
    `;
    document.head.appendChild(style);
    
    // Thêm event listeners
    const modal = document.getElementById('historyModal');
    const closeBtn = document.querySelector('.modal-close');
    const showHistoryBtn = document.getElementById('showHistoryBtn');
    const clearAllHistoryBtn = document.getElementById('clearAllHistory');
    
    showHistoryBtn.addEventListener('click', () => {
        modal.style.display = 'block';
        displayRouteHistory();
    });
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    clearAllHistoryBtn.addEventListener('click', () => {
        if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử?')) {
            routeHistory = [];
            localStorage.removeItem('routeHistory');
            displayRouteHistory();
            showNotification('Đã xóa toàn bộ lịch sử', 'success');
        }
    });
    
    // Đóng modal khi click ra ngoài
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Tải lại route từ lịch sử
function loadRouteFromHistory(id) {
    const item = routeHistory.find(h => h.id === id);
    if (!item) return;
    
    // Thiết lập điểm xuất phát và điểm đến
    document.getElementById('startPoint').value = item.start.name;
    document.getElementById('endPoint').value = item.end.name;
    
    window.startCoords = item.start.coords;
    window.endCoords = item.end.coords;
    
    // Thiết lập marker
    setStartLocation(item.start.coords, item.start.name);
    setEndLocation(item.end.coords, item.end.name);
    
    // Thiết lập loại xe
    const vehicle = vehicleData.find(v => v.name === item.vehicle);
    if (vehicle) {
        document.getElementById('vehicleType').value = vehicle.id;
        updateVehicleInfo();
    }
    
    // Thiết lập loại route
    const routeOption = document.querySelector(`.option[data-route="${item.routeType}"]`);
    if (routeOption) {
        document.querySelectorAll('.option').forEach(o => o.classList.remove('active'));
        routeOption.classList.add('active');
        currentRouteType = item.routeType;
    }
    
    showNotification('Đã tải tuyến đường từ lịch sử', 'success');
    
    // Đóng modal
    document.getElementById('historyModal').style.display = 'none';
}

// Xóa route từ lịch sử
function deleteRouteFromHistory(id) {
    if (confirm('Bạn có chắc chắn muốn xóa tuyến đường này khỏi lịch sử?')) {
        routeHistory = routeHistory.filter(h => h.id !== id);
        localStorage.setItem('routeHistory', JSON.stringify(routeHistory));
        displayRouteHistory();
        showNotification('Đã xóa tuyến đường khỏi lịch sử', 'success');
    }
}

// Export dữ liệu route
function exportRouteData() {
    if (!currentRoute) {
        showNotification('Không có dữ liệu route để export', 'error');
        return;
    }
    
    const data = {
        timestamp: new Date().toISOString(),
        start: {
            name: document.getElementById('startPoint').value,
            coordinates: window.startCoords
        },
        end: {
            name: document.getElementById('endPoint').value,
            coordinates: window.endCoords
        },
        vehicle: {
            type: document.getElementById('vehicleType').value,
            name: vehicleData.find(v => v.id === document.getElementById('vehicleType').value)?.name || '',
            age: document.getElementById('vehicleAge').value,
            load: document.getElementById('loadWeight').value
        },
        route: {
            type: currentRouteType,
            typeName: getRouteTypeName(currentRouteType),
            distance: document.getElementById('distance').textContent,
            duration: document.getElementById('duration').textContent,
            co2: document.getElementById('co2').textContent,
            fuelCost: document.getElementById('fuelCost').textContent
        },
        environment: {
            traffic: document.getElementById('trafficStatus').textContent.replace('Giao thông: ', ''),
            weather: document.getElementById('weatherStatus').textContent.replace('Thời tiết: ', '')
        },
        statistics: {
            totalDistance: document.getElementById('totalDistance').textContent,
            fuelConsumption: document.getElementById('fuelConsumption').textContent,
            co2Saved: document.getElementById('co2Saved').textContent,
            timeSaved: document.getElementById('timeSaved').textContent
        }
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `route-data-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    
    showNotification('Đã xuất dữ liệu tuyến đường', 'success');
}

// Khởi tạo biến window
window.startCoords = null;
window.endCoords = null;

// Xuất các hàm cần thiết ra global scope
window.setAsStartPoint = setAsStartPoint;
window.setAsEndPoint = setAsEndPoint;
window.exportRouteData = exportRouteData;
window.loadRouteFromHistory = loadRouteFromHistory;
window.deleteRouteFromHistory = deleteRouteFromHistory;

// Thêm kiểu CSS cho popup route
function addRoutePopupStyle() {
    if (!document.querySelector('.route-popup-style')) {
        const style = document.createElement('style');
        style.className = 'route-popup-style';
        style.textContent = `
            .route-popup {
                font-family: 'Roboto', sans-serif;
                padding: 5px;
            }
            .route-popup h4 {
                margin: 0 0 10px 0;
                color: #2c3e50;
                font-size: 14px;
                font-weight: 600;
            }
            .route-popup p {
                margin: 5px 0;
                font-size: 12px;
                color: #636e72;
                display: flex;
                align-items: center;
                gap: 5px;
            }
            .route-popup p i {
                color: #3498db;
                width: 12px;
            }
        `;
        document.head.appendChild(style);
    }
}

// Gọi hàm thêm style khi khởi tạo
addRoutePopupStyle();