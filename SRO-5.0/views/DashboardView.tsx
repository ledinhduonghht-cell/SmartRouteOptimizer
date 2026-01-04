
import React, { useState, useEffect, useRef } from 'react';
import { View } from '../types';
import L from 'leaflet';

interface Props { navigate: (v: View) => void; }

interface Vehicle {
  id: string;
  driver: string;
  status: 'ĐANG CHẠY' | 'ĐANG DỪNG' | 'CẢNH BÁO';
  speed: string;
  fuel: string;
  fuelType: 'EV' | 'GAS';
  payload: string;
  location: string;
  lat: number;
  lng: number;
  type: 'running' | 'stopped' | 'warning';
}

const DashboardView: React.FC<Props> = ({ navigate }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [filter, setFilter] = useState<'all' | 'running' | 'stopped'>('all');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  const vehicles: Vehicle[] = [
    { id: '29C-123.45', driver: 'NGUYỄN VĂN A', status: 'ĐANG CHẠY', speed: '45', fuel: '85%', fuelType: 'EV', payload: '1.5T', location: 'Cầu Giấy, HN', lat: 21.0285, lng: 105.8542, type: 'running' },
    { id: '30E-678.90', driver: 'TRẦN VĂN B', status: 'ĐANG DỪNG', speed: '0', fuel: '40L', fuelType: 'GAS', payload: '2.5T', location: 'Hoàn Kiếm, HN', lat: 21.0350, lng: 105.8400, type: 'stopped' },
    { id: '29H-999.88', driver: 'LÊ VĂN C', status: 'CẢNH BÁO', speed: '82', fuel: '20%', fuelType: 'EV', payload: '5.0T', location: 'Thanh Xuân, HN', lat: 21.0200, lng: 105.8650, type: 'warning' },
    { id: '29D-444.22', driver: 'PHẠM VĂN D', status: 'ĐANG CHẠY', speed: '38', fuel: '15L', fuelType: 'GAS', payload: '1.2T', location: 'Ba Đình, HN', lat: 21.0450, lng: 105.8200, type: 'running' },
    { id: '30A-555.11', driver: 'HOÀNG VĂN E', status: 'ĐANG CHẠY', speed: '52', fuel: '70%', fuelType: 'EV', payload: '1.5T', location: 'Hai Bà Trưng, HN', lat: 21.0100, lng: 105.8300, type: 'running' },
    { id: '29C-888.33', driver: 'LÝ VĂN F', status: 'ĐANG CHẠY', speed: '40', fuel: '65%', fuelType: 'EV', payload: '3.5T', location: 'Tây Hồ, HN', lat: 21.0500, lng: 105.7800, type: 'running' },
    { id: '30G-222.11', driver: 'VŨ VĂN G', status: 'ĐANG DỪNG', speed: '0', fuel: '25L', fuelType: 'GAS', payload: '1.5T', location: 'Long Biên, HN', lat: 21.0300, lng: 105.7700, type: 'stopped' },
    { id: '29H-777.00', driver: 'BÙI VĂN H', status: 'ĐANG CHẠY', speed: '60', fuel: '90%', fuelType: 'EV', payload: '10.0T', location: 'Hà Đông, HN', lat: 21.0600, lng: 105.8000, type: 'running' },
    { id: '30F-111.44', driver: 'ĐỖ VĂN I', status: 'ĐANG CHẠY', speed: '35', fuel: '55%', fuelType: 'EV', payload: '2.0T', location: 'Nam Từ Liêm, HN', lat: 21.0150, lng: 105.8600, type: 'running' },
    { id: '29C-333.66', driver: 'NGÔ VĂN J', status: 'ĐANG DỪNG', speed: '0', fuel: '10L', fuelType: 'GAS', payload: '1.5T', location: 'Hoàng Mai, HN', lat: 21.0400, lng: 105.8800, type: 'stopped' }
  ];

  const filteredVehicles = vehicles.filter(v => {
    if (filter === 'all') return true;
    if (filter === 'running') return v.status === 'ĐANG CHẠY' || v.status === 'CẢNH BÁO';
    return v.status === 'ĐANG DỪNG';
  });

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([21.0285, 105.8542], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRef.current);
    }

    if (mapRef.current) {
      (Object.values(markersRef.current) as L.Marker[]).forEach(m => m.remove());
      markersRef.current = {};

      vehicles.forEach((v) => {
        const markerColor = v.status === 'CẢNH BÁO' ? '#ef4444' : v.status === 'ĐANG CHẠY' ? '#00E676' : '#94a3b8';
        const isSelected = selectedVehicleId === v.id;
        
        const marker = L.marker([v.lat, v.lng], {
          icon: L.divIcon({
            className: 'vehicle-marker',
            html: `<div class="bg-white p-0.5 rounded-full shadow-lg border-2 transition-transform duration-300 ${isSelected ? 'scale-110' : 'scale-90'}" style="border-color: ${markerColor}">
                     <span class="material-symbols-outlined text-[14px] filled" style="color: ${markerColor}">local_shipping</span>
                   </div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })
        }).on('click', () => {
          setSelectedVehicleId(v.id);
          mapRef.current?.flyTo([v.lat, v.lng], 15);
        }).addTo(mapRef.current!);
        markersRef.current[v.id] = marker;
      });
    }
  }, [selectedVehicleId]);

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-background-light">
      <div className="absolute inset-0 z-0">
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>

      <div className={`z-10 pt-10 pb-2 transition-all duration-500 ${isMinimized ? 'opacity-40 -translate-y-4' : 'opacity-100'}`}>
        <div className="flex items-center justify-between px-5 mb-3">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-cover border border-white shadow-md" style={{ backgroundImage: 'url("https://picsum.photos/id/1025/100/100")' }}></div>
            <h2 className="font-black text-slate-800 tracking-tight text-[16px]">Logistics Hà Nội</h2>
          </div>
          <div className="flex gap-1.5">
            <button className="size-8 bg-white/90 backdrop-blur-md rounded-full shadow-md flex items-center justify-center border border-white/50 text-slate-700 active:scale-90 transition-all">
              <span className="material-symbols-outlined text-lg filled">notifications</span>
            </button>
            <button className="size-8 bg-white/90 backdrop-blur-md rounded-full shadow-md flex items-center justify-center border border-white/50 text-red-500 active:scale-90 transition-all" onClick={() => navigate(View.HOME)}>
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        <div className="flex gap-2.5 px-5 overflow-x-auto no-scrollbar py-1">
          <div className="min-w-[130px] bg-white/90 backdrop-blur-xl p-3 rounded-[1.5rem] shadow-lg border border-white/40 flex flex-col">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="bg-primary/20 p-1 rounded-lg"><span className="material-symbols-outlined text-primary text-[12px] filled">eco</span></div>
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">GIẢM CO2</span>
            </div>
            <p className="text-[18px] font-black text-slate-900 tracking-tighter leading-none">450 <span className="text-[10px] font-bold text-slate-400">kg</span></p>
            <p className="text-[8px] font-black text-primary mt-1">+12% hôm nay</p>
          </div>

          <div className="min-w-[130px] bg-white/90 backdrop-blur-xl p-3 rounded-[1.5rem] shadow-lg border border-white/40 flex flex-col">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="bg-blue-500/20 p-1 rounded-lg"><span className="material-symbols-outlined text-blue-500 text-[12px] filled">local_shipping</span></div>
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">HOẠT ĐỘNG</span>
            </div>
            <p className="text-[18px] font-black text-slate-900 tracking-tighter leading-none">12 <span className="text-[10px] font-bold text-slate-400">/15 xe</span></p>
            <div className="w-full bg-slate-200/50 h-1 rounded-full overflow-hidden mt-2">
              <div className="bg-blue-500 h-full w-[80%] rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1"></div>

      <div className={`bg-white rounded-t-[2.5rem] shadow-[0_-15px_60px_rgba(0,0,0,0.1)] p-5 pb-8 z-30 transition-all duration-700 ease-out border-t border-white ${isMinimized ? 'translate-y-[85%]' : 'translate-y-0'}`}>
        <div className="w-12 h-1 bg-slate-100 rounded-full mx-auto mb-6 cursor-pointer" onClick={() => setIsMinimized(!isMinimized)}></div>
        
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-5">
          <button onClick={() => setFilter('all')} className={`flex-shrink-0 px-5 py-3 rounded-[1.2rem] text-[9px] font-black transition-all uppercase tracking-widest ${filter === 'all' ? 'bg-primary text-slate-900 shadow-sm' : 'bg-slate-50 text-slate-400'}`}>TẤT CẢ ({vehicles.length})</button>
          <button onClick={() => setFilter('running')} className={`flex-shrink-0 px-5 py-3 rounded-[1.2rem] text-[9px] font-black transition-all uppercase tracking-widest ${filter === 'running' ? 'bg-primary text-slate-900 shadow-sm' : 'bg-slate-50 text-slate-400'}`}>ĐANG CHẠY</button>
          <button onClick={() => setFilter('stopped')} className={`flex-shrink-0 px-5 py-3 rounded-[1.2rem] text-[9px] font-black transition-all uppercase tracking-widest ${filter === 'stopped' ? 'bg-primary text-slate-900 shadow-sm' : 'bg-slate-50 text-slate-400'}`}>ĐANG DỪNG</button>
        </div>

        <div className="max-h-[42vh] overflow-y-auto no-scrollbar space-y-2.5 px-0.5">
          {filteredVehicles.map((v) => (
            <button 
              key={v.id} 
              onClick={() => { setSelectedVehicleId(v.id); mapRef.current?.flyTo([v.lat, v.lng], 15); }}
              className={`w-full flex items-center justify-between p-3.5 rounded-[1.8rem] transition-all border text-left active:scale-[0.98] ${selectedVehicleId === v.id ? 'border-primary bg-primary/5' : 'bg-white border-slate-50 shadow-sm'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`size-11 rounded-xl flex items-center justify-center transition-all ${
                  v.status === 'ĐANG CHẠY' ? 'bg-primary/10 text-primary' : 
                  v.status === 'CẢNH BÁO' ? 'bg-red-50 text-red-500' : 
                  'bg-slate-100 text-slate-300'
                }`}>
                  <span className="material-symbols-outlined filled text-lg">local_shipping</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className="text-[14px] font-black text-slate-900 tracking-tighter">{v.id}</p>
                    <span className={`text-[6.5px] font-black px-1 py-0.5 rounded bg-opacity-20 uppercase ${
                      v.status === 'ĐANG CHẠY' ? 'bg-primary text-primary' : 
                      v.status === 'CẢNH BÁO' ? 'bg-red-500 text-red-600' : 
                      'bg-slate-400 text-slate-500'
                    }`}>
                      {v.status}
                    </span>
                  </div>
                  <p className="text-[8.5px] text-slate-400 font-bold uppercase tracking-widest truncate">TX: {v.driver}</p>
                  <p className="text-[8px] text-slate-300 font-black uppercase tracking-tight truncate">TẢI: {v.payload} • {v.location}</p>
                </div>
              </div>
              
              <div className="text-right shrink-0">
                <p className="text-[16px] font-black tracking-tighter text-slate-900 leading-none mb-1">
                  {v.speed} <span className="text-[7px] font-bold text-slate-300 uppercase">KM/H</span>
                </p>
                <div className={`flex items-center justify-end gap-1 ${v.fuelType === 'EV' ? 'text-primary' : 'text-orange-500'}`}>
                  <span className="material-symbols-outlined text-[13px] filled">{v.fuelType === 'EV' ? 'bolt' : 'local_gas_station'}</span>
                  <span className="text-[9px] font-black">{v.fuel}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
