
import React, { useState, useEffect, useRef } from 'react';
import { View } from '../types';
import { searchHanoiLocationsStructured } from '../services/gemini';
import L from 'leaflet';

interface Props {
  navigate: (v: View) => void;
}

export default function BikeView({ navigate }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [selectedStation, setSelectedStation] = useState<any>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([21.0285, 105.8542], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRef.current);
    }

    searchHanoiLocationsStructured('bike').then(locations => {
      setData(locations);
      setLoading(false);
      
      if (mapRef.current) {
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];

        const bounds = L.latLngBounds([]);
        locations.forEach((loc: any) => {
          const marker = L.marker([loc.lat, loc.lng], {
            icon: L.divIcon({
              className: 'custom-bike-icon',
              html: `<div class="bg-blue-600 shadow-lg border-2 border-white rounded-full size-8 flex items-center justify-center text-white"><span class="material-symbols-outlined text-lg">pedal_bike</span></div>`,
              iconSize: [32, 32],
              iconAnchor: [16, 16]
            })
          })
          .on('click', () => {
            setSelectedStation(loc);
            setIsMinimized(false);
            mapRef.current?.flyTo([loc.lat, loc.lng], 16);
          })
          .addTo(mapRef.current!);
          
          markersRef.current.push(marker);
          bounds.extend([loc.lat, loc.lng]);
        });

        if (locations.length > 0) {
          mapRef.current.fitBounds(bounds, { padding: [50, 50] });
        }
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-50">
      {/* Map Background */}
      <div className="absolute inset-0 z-0">
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>

      {/* Top Header - Đồng bộ với ChargingView */}
      <div className={`z-10 pt-12 px-5 transition-all duration-500 ${isMinimized ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'}`}>
        <div className="flex items-center gap-3">
          <button className="size-11 rounded-full bg-white shadow-lg flex items-center justify-center border border-white active:scale-90" onClick={() => navigate(View.HOME)}>
            <span className="material-symbols-outlined text-slate-700">arrow_back</span>
          </button>
          
          <div className="flex-1 bg-white/30 backdrop-blur-xl px-5 h-11 rounded-full shadow-lg border border-white/40 flex items-center justify-center gap-2.5">
             <span className="material-symbols-outlined text-blue-600 text-xl">pedal_bike</span>
             <h1 className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-800">Bãi xe đạp TNGo</h1>
          </div>

          <div className="size-11"></div>
        </div>
      </div>

      <div className="flex-1"></div>

      {/* Floating Toggle Button */}
      <button 
        className="absolute right-5 bottom-[42%] z-20 size-12 rounded-full bg-white shadow-2xl border flex items-center justify-center text-slate-400 transition-all active:scale-90"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <span className="material-symbols-outlined text-2xl">{isMinimized ? 'expand_less' : 'expand_more'}</span>
      </button>

      {/* Details Sheet - Cỡ chữ tinh chỉnh nhỏ gọn */}
      <div className={`bg-white rounded-t-[48px] shadow-[0_-25px_100px_rgba(0,0,0,0.15)] px-7 pt-6 pb-12 z-30 transition-all duration-700 ease-out ${isMinimized ? 'translate-y-[88%]' : 'translate-y-0'} max-h-[70vh] overflow-y-auto no-scrollbar relative border-t border-slate-50`}>
        <div className="w-14 h-1 bg-slate-100 rounded-full mx-auto mb-8 cursor-pointer hover:bg-slate-200" onClick={() => setIsMinimized(!isMinimized)}></div>
        
        {selectedStation ? (
          <div className="animate-in fade-in slide-in-from-bottom-2">
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1 pr-4">
                <h3 className="text-[22px] font-black text-slate-900 leading-tight mb-2">{selectedStation.name}</h3>
                <p className="text-[13px] font-bold text-slate-400 leading-snug">{selectedStation.address}</p>
              </div>
              <button className="text-slate-200 hover:text-red-500 transition-colors" onClick={() => setSelectedStation(null)}><span className="material-symbols-outlined">close</span></button>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mb-10">
              <div className="bg-slate-50 p-4 rounded-[1.8rem] text-center border border-slate-100 shadow-sm">
                <span className="material-symbols-outlined text-blue-600 mb-2 text-xl">pedal_bike</span>
                <p className="text-xl font-black text-slate-900">12</p>
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Sẵn có</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-[1.8rem] text-center border border-slate-100 shadow-sm">
                <span className="material-symbols-outlined text-slate-400 mb-2 text-xl">dock</span>
                <p className="text-xl font-black text-slate-900">08</p>
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Trống</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-[1.8rem] text-center border border-slate-100 shadow-sm">
                <span className="material-symbols-outlined text-primary mb-2 text-xl">payments</span>
                <p className="text-xl font-black text-slate-900">5k</p>
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">/30ph</p>
              </div>
            </div>

            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black h-[64px] rounded-[22px] shadow-xl shadow-blue-200 flex items-center justify-center gap-3 transition-all active:scale-[0.97] text-[16px]">
              <span className="material-symbols-outlined font-bold text-2xl">qr_code_scanner</span>
              Quét mã để thuê ngay
            </button>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-7 ml-2 opacity-80">BÃI XE GẦN BẠN</h3>
            <div className="space-y-4">
              {loading ? (
                [1,2,3,4].map(i => <div key={i} className="h-16 bg-slate-50 animate-pulse rounded-[2rem]"></div>)
              ) : (
                data.map((loc, i) => (
                  <button key={i} className="w-full flex items-center justify-between p-5 rounded-[2.5rem] bg-white border border-slate-50 shadow-sm hover:border-blue-200 hover:bg-slate-50/50 transition-all text-left group" onClick={() => {
                    setSelectedStation(loc);
                    mapRef.current?.flyTo([loc.lat, loc.lng], 16);
                  }}>
                    <div className="flex items-center gap-5">
                      <div className="size-12 rounded-2xl bg-slate-50 shadow-inner flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-xl">pedal_bike</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-[15px] font-black text-slate-900 tracking-tight leading-tight mb-1">{loc.name}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">CÁCH 0.8KM • TNGO HÀ NỘI</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-slate-200 group-hover:text-blue-600 transition-colors text-xl">chevron_right</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
