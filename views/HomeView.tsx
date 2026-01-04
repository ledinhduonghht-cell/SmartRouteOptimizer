
import React, { useState, useEffect, useRef } from 'react';
import { View } from '../types';
import L from 'leaflet';

interface Props { navigate: (v: View) => void; }

const HomeView: React.FC<Props> = ({ navigate }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([21.0285, 105.8542], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRef.current);

      L.circleMarker([21.0285, 105.8542], {
        radius: 8,
        fillColor: "#3b82f6",
        color: "#fff",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
      }).addTo(mapRef.current);
    }
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="flex-1 relative flex flex-col overflow-hidden bg-white">
      {/* Map Background */}
      <div className="absolute inset-0 z-0">
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>

      {/* Top Search Overlay */}
      <div className="z-10 px-4 pt-12 pb-2 bg-gradient-to-b from-white/60 to-transparent pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <button className="size-11 rounded-full bg-white shadow-lg flex items-center justify-center border border-white" onClick={() => navigate(View.PROFILE)}>
            <div className="size-9 bg-cover rounded-full" style={{ backgroundImage: 'url("https://picsum.photos/id/64/100/100")' }}></div>
          </button>
          <div className="flex-1 shadow-xl rounded-2xl bg-white flex items-center h-13 px-5 border border-white cursor-pointer" onClick={() => navigate(View.ROUTE_INPUT)}>
            <span className="material-symbols-outlined text-primary mr-3 text-2xl font-bold">search</span>
            <span className="text-slate-400 font-semibold text-[15px]">Tìm lộ trình tối ưu...</span>
          </div>
          <button className="size-11 rounded-full bg-white shadow-lg flex items-center justify-center border border-white" onClick={() => navigate(View.DASHBOARD)}>
            <span className="material-symbols-outlined text-slate-700 text-2xl">grid_view</span>
          </button>
        </div>

        <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar pointer-events-auto px-1">
          <button className="flex h-9 shrink-0 items-center gap-2 rounded-full bg-white/95 backdrop-blur-md shadow-md border border-white px-4 active:scale-95 transition-all" onClick={() => navigate(View.CHARGING)}>
            <span className="material-symbols-outlined text-primary text-lg filled">bolt</span>
            <span className="text-slate-700 text-[13px] font-bold">Trạm sạc EV</span>
          </button>
          <button className="flex h-9 shrink-0 items-center gap-2 rounded-full bg-white/95 backdrop-blur-md shadow-md border border-white px-4 active:scale-95 transition-all" onClick={() => navigate(View.BIKE)}>
            <span className="material-symbols-outlined text-blue-600 text-lg">pedal_bike</span>
            <span className="text-slate-700 text-[13px] font-bold">Bãi xe đạp</span>
          </button>
        </div>
      </div>

      <div className="flex-1"></div>

      {/* Floating Toggle Button (Khi ẩn) */}
      {isMinimized && (
        <button 
          className="absolute left-1/2 -translate-x-1/2 bottom-20 z-40 bg-white/90 backdrop-blur-md px-6 py-2.5 rounded-full shadow-2xl border border-white flex items-center gap-2 animate-bounce active:scale-95 transition-all"
          onClick={() => setIsMinimized(false)}
        >
          <span className="material-symbols-outlined text-primary filled">keyboard_double_arrow_up</span>
          <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Hiện dịch vụ</span>
        </button>
      )}

      {/* Bottom Sheet UI - Cực kỳ nhỏ gọn, dưới nửa màn hình */}
      <div className={`bg-white/95 backdrop-blur-xl rounded-t-[40px] shadow-[0_-15px_60px_rgba(0,0,0,0.12)] p-5 pb-8 relative z-30 transition-all duration-500 transform border-t border-white ${isMinimized ? 'translate-y-[85%]' : 'translate-y-0'}`}>
        <div 
          className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-5 cursor-pointer hover:bg-slate-300 transition-colors"
          onClick={() => setIsMinimized(!isMinimized)}
        ></div>
        
        <div className="flex justify-between items-center mb-5 px-1">
          <h2 className="text-[17px] font-black text-slate-900 tracking-tight">Dịch vụ vận tải thông minh</h2>
          <button className="text-[9px] font-black text-primary px-2.5 py-1 bg-primary/10 rounded-lg tracking-widest" onClick={() => navigate(View.PREMIUM)}>PRO</button>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-6">
          <button className="flex flex-col items-center gap-2 group" onClick={() => navigate(View.DASHBOARD)}>
            <div className="size-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center transition-all group-active:scale-90">
              <span className="material-symbols-outlined text-slate-600 text-xl">local_shipping</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400">Xe tải</span>
          </button>
          
          <button className="flex flex-col items-center gap-2 group" onClick={() => navigate(View.CHARGING)}>
            <div className="size-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center transition-all group-active:scale-90">
              <span className="material-symbols-outlined text-slate-600 text-xl">electric_car</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400">Trạm sạc</span>
          </button>

          <button className="flex flex-col items-center gap-2 group" onClick={() => navigate(View.BIKE)}>
            <div className="size-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center transition-all group-active:scale-90">
              <span className="material-symbols-outlined text-slate-600 text-xl">pedal_bike</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400">Xe đạp</span>
          </button>

          <button className="flex flex-col items-center gap-2 group" onClick={() => navigate(View.ANALYSIS)}>
            <div className="size-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center transition-all group-active:scale-90">
              <span className="material-symbols-outlined text-slate-600 text-xl">analytics</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400">Phân tích</span>
          </button>
        </div>

        <button className="w-full bg-primary/5 backdrop-blur-sm border border-primary/10 rounded-2xl p-4 flex items-center justify-between mb-5 group active:scale-[0.98] transition-all" onClick={() => navigate(View.ANALYSIS)}>
          <div className="flex items-center gap-4">
            <div className="bg-primary/20 p-2 rounded-xl">
              <span className="material-symbols-outlined text-primary filled text-xl">eco</span>
            </div>
            <div className="text-left">
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Hiệu quả môi trường</p>
              <p className="text-[14px] font-black text-slate-800 tracking-tight">2.5 kg CO2 <span className="text-primary ml-1 text-[10px]">↑ 12%</span></p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-300 group-hover:translate-x-1 transition-transform">chevron_right</span>
        </button>

        <button 
          className="w-full h-[52px] bg-primary hover:bg-primary-dark text-slate-900 rounded-xl flex items-center justify-center gap-2 font-black text-[15px] shadow-lg shadow-primary/20 transition-all active:scale-[0.97]"
          onClick={() => navigate(View.ROUTE_INPUT)}
        >
          <span className="material-symbols-outlined font-black text-xl">explore</span>
          Bắt đầu hành trình mới
        </button>
      </div>
    </div>
  );
};

export default HomeView;
