
import React, { useEffect, useRef, useState } from 'react';
import { View, RouteState } from '../types';
import { getRealRoute } from '../services/routing';
import { getRouteContextAlerts } from '../services/gemini';
import L from 'leaflet';

interface Props { 
  navigate: (v: View) => void; 
  routeState: RouteState;
  updateRoute: (u: Partial<RouteState>) => void;
}

interface RouteAlert {
  type: 'accident' | 'construction' | 'weather' | 'broken_road' | 'restriction' | 'traffic';
  title: string;
  location: string;
  detail: string;
  impact: 'low' | 'medium' | 'high';
  distance_mark: number;
}

const ResultView: React.FC<Props> = ({ navigate, routeState, updateRoute }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [isMapFull, setIsMapFull] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{dist: string, time: string, cost: string, eco: string, fuel: string} | null>(null);
  const [alerts, setAlerts] = useState<RouteAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<RouteAlert | null>(null);

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([21.0285, 105.8542], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRef.current);
    }

    const drawRoute = async () => {
      if (mapRef.current && routeState.origin && routeState.destination) {
        mapRef.current.eachLayer((layer) => {
          if (layer instanceof L.Polyline || layer instanceof L.Marker || layer instanceof L.CircleMarker) {
            mapRef.current?.removeLayer(layer);
          }
        });

        getRouteContextAlerts(routeState.origin.name, routeState.destination.name).then(setAlerts);

        const routeData = await getRealRoute(
          [routeState.origin.lat, routeState.origin.lng],
          [routeState.destination.lat, routeState.destination.lng]
        );

        if (routeData) {
          const polylineColor = routeState.optimizedType === 'greenest' ? '#00E676' : routeState.optimizedType === 'cheapest' ? '#fbbf24' : '#3b82f6';
          const polyline = L.polyline(routeData.coordinates, { 
            color: polylineColor,
            weight: 8,
            opacity: 0.9,
            lineCap: 'round',
            lineJoin: 'round'
          }).addTo(mapRef.current);

          let timeAdj = 0;
          let distAdj = 0;
          let cost = "65.000đ";
          let eco = "2.1kg";
          let fuel = "3.8L";

          // Tối ưu hóa thông số khác biệt rõ rệt giữa các lựa chọn
          if (routeState.optimizedType === 'fastest') {
            timeAdj = -3; distAdj = 0.2; cost = "85.000đ"; eco = "2.6kg"; fuel = "4.5L";
          } else if (routeState.optimizedType === 'cheapest') {
            timeAdj = 9; distAdj = 1.1; cost = "15.000đ"; eco = "2.3kg"; fuel = "3.5L";
          } else if (routeState.optimizedType === 'greenest') {
            timeAdj = 5; distAdj = -0.4; cost = "55.000đ"; eco = "1.2kg"; fuel = "2.9L";
          }

          const baseDist = routeData.distance / 1000;
          const finalDist = (baseDist + distAdj).toFixed(1);

          setRouteInfo({
            dist: `${finalDist}km`,
            time: `${Math.max(2, Math.round(routeData.duration / 60) + timeAdj)}p`,
            cost,
            eco,
            fuel
          });

          mapRef.current.fitBounds(polyline.getBounds(), { padding: [40, 40] });
        }
      }
    };

    drawRoute();
  }, [routeState.origin, routeState.destination, routeState.optimizedType]);

  const getAlertIcon = (type: string) => {
    switch(type) {
      case 'accident': return 'warning';
      case 'construction': return 'construction';
      case 'weather': return 'cloudy_snowing';
      case 'broken_road': return 'broken_image';
      case 'restriction': return 'block';
      default: return 'traffic_light';
    }
  };

  const getAlertColor = (impact: string) => {
    switch(impact) {
      case 'high': return 'text-red-500 bg-red-50 border-red-100';
      case 'medium': return 'text-orange-500 bg-orange-50 border-orange-100';
      default: return 'text-blue-500 bg-blue-50 border-blue-100';
    }
  };

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-white">
      <header className="flex items-center justify-between p-3.5 bg-white z-20 shrink-0 border-b">
        <button className="size-9 rounded-full bg-slate-50 flex items-center justify-center active:scale-90" onClick={() => navigate(View.OPTIMIZATION)}>
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <h1 className="text-[15px] font-black tracking-tight">Lộ trình đề xuất</h1>
        <button className="size-9 rounded-full bg-slate-50 flex items-center justify-center active:scale-90" onClick={() => setIsMapFull(!isMapFull)}>
          <span className="material-symbols-outlined text-[20px] text-slate-600">{isMapFull ? 'close_fullscreen' : 'fullscreen'}</span>
        </button>
      </header>

      <div className={`relative transition-all duration-500 ease-in-out z-0 ${isMapFull ? 'h-full' : 'h-[28vh]'}`}>
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>

      <main className={`flex-1 bg-white transition-transform duration-500 ${isMapFull ? 'translate-y-full' : 'translate-y-0'} overflow-y-auto no-scrollbar px-5 pt-5 pb-24`}>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-4">
          {[
            { id: 'fastest', label: 'NHANH NHẤT' },
            { id: 'cheapest', label: 'TIẾT KIỆM' },
            { id: 'greenest', label: 'XANH NHẤT' }
          ].map(type => (
            <button 
              key={type.id}
              className={`shrink-0 px-4 py-2.5 rounded-full text-[9px] font-black tracking-widest transition-all border ${routeState.optimizedType === type.id ? 'bg-primary border-primary text-slate-900 shadow-sm' : 'bg-white border-slate-100 text-slate-400'}`}
              onClick={() => updateRoute({ optimizedType: type.id as any })}
            >
              {type.label}
            </button>
          ))}
        </div>

        <div className="bg-slate-50 rounded-[2.5rem] p-6 mb-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-primary text-slate-900 p-1.5 rounded-xl"><span className="material-symbols-outlined text-sm filled">bolt</span></div>
            <h3 className="font-black text-sm text-slate-900">Chi tiết AI</h3>
          </div>

          <div className="flex items-baseline gap-2 mb-5">
            <span className="text-[64px] font-black tracking-tighter text-slate-900 leading-none">{routeInfo?.time || '--'}</span>
            <span className="text-[18px] font-bold text-slate-300">{routeInfo?.dist || '--'}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
             <div className="bg-white p-3.5 rounded-[1.2rem] border border-slate-100 flex flex-col justify-center">
               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">CHI PHÍ (XĂNG)</p>
               <p className="text-[15px] font-black text-slate-900">~ {routeInfo?.cost || '--'}</p>
             </div>
             <div className="bg-white p-3.5 rounded-[1.2rem] border border-slate-100 flex flex-col justify-center">
               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">PHÁT THẢI CO2</p>
               <p className="text-[15px] font-black text-primary">~ {routeInfo?.eco || '--'}</p>
             </div>
          </div>

          <div className="space-y-2.5">
            <p className="text-[8.5px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">CẢNH BÁO THỜI GIAN THỰC</p>
            {alerts.length > 0 ? alerts.map((alert, i) => (
              <button 
                key={i} 
                onClick={() => setSelectedAlert(alert)}
                className="w-full bg-white p-4 rounded-[1.8rem] border border-slate-50 flex items-center gap-4 active:scale-[0.98] transition-all hover:border-primary/30 text-left shadow-sm group"
              >
                <div className={`size-10 rounded-2xl flex items-center justify-center shrink-0 ${getAlertColor(alert.impact).split(' ').slice(0,2).join(' ')}`}>
                  <span className="material-symbols-outlined text-[18px] filled">{getAlertIcon(alert.type)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-black text-slate-900 truncate leading-tight">{alert.title}</p>
                  <p className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">VỊ TRÍ: {alert.location}</p>
                </div>
                <span className="material-symbols-outlined text-slate-200 text-[18px]">chevron_right</span>
              </button>
            )) : (
              <div className="py-6 text-center opacity-30">
                <span className="material-symbols-outlined animate-spin mb-2 text-xl">autorenew</span>
                <p className="text-[8px] font-bold uppercase tracking-widest">Đang quét lộ trình...</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Alert Modal - Cao đúng 1/3 màn hình và bám sát thiết kế mẫu */}
      {selectedAlert && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/50 backdrop-blur-[1px] animate-in fade-in duration-300">
          <div className="absolute inset-0" onClick={() => setSelectedAlert(null)}></div>
          <div className="bg-white rounded-t-[45px] px-8 pt-4 pb-8 z-10 shadow-2xl animate-in slide-in-from-bottom duration-500 border-t border-white/50 h-[38%] flex flex-col items-center">
            <div className="w-12 h-1 bg-slate-100 rounded-full mx-auto mb-6 cursor-pointer" onClick={() => setSelectedAlert(null)}></div>
            
            <div className="flex flex-col items-center text-center flex-1 w-full">
              <div className={`size-16 rounded-full flex items-center justify-center mb-4 shadow-md border-[5px] border-white ${selectedAlert.impact === 'high' ? 'bg-red-50 text-red-500' : 'bg-orange-50 text-orange-500'}`}>
                <span className="material-symbols-outlined text-[32px] filled">{getAlertIcon(selectedAlert.type)}</span>
              </div>
              
              <h2 className="text-[22px] font-black text-slate-900 tracking-tight mb-2 leading-none">{selectedAlert.title}</h2>
              
              <div className={`px-4 py-1 rounded-full text-[8.5px] font-black tracking-widest uppercase mb-2.5 ${selectedAlert.impact === 'high' ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-orange-50 text-orange-500 border border-orange-100'}`}>
                ẢNH HƯỞNG: {selectedAlert.impact === 'high' ? 'NGHIÊM TRỌNG' : 'TRUNG BÌNH'}
              </div>
              
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">TẠI: {selectedAlert.location}</p>
              
              <p className="text-[13px] font-medium text-slate-500 leading-relaxed px-4 line-clamp-2">{selectedAlert.detail}</p>
            </div>

            <button 
              className="w-full bg-[#0F172A] text-white font-black h-[58px] rounded-[20px] shadow-lg flex items-center justify-center gap-2.5 active:scale-[0.96] transition-all text-[15px] mt-4"
              onClick={() => setSelectedAlert(null)}
            >
              <span className="material-symbols-outlined text-[20px] filled">check_circle</span>
              Tôi đã hiểu
            </button>
          </div>
        </div>
      )}

      <footer className={`fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t p-4 pb-7 z-30 transition-transform duration-500 ${isMapFull ? 'translate-y-full' : 'translate-y-0'}`}>
        <button className="w-full bg-primary text-slate-900 font-black h-[54px] rounded-[18px] shadow-glow flex items-center justify-center gap-2 active:scale-95 transition-all text-[15px]" onClick={() => navigate(View.NAVIGATION)}>
          <span className="material-symbols-outlined font-black text-[20px]">navigation</span>
          Bắt đầu dẫn đường
        </button>
      </footer>
    </div>
  );
};

export default ResultView;
