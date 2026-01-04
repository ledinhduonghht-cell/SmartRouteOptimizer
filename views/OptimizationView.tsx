
import React, { useState, useEffect } from 'react';
import { View, RouteState, VehicleCategory } from '../types';
import { getSmartRouteAdvice } from '../services/gemini';

interface Props { 
  navigate: (v: View) => void; 
  routeState: RouteState;
  updateRoute: (u: Partial<RouteState>) => void;
}

const OptimizationView: React.FC<Props> = ({ navigate, routeState, updateRoute }) => {
  const [advice, setAdvice] = useState<string>("Đang phân tích lộ trình tốt nhất...");

  useEffect(() => {
    if (routeState.origin && routeState.destination) {
      getSmartRouteAdvice(routeState.origin.name, routeState.destination.name).then(setAdvice);
    }
  }, [routeState.vehicleCategory]);

  const vehicles: { id: VehicleCategory, name: string, icon: string, desc: string }[] = [
    { id: 'EV_CAR', name: 'Ô tô điện', icon: 'electric_car', desc: 'XE CÁ NHÂN' },
    { id: 'VAN', name: 'Xe tải nhỏ', icon: 'airport_shuttle', desc: '< 1.5 TẤN' },
    { id: 'TRUCK_LIGHT', name: 'Xe tải nhẹ', icon: 'local_shipping', desc: '1.5 - 5 TẤN' },
    { id: 'TRUCK_HEAVY', name: 'Xe tải nặng', icon: 'local_shipping', desc: '> 15 TẤN' }
  ];

  const criteria = [
    { id: 'fastest', name: 'Nhanh nhất', icon: 'rocket_launch', desc: 'Tránh ùn tắc Hà Nội.' },
    { id: 'cheapest', name: 'Tiết kiệm nhất', icon: 'payments', desc: 'Tối ưu phí cầu đường (BOT).' },
    { id: 'greenest', name: 'Xanh nhất (AI)', icon: 'eco', desc: 'Giảm phát thải CO2 tối đa.' },
    { id: 'truck', name: 'Lộ trình xe tải', icon: 'map', desc: 'Theo tuyến đường không cấm tải.' }
  ];

  return (
    <div className="flex-1 flex flex-col bg-white h-full overflow-hidden">
      <header className="shrink-0 p-4 flex items-center bg-white border-b z-20">
        <button className="size-10 rounded-full bg-slate-50 flex items-center justify-center active:scale-90 transition-all" onClick={() => navigate(View.ROUTE_INPUT)}>
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </button>
        <h2 className="flex-1 text-center font-black pr-10 text-slate-900 tracking-tight text-lg">Tối ưu hóa hành trình</h2>
      </header>

      <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
        <div className="space-y-8 pb-10">
          <section>
            <div className="flex items-center justify-between mb-5 px-1">
              <h3 className="font-black text-[18px] text-slate-900 tracking-tight">1. Phương tiện vận tải</h3>
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              {vehicles.map((v) => (
                <button 
                  key={v.id} 
                  className={`relative p-4 rounded-[2rem] border-2 text-left transition-all duration-300 ${routeState.vehicleCategory === v.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                  onClick={() => updateRoute({ vehicleCategory: v.id })}
                >
                  <div className={`size-11 rounded-2xl flex items-center justify-center mb-4 transition-colors ${routeState.vehicleCategory === v.id ? 'bg-primary text-slate-900 shadow-glow' : 'bg-slate-50 text-slate-300'}`}>
                    <span className="material-symbols-outlined text-2xl filled">{v.icon}</span>
                  </div>
                  <p className="font-black text-[14px] text-slate-800 leading-tight mb-1">{v.name}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{v.desc}</p>
                  {routeState.vehicleCategory === v.id && (
                     <div className="absolute top-5 right-5 animate-in zoom-in duration-300">
                       <span className="material-symbols-outlined text-primary text-xl filled">check_circle</span>
                     </div>
                  )}
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-5 px-1">
              <h3 className="font-black text-[18px] text-slate-900 tracking-tight">2. Tiêu chí lộ trình</h3>
            </div>
            <div className="space-y-3.5">
              {criteria.map((opt) => (
                <button 
                  key={opt.id}
                  className={`w-full p-4 rounded-[1.8rem] border-2 text-left flex items-center gap-4 transition-all duration-300 ${routeState.optimizedType === opt.id ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-slate-50 bg-white shadow-sm hover:border-slate-100'}`}
                  onClick={() => updateRoute({ optimizedType: opt.id as any })}
                >
                  <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 transition-all ${routeState.optimizedType === opt.id ? 'bg-primary text-slate-900 shadow-glow' : 'bg-slate-50 text-slate-300'}`}>
                    <span className="material-symbols-outlined text-2xl filled">{opt.icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-slate-900 text-[16px] tracking-tight">{opt.name}</p>
                    <p className="text-[12px] text-slate-400 font-medium leading-snug">{opt.desc}</p>
                  </div>
                  {routeState.optimizedType === opt.id && (
                    <div className="animate-in zoom-in duration-300 mr-2">
                      <span className="material-symbols-outlined text-primary text-2xl filled">check_circle</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="shrink-0 p-5 bg-white border-t z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
        <button 
          className="w-full bg-primary hover:bg-primary-dark text-slate-900 font-black py-4.5 rounded-[22px] shadow-glow flex items-center justify-center gap-3 active:scale-95 transition-all text-[16px]" 
          onClick={() => navigate(View.RESULT)}
        >
          <span>Xem gợi ý lộ trình</span>
          <span className="material-symbols-outlined font-black">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};

export default OptimizationView;
