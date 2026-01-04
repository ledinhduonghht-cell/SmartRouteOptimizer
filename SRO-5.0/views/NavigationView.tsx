
import React, { useEffect, useRef, useState } from 'react';
import { View, RouteState } from '../types';
import { getRealRoute } from '../services/routing';
import { getRouteContextAlerts } from '../services/gemini';
import L from 'leaflet';

interface Props { 
  navigate: (v: View) => void;
  routeState: RouteState;
}

interface RouteAlert {
  type: 'accident' | 'construction' | 'weather' | 'broken_road' | 'restriction' | 'traffic';
  title: string;
  detail: string;
  impact: 'low' | 'medium' | 'high';
  distance_mark: number;
}

const NavigationView: React.FC<Props> = ({ navigate, routeState }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  
  const [speed, setSpeed] = useState(0);
  const [eta, setEta] = useState("--:--");
  const [distanceRemaining, setDistanceRemaining] = useState("--");
  const [currentStep, setCurrentStep] = useState("Đang khởi tạo...");
  const [nextStep, setNextStep] = useState("");
  const [isSimulationStarted, setIsSimulationStarted] = useState(false);
  
  const [alerts, setAlerts] = useState<RouteAlert[]>([]);
  const [activeAlert, setActiveAlert] = useState<RouteAlert | null>(null);
  const [showDetailInNav, setShowDetailInNav] = useState(false);

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: true,
        scrollWheelZoom: true
      }).setView([21.0285, 105.8542], 16);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRef.current);
    }

    const startNavigation = async () => {
      if (!mapRef.current || !routeState.origin || !routeState.destination) return;

      getRouteContextAlerts(routeState.origin.name, routeState.destination.name).then(setAlerts);

      const routeData = await getRealRoute(
        [routeState.origin.lat, routeState.origin.lng],
        [routeState.destination.lat, routeState.destination.lng]
      );

      if (routeData) {
        const coords = routeData.coordinates;
        
        if (polylineRef.current) polylineRef.current.remove();
        polylineRef.current = L.polyline(coords, {
          color: '#00E676',
          weight: 10,
          opacity: 0.6,
          lineCap: 'round'
        }).addTo(mapRef.current);

        const navIcon = L.divIcon({
          className: '',
          html: `
            <div class="relative">
              <div class="absolute inset-0 bg-primary/30 rounded-full animate-ping"></div>
              <div class="bg-white size-12 rounded-full flex items-center justify-center shadow-2xl border-4 border-primary relative z-10">
                <span class="material-symbols-outlined text-primary text-3xl filled transition-transform duration-300" id="nav-arrow" style="transform: rotate(0deg)">navigation</span>
              </div>
            </div>
          `,
          iconSize: [48, 48],
          iconAnchor: [24, 24]
        });

        if (markerRef.current) markerRef.current.remove();
        markerRef.current = L.marker(coords[0], { icon: navIcon }).addTo(mapRef.current);
        
        mapRef.current.setView(coords[0], 18);
        setIsSimulationStarted(true);

        let index = 0;
        const totalSteps = coords.length;
        const totalDistKm = routeData.distance / 1000;
        
        const moveInterval = setInterval(() => {
          if (index >= totalSteps - 1) {
            clearInterval(moveInterval);
            setCurrentStep("Đã đến điểm hẹn!");
            setActiveAlert(null);
            setSpeed(0);
            return;
          }

          const currentPos = coords[index];
          const nextPos = coords[index + 1];
          const angle = Math.atan2(nextPos[1] - currentPos[1], nextPos[0] - currentPos[0]) * (180 / Math.PI);
          const arrowEl = document.getElementById('nav-arrow');
          if (arrowEl) arrowEl.style.transform = `rotate(${angle - 45}deg)`;

          markerRef.current?.setLatLng(nextPos);
          mapRef.current?.panTo(nextPos, { animate: true, duration: 0.5 });

          const progress = index / totalSteps;
          const remainingKm = (totalDistKm * (1 - progress)).toFixed(1);
          setDistanceRemaining(remainingKm);
          
          const proximityAlert = alerts.find(a => Math.abs(a.distance_mark - progress) < 0.05);
          if (proximityAlert) {
            if (activeAlert !== proximityAlert) {
              setActiveAlert(proximityAlert);
            }
          } else {
            if (activeAlert) {
              setActiveAlert(null);
              setShowDetailInNav(false);
            }
          }

          let currentBaseSpeed = Math.floor(Math.random() * 10) + 45;
          if (activeAlert) {
            if (activeAlert.impact === 'high') currentBaseSpeed = 5 + Math.random() * 10;
            else if (activeAlert.impact === 'medium') currentBaseSpeed = 20 + Math.random() * 10;
            
            setCurrentStep(activeAlert.title);
            setNextStep(activeAlert.detail);
          } else if (index % 12 === 0) {
            setCurrentStep(`Đi thẳng ${Math.max(100, Math.floor(800 * (1 - progress)))}m`);
            setNextStep(`Chuẩn bị chuyển hướng tiếp theo`);
          }

          setSpeed(Math.round(currentBaseSpeed));
          
          const now = new Date();
          const remainingSeconds = routeData.duration * (1 - progress);
          now.setSeconds(now.getSeconds() + remainingSeconds);
          setEta(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);

          index++;
        }, 800);

        return () => clearInterval(moveInterval);
      }
    };

    if (!isSimulationStarted) {
      startNavigation();
    }
  }, [routeState, alerts]);

  const getAlertIcon = (type: string) => {
    switch(type) {
      case 'accident': return 'warning';
      case 'construction': return 'construction';
      case 'weather': return 'cloudy_snowing';
      case 'broken_road': return 'broken_image';
      case 'restriction': return 'block';
      default: return 'traffic';
    }
  };

  const getAlertColor = (impact: string) => {
    switch(impact) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-orange-500';
      default: return 'text-blue-500';
    }
  };

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-background-dark h-full">
      <div className="absolute inset-0 z-0">
        <div ref={mapContainerRef} className="w-full h-full grayscale-[0.1] brightness-[0.8]" />
      </div>

      <div className="z-10 pt-12 px-4 space-y-3 pointer-events-none">
        <div className={`bg-[#121826]/95 backdrop-blur-xl text-white rounded-3xl shadow-2xl p-5 flex items-center gap-5 border-l-8 pointer-events-auto ring-1 ring-white/10 transition-all duration-500 ${activeAlert ? 'border-red-500' : 'border-primary'}`}>
          <div className="flex flex-col items-center min-w-[65px]">
            {activeAlert ? (
               <span className={`material-symbols-outlined text-5xl filled animate-pulse ${getAlertColor(activeAlert.impact)}`}>{getAlertIcon(activeAlert.type)}</span>
            ) : (
               <span className="material-symbols-outlined text-5xl text-white">navigation</span>
            )}
            <span className={`text-sm font-black mt-1 ${activeAlert ? getAlertColor(activeAlert.impact) : 'text-primary'}`}>{distanceRemaining} km</span>
          </div>
          <div className="h-14 w-px bg-white/10"></div>
          <div className="flex-1 min-w-0">
            <h2 className={`text-[19px] font-black tracking-tight leading-tight mb-1 truncate ${activeAlert ? getAlertColor(activeAlert.impact) : 'text-white'}`}>{currentStep}</h2>
            <p className="text-gray-400 text-[11px] font-black uppercase tracking-widest truncate">{nextStep || 'Lộ trình tối ưu AI'}</p>
          </div>
        </div>

        {activeAlert && (
          <div 
            className={`rounded-2xl shadow-xl p-4 flex flex-col gap-3 bg-white pointer-events-auto animate-in slide-in-from-top duration-500 ring-4 ring-black/5 transition-all ${showDetailInNav ? 'max-h-[300px]' : 'max-h-[80px]'}`}
            onClick={() => setShowDetailInNav(!showDetailInNav)}
          >
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-xl bg-slate-50 flex items-center justify-center shrink-0`}>
                <span className={`material-symbols-outlined filled ${getAlertColor(activeAlert.impact)}`}>{getAlertIcon(activeAlert.type)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-black text-slate-900 leading-tight uppercase tracking-tighter">SỰ CỐ PHÍA TRƯỚC</p>
                <p className="text-[11px] font-bold text-slate-400 leading-tight">Nhấn để xem chi tiết</p>
              </div>
              <span className={`material-symbols-outlined text-slate-300 transition-transform ${showDetailInNav ? 'rotate-180' : ''}`}>expand_more</span>
            </div>
            
            {showDetailInNav && (
              <div className="border-t pt-3 mt-1 animate-in fade-in duration-300">
                <p className="text-[14px] font-black text-slate-900 mb-1">{activeAlert.title}</p>
                <p className="text-[13px] font-medium text-slate-500 leading-relaxed mb-3">{activeAlert.detail}</p>
                <div className="bg-primary/5 p-3 rounded-xl border border-primary/20 flex gap-2 items-center">
                  <span className="material-symbols-outlined text-primary text-sm filled">info</span>
                  <p className="text-[11px] font-black text-primary uppercase">Gợi ý AI: Chậm lại & Chú ý</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-1"></div>

      <div className="bg-white rounded-t-[45px] p-7 pb-12 z-20 shadow-[0_-25px_60px_rgba(0,0,0,0.3)] border-t border-slate-50">
        <div className="w-14 h-1.5 bg-slate-100 rounded-full mx-auto mb-8 cursor-pointer" onClick={() => navigate(View.HOME)}></div>
        
        <div className="flex items-end justify-between mb-8 px-2">
          <div className="flex-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tốc độ hiện tại</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-6xl font-black tracking-tighter transition-colors duration-500 ${speed < 15 ? 'text-red-500' : speed < 30 ? 'text-orange-500' : 'text-slate-900'}`}>{speed}</span>
              <span className="text-lg font-bold text-slate-300">km/h</span>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full mb-4 border border-primary/20">
              <span className="material-symbols-outlined text-sm filled">eco</span>
              <span className="text-[10px] font-black uppercase tracking-tighter">ĐANG TỐI ƯU</span>
            </div>
            <div className="text-right">
              <p className="text-4xl font-black text-slate-900 tracking-tight">{eta}</p>
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest leading-none">THỜI GIAN TỚI NƠI</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <button 
            className="bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-[22px] flex flex-col items-center justify-center py-4.5 transition-all active:scale-95 border border-slate-100" 
            onClick={() => navigate(View.HOME)}
          >
            <span className="material-symbols-outlined text-2xl font-bold">close</span>
            <span className="text-[9px] font-black uppercase mt-1">Hủy</span>
          </button>
          
          <button className="col-span-3 bg-primary hover:bg-primary-dark text-slate-900 rounded-[22px] shadow-glow flex items-center justify-center gap-3 font-black text-[16px] transition-all active:scale-[0.98]">
            <span className="material-symbols-outlined filled text-2xl">search</span>
            Tìm kiếm trên đường đi
          </button>
        </div>
      </div>
    </div>
  );
};

export default NavigationView;
