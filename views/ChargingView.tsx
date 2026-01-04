
import React, { useState, useEffect, useRef } from 'react';
import { View, RouteState } from '../types';
import { searchHanoiLocationsStructured } from '../services/gemini';
import L from 'leaflet';

interface Props { 
  navigate: (v: View) => void;
  routeState?: RouteState;
  updateRoute?: (u: Partial<RouteState>) => void;
}

export default function ChargingView({ navigate }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [selectedStation, setSelectedStation] = useState<any>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const [currentBattery, setCurrentBattery] = useState<number>(45);
  const [batteryCapacity, setBatteryCapacity] = useState<number>(82);

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

    searchHanoiLocationsStructured('charging').then(locations => {
      setData(locations);
      setLoading(false);
      
      if (mapRef.current) {
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];
        locations.forEach((loc: any) => {
          const marker = L.marker([loc.lat, loc.lng], {
            icon: L.divIcon({
              className: '',
              html: `<div class="bg-primary shadow-xl border-4 border-white rounded-full size-9 flex items-center justify-center text-slate-900 transition-all hover:scale-110 active:scale-90"><span class="material-symbols-outlined text-lg filled">ev_station</span></div>`,
              iconSize: [36, 36],
              iconAnchor: [18, 18]
            })
          })
          .on('click', () => {
            setSelectedStation(loc);
            setIsMinimized(false);
            mapRef.current?.flyTo([loc.lat, loc.lng], 16);
          })
          .addTo(mapRef.current!);
          markersRef.current.push(marker);
        });
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
    <div className="flex-1 flex flex-col relative overflow-hidden bg-white">
      {/* Map Background */}
      <div className="absolute inset-0 z-0">
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>

      {/* Top Search & Header Bar */}
      <div className={`z-10 pt-12 px-5 pb-2 transition-all duration-500 ${isMinimized ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'}`}>
        <div className="flex items-center gap-3 mb-4">
          <button className="size-11 rounded-full bg-white shadow-lg flex items-center justify-center border border-white active:scale-90 transition-transform" onClick={() => navigate(View.HOME)}>
            <span className="material-symbols-outlined text-slate-700">arrow_back</span>
          </button>
          
          <div className="flex-1 bg-white/30 backdrop-blur-xl px-5 h-11 rounded-full shadow-lg border border-white/40 flex items-center justify-center gap-2.5">
             <span className="material-symbols-outlined text-primary filled text-xl">electric_car</span>
             <h1 className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-800">Trạm sạc Hà Nội</h1>
          </div>

          <button className="size-11 rounded-full bg-white shadow-lg flex items-center justify-center border border-white text-slate-700 active:scale-90 transition-transform">
            <span className="material-symbols-outlined">tune</span>
          </button>
        </div>

        <div className="relative shadow-xl rounded-2xl bg-white/60 backdrop-blur-md flex items-center h-12 px-5 border border-white/50 group focus-within:ring-2 focus-within:ring-primary/50 transition-all">
          <span className="material-symbols-outlined text-slate-400 mr-3 text-xl group-focus-within:text-primary">search</span>
          <input type="text" placeholder="Tìm trạm sạc gần đây..." className="flex-1 text-[14px] font-bold border-none focus:ring-0 p-0 bg-transparent placeholder-slate-400 text-slate-900" />
        </div>
      </div>

      <div className="flex-1"></div>

      {/* Details Sheet */}
      <div className={`bg-white rounded-t-[48px] shadow-[0_-25px_100px_rgba(0,0,0,0.15)] px-7 pt-6 pb-10 z-30 transition-all duration-700 ease-out ${isMinimized ? 'translate-y-[88%]' : 'translate-y-0'} max-h-[75vh] overflow-y-auto no-scrollbar relative border-t border-slate-50`}>
        <div className="w-14 h-1 bg-slate-100 rounded-full mx-auto mb-8 cursor-pointer" onClick={() => setIsMinimized(!isMinimized)}></div>
        
        {selectedStation ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
              <div className="inline-flex items-center bg-primary/10 border border-primary/15 px-3 py-1 rounded-lg mb-4">
                <span className="text-[9px] font-black text-primary tracking-[0.15em] uppercase">VINFAST PARTNER</span>
              </div>
              <h2 className="text-[24px] font-black text-slate-900 leading-tight tracking-tight mb-2">{selectedStation.name}</h2>
              <div className="flex items-start gap-1.5 text-slate-400">
                <span className="material-symbols-outlined text-[18px] mt-0.5">location_on</span>
                <p className="text-[13px] font-bold leading-snug">{selectedStation.address}</p>
              </div>
            </div>

            <div className="flex justify-between items-center mb-10 px-2">
              <div className="flex flex-col items-center gap-2">
                <div className="size-13 rounded-full bg-slate-50 flex items-center justify-center text-primary"><span className="material-symbols-outlined text-2xl filled">bolt</span></div>
                <span className="font-black text-slate-900 text-[9px] uppercase">150KW DC</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="size-13 rounded-full bg-slate-50 flex items-center justify-center text-primary"><span className="material-symbols-outlined text-2xl filled">ev_station</span></div>
                <span className="font-black text-slate-900 text-[9px] uppercase text-center leading-none">CCS2 / TYPE 2</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="size-13 rounded-full bg-primary/10 flex items-center justify-center text-primary relative">
                  <div className="size-2.5 rounded-full bg-primary shadow-[0_0_8px_#00E676]"></div>
                </div>
                <span className="font-black text-primary text-[9px] uppercase">SẴN SÀNG (2/4)</span>
              </div>
            </div>

            <div className="bg-[#050910] text-white rounded-[35px] p-7 mb-10 shadow-2xl relative overflow-hidden border border-white/5">
              <h3 className="text-[10px] font-black text-primary flex items-center gap-2 mb-6 uppercase tracking-[0.25em] opacity-80">TÍNH TOÁN THỜI GIAN SẠC</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">PIN HIỆN TẠI</p>
                  <div className="relative group">
                    <input type="number" value={currentBattery} onChange={(e) => setCurrentBattery(Math.min(100, Math.max(0, Number(e.target.value))))} className="w-full bg-white/5 px-6 py-4 rounded-[20px] border border-white/10 font-black text-[22px] text-white focus:ring-1 focus:ring-primary focus:bg-white/10 transition-all outline-none text-center" />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-500 text-lg">%</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">DUNG LƯỢNG</p>
                  <div className="relative group">
                    <input type="number" value={batteryCapacity} onChange={(e) => setBatteryCapacity(Math.max(1, Number(e.target.value)))} className="w-full bg-white/5 px-6 py-4 rounded-[20px] border border-white/10 font-black text-[22px] text-white focus:ring-1 focus:ring-primary focus:bg-white/10 transition-all outline-none text-center" />
                  </div>
                </div>
              </div>
            </div>

            <button className="w-full bg-primary hover:bg-primary-dark text-slate-900 font-black h-[64px] rounded-[22px] shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-[0.97] transition-all text-[16px] mb-4" onClick={() => navigate(View.ROUTE_INPUT)}>
              <span className="material-symbols-outlined font-black text-2xl">directions</span>
              Bắt đầu hành trình (12p)
            </button>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-7 ml-2 opacity-80">TRẠM SẠC GẦN BẠN</h3>
            <div className="space-y-4">
              {data.map((loc, i) => (
                <button key={i} className="w-full flex items-center justify-between p-5 rounded-[2.5rem] bg-white border border-slate-50 shadow-sm hover:border-primary/40 hover:bg-slate-50/50 transition-all text-left active:scale-[0.98] group" onClick={() => {
                  setSelectedStation(loc);
                  mapRef.current?.flyTo([loc.lat, loc.lng], 16);
                }}>
                  <div className="flex items-center gap-5">
                    <div className="size-12 rounded-2xl bg-slate-50 shadow-inner flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-slate-900 transition-colors">
                      <span className="material-symbols-outlined filled text-xl">ev_station</span>
                    </div>
                    <div>
                      <p className="text-[15px] font-black text-slate-900 tracking-tight leading-tight mb-1">{loc.name}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">CÁCH 1.5KM • VINFAST PARTNER</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-slate-200 group-hover:text-primary transition-colors text-xl">chevron_right</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
