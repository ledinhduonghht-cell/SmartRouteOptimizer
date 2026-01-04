
import React from 'react';
import { View } from '../types';

interface Props { navigate: (v: View) => void; }

const AnalysisView: React.FC<Props> = ({ navigate }) => {
  return (
    <div className="flex-1 flex flex-col bg-background-light dark:bg-background-dark overflow-y-auto no-scrollbar pb-24">
      <header className="sticky top-0 z-50 flex items-center justify-between bg-white/90 backdrop-blur-md px-4 py-3 border-b">
        <button className="size-10 rounded-full hover:bg-black/5 flex items-center justify-center" onClick={() => navigate(View.HOME)}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold">Phân tích chuyến đi</h1>
        <button className="size-10 rounded-full hover:bg-black/5 flex items-center justify-center"><span className="material-symbols-outlined">share</span></button>
      </header>

      <div className="p-4 space-y-6">
        <div className="relative aspect-[2/1] rounded-2xl overflow-hidden shadow-md">
          <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuB4ulxGl76Mq7lKDYdssONVYv8sO6mBbEWxVidppFPTdUQ4_PgFTsXcBcMGhrCuRnDTcCJ0IBbGAuakpzXE8tm-81nakykmoLApZkcGEn5Iidc3wt5tpYWZV0PYUiT9hoSAP3hg3BUQ8ovTeNshI2qufVG2kfHttENXT0DCc8tGuRHM6nUbHOBcVat-qtB2sSPTLjXd1bkYQze9we3UPx2sgSKxhfxFnxjUj-GqQS-UUw8hb7SXr66JL-UtyLdTolDtRFAtzeZ7YhM" className="w-full h-full object-cover" alt="Route" />
          <div className="absolute bottom-3 left-3 bg-white px-3 py-1.5 rounded-lg shadow-md flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-primary animate-pulse"></span>
            <span className="text-xs font-bold text-slate-800">Hoàn thành</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Thời gian', val: '45', unit: 'phút', icon: 'schedule', color: 'primary' },
            { label: 'Nhiên liệu', val: '3.5', unit: 'Lít', icon: 'local_gas_station', color: 'blue-500' },
            { label: 'Chi phí', val: '150k', unit: 'VND', icon: 'payments', color: 'yellow-600' },
            { label: 'CO2 phát thải', val: '8.2', unit: 'kg', icon: 'eco', color: 'primary', eco: '-12%' }
          ].map((stat, i) => (
            <div key={i} className={`bg-white dark:bg-surface-dark p-4 rounded-2xl shadow-sm border border-gray-100 ${stat.eco ? 'ring-1 ring-primary/30' : ''}`}>
              <div className="flex items-start justify-between mb-2">
                <span className="text-gray-400 text-xs font-bold uppercase">{stat.label}</span>
                <span className={`material-symbols-outlined text-${stat.color} text-[20px]`}>{stat.icon}</span>
              </div>
              <p className="text-xl font-bold">{stat.val} <span className="text-xs font-normal text-gray-500">{stat.unit}</span></p>
              {stat.eco && <p className="text-[10px] font-bold text-primary mt-1">{stat.eco} so với TB</p>}
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-surface-dark p-5 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-sm mb-4">So sánh hiệu quả</h3>
          <div className="flex gap-4 mb-6 text-[10px] font-bold uppercase tracking-widest">
            <div className="flex items-center gap-1.5"><div className="size-3 rounded-full bg-gray-200"></div><span className="text-gray-400">Thực tế</span></div>
            <div className="flex items-center gap-1.5"><div className="size-3 rounded-full bg-primary"></div><span className="text-primary">Đề xuất</span></div>
          </div>
          <div className="flex items-end justify-around h-32 pt-2 border-b border-gray-100">
            <div className="flex gap-2 items-end">
              <div className="w-8 bg-gray-200 h-24 rounded-t-sm"></div>
              <div className="w-8 bg-primary h-20 rounded-t-sm"></div>
            </div>
            <div className="flex gap-2 items-end">
              <div className="w-8 bg-gray-200 h-20 rounded-t-sm"></div>
              <div className="w-8 bg-primary h-14 rounded-t-sm"></div>
            </div>
          </div>
          <div className="flex justify-around mt-2 text-[10px] font-bold text-gray-400 uppercase">
            <span>Chi phí</span>
            <span>CO2</span>
          </div>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl shadow-xl relative overflow-hidden text-white">
          <div className="absolute -right-10 -bottom-10 size-40 bg-primary/20 rounded-full blur-3xl"></div>
          <div className="flex gap-4 items-start relative z-10">
            <div className="bg-white/10 p-2 rounded-xl"><span className="material-symbols-outlined text-primary">emoji_events</span></div>
            <div>
              <h4 className="font-bold text-sm mb-1">Thành tích Xanh</h4>
              <p className="text-xs text-gray-400 leading-relaxed">Tuyệt vời! Bạn đã cắt giảm được <span className="text-primary font-bold">12%</span> lượng khí thải so với lộ trình thông thường.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-lg border-t z-50">
        <button className="w-full bg-primary hover:bg-primary-dark text-slate-900 font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2" onClick={() => navigate(View.HOME)}>
          Hoàn thành chuyến đi
          <span className="material-symbols-outlined">check_circle</span>
        </button>
      </div>
    </div>
  );
};

export default AnalysisView;
