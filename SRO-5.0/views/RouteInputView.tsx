
import React, { useState, useEffect, useRef } from 'react';
import { View, RouteState, MapLocation } from '../types';
import { reverseGeocode, searchLocations } from '../services/gemini';
import L from 'leaflet';

interface Props { 
  navigate: (v: View) => void; 
  routeState: RouteState;
  updateRoute: (u: Partial<RouteState>) => void;
}

const RouteInputView: React.FC<Props> = ({ navigate, routeState, updateRoute }) => {
  const [activeTab, setActiveTab] = useState<'origin' | 'destination'>('destination');
  const [isMinimized, setIsMinimized] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const originMarkerRef = useRef<L.Marker | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.length > 2) {
      setIsSearching(true);
      const results = await searchLocations(val);
      setSuggestions(results);
    } else {
      setSuggestions([]);
      setIsSearching(false);
    }
  };

  const selectSuggestion = (s: any) => {
    const lat = parseFloat(s.lat);
    const lng = parseFloat(s.lon);
    const name = s.display_name.split(',')[0];
    const newLoc: MapLocation = { id: Date.now().toString(), name, lat, lng, type: activeTab };
    
    if (activeTab === 'origin') updateRoute({ origin: newLoc });
    else updateRoute({ destination: newLoc });
    
    mapRef.current?.flyTo([lat, lng], 16);
    setSearchQuery('');
    setSuggestions([]);
    setIsSearching(false);
  };

  const locateMe = () => {
    if (navigator.geolocation && mapRef.current) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        const address = await reverseGeocode(latitude, longitude);
        updateRoute({ origin: { id: 'gps', name: address, lat: latitude, lng: longitude, type: 'origin' } });
        mapRef.current?.flyTo([latitude, longitude], 16);
      });
    }
  };

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([21.0285, 105.8542], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRef.current);

      mapRef.current.on('click', async (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        const address = await reverseGeocode(lat, lng);
        const newLoc: MapLocation = { id: Date.now().toString(), name: address, lat, lng, type: activeTab };
        
        if (activeTab === 'origin') updateRoute({ origin: newLoc });
        else updateRoute({ destination: newLoc });
      });
    }
  }, [activeTab]);

  useEffect(() => {
    if (mapRef.current) {
      if (routeState.origin) {
        if (!originMarkerRef.current) {
          originMarkerRef.current = L.marker([routeState.origin.lat, routeState.origin.lng], {
            icon: L.divIcon({ className: '', html: `<div class="bg-primary size-5 rounded-full border-4 border-white shadow-glow"></div>`, iconSize: [20, 20], iconAnchor: [10, 10] })
          }).addTo(mapRef.current);
        } else originMarkerRef.current.setLatLng([routeState.origin.lat, routeState.origin.lng]);
      }
      if (routeState.destination) {
        if (!destMarkerRef.current) {
          destMarkerRef.current = L.marker([routeState.destination.lat, routeState.destination.lng], {
            icon: L.divIcon({ className: '', html: `<div class="bg-blue-500 size-6 rounded-full border-4 border-white shadow-lg flex items-center justify-center"><span class="material-symbols-outlined text-white text-[12px] filled">location_on</span></div>`, iconSize: [24, 24], iconAnchor: [12, 12] })
          }).addTo(mapRef.current);
        } else destMarkerRef.current.setLatLng([routeState.destination.lat, routeState.destination.lng]);
      }
    }
  }, [routeState.origin, routeState.destination]);

  return (
    <div className="flex-1 flex flex-col relative bg-white overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>

      <div className="relative z-10 pt-12 px-4 pointer-events-none space-y-4">
        <div className="flex items-center justify-between">
          <button className="size-11 rounded-full bg-white shadow-xl flex items-center justify-center border pointer-events-auto active:scale-90" onClick={() => navigate(View.HOME)}>
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          
          <div className="bg-white/95 backdrop-blur-md p-1 rounded-full shadow-xl flex gap-1 pointer-events-auto border">
            <button 
              className={`text-[11px] font-black uppercase px-6 py-2.5 rounded-full transition-all ${activeTab === 'origin' ? 'bg-primary text-slate-900 shadow-sm' : 'text-slate-400'}`}
              onClick={() => setActiveTab('origin')}
            >ĐIỂM ĐI</button>
            <button 
              className={`text-[11px] font-black uppercase px-6 py-2.5 rounded-full transition-all ${activeTab === 'destination' ? 'bg-primary text-slate-900 shadow-sm' : 'text-slate-400'}`}
              onClick={() => setActiveTab('destination')}
            >ĐIỂM ĐẾN</button>
          </div>

          <button className="size-11 rounded-full bg-white shadow-xl flex items-center justify-center border text-blue-500 pointer-events-auto active:scale-90" onClick={locateMe}>
            <span className="material-symbols-outlined filled">my_location</span>
          </button>
        </div>

        {/* Search Bar with Suggestions - Style from Image 3 */}
        <div className="pointer-events-auto relative max-w-sm mx-auto w-full">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 flex items-center px-4 h-14">
            <span className="material-symbols-outlined text-slate-300 mr-3">add</span>
            <input 
              type="text" 
              className="flex-1 bg-transparent border-none focus:ring-0 text-[15px] font-semibold placeholder-slate-300" 
              placeholder={activeTab === 'origin' ? "Tìm điểm xuất phát..." : "Tìm điểm đến..."}
              value={searchQuery}
              onChange={handleSearchChange}
            />
            {isSearching && <span className="material-symbols-outlined text-primary animate-spin">autorenew</span>}
          </div>

          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[100] animate-in slide-in-from-top-2 duration-300">
              {suggestions.map((s, i) => (
                <button 
                  key={i} 
                  className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 text-left border-b border-slate-50 last:border-none"
                  onClick={() => selectSuggestion(s)}
                >
                  <span className="material-symbols-outlined text-slate-400">search</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-slate-900 truncate">{s.display_name.split(',')[0]}</p>
                    <p className="text-[11px] font-medium text-slate-400 truncate">{s.display_name.split(',').slice(1).join(',').trim()}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1"></div>

      <div className={`bg-white rounded-t-[32px] shadow-[0_-20px_50px_rgba(0,0,0,0.1)] p-6 relative z-10 transition-transform ${isMinimized ? 'translate-y-[80%]' : 'translate-y-0'}`}>
        <div className="w-12 h-1 bg-slate-100 rounded-full mx-auto mb-6 cursor-pointer" onClick={() => setIsMinimized(!isMinimized)}></div>
        
        <div className="space-y-4 mb-8">
          <div className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-4 cursor-pointer ${activeTab === 'origin' ? 'border-primary bg-primary/5 shadow-sm' : 'border-slate-50 bg-slate-50 opacity-60'}`} onClick={() => setActiveTab('origin')}>
            <div className="size-2.5 rounded-full bg-primary ring-4 ring-primary/10"></div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">ĐIỂM XUẤT PHÁT</p>
              <p className="text-[15px] font-black text-slate-900 truncate">{routeState.origin?.name || 'Nhấn vào bản đồ hoặc tìm kiếm...'}</p>
            </div>
          </div>

          <div className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-4 cursor-pointer ${activeTab === 'destination' ? 'border-primary bg-primary/5 shadow-sm' : 'border-slate-100 bg-white shadow-sm'}`} onClick={() => setActiveTab('destination')}>
            <span className="material-symbols-outlined text-primary filled text-2xl">location_on</span>
            <div className="flex-1 overflow-hidden">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">ĐIỂM ĐẾN</p>
              <p className="text-[15px] font-black text-slate-900 truncate">{routeState.destination?.name || 'Chọn điểm đến...'}</p>
            </div>
          </div>
        </div>

        <button 
          className={`w-full bg-primary text-slate-900 rounded-[20px] py-4.5 flex items-center justify-center gap-3 font-black shadow-lg shadow-primary/20 transition-all ${(!routeState.origin || !routeState.destination) ? 'opacity-40 grayscale pointer-events-none' : 'active:scale-95'}`}
          onClick={() => navigate(View.OPTIMIZATION)}
        >
          <span>Tiếp tục: Tối ưu hành trình</span>
          <span className="material-symbols-outlined font-black">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};

export default RouteInputView;
