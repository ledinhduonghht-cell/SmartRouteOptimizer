
import React from 'react';
import { View } from '../types';

interface Props { navigate: (v: View) => void; }

const PremiumView: React.FC<Props> = ({ navigate }) => {
  return (
    <div className="flex-1 flex flex-col bg-background-light dark:bg-background-dark overflow-y-auto no-scrollbar pb-32">
      <header className="sticky top-0 z-50 flex items-center justify-between p-4 bg-white/90 backdrop-blur-md border-b">
        <button className="size-10 rounded-full hover:bg-black/5 flex items-center justify-center" onClick={() => navigate(View.HOME)}><span className="material-symbols-outlined">close</span></button>
        <h2 className="flex-1 text-center font-bold pr-10">Gói Premium</h2>
      </header>

      <div className="p-6 text-center">
        <h1 className="text-2xl font-black mb-2">Nâng cấp trải nghiệm vận tải</h1>
        <p className="text-sm text-gray-500">Tối ưu chi phí và giảm khí thải với AI</p>
      </div>

      <div className="px-4 mb-8">
        <div className="bg-slate-200 p-1 rounded-xl flex">
          <button className="flex-1 bg-white shadow-sm py-2.5 rounded-lg text-xs font-bold text-primary">Thanh toán tháng</button>
          <button className="flex-1 py-2.5 rounded-lg text-xs font-bold text-gray-500">Năm <span className="text-green-600 bg-green-100 px-1 py-0.5 rounded ml-1">-17%</span></button>
        </div>
      </div>

      <div className="px-4 space-y-4">
        <div className="bg-white dark:bg-surface-dark p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><span className="material-symbols-outlined text-[100px] text-primary">person</span></div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2"><span className="material-symbols-outlined text-primary">person</span>Gói Cá nhân</h3>
            <span className="text-[10px] font-bold uppercase bg-slate-100 px-2 py-1 rounded">Phổ biến</span>
          </div>
          <p className="flex items-baseline gap-1 mb-6">
            <span className="text-4xl font-black">49.000 đ</span>
            <span className="text-gray-400 text-sm">/tháng</span>
          </p>
          <button className="w-full bg-primary py-4 rounded-2xl font-black text-slate-900 shadow-lg shadow-primary/20 mb-6">Đăng ký ngay</button>
          <div className="space-y-3">
            {['Tối ưu lộ trình AI đa điểm', 'Báo cáo khí thải chi tiết', 'Lịch sử chuyến đi 30 ngày'].map((f, i) => (
              <div key={i} className="flex gap-3 text-xs text-gray-600"><span className="material-symbols-outlined text-green-500 text-sm">check_circle</span>{f}</div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden border-2 border-primary/20">
          <div className="absolute top-0 inset-x-0 h-1 bg-primary"></div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2"><span className="material-symbols-outlined text-primary">domain</span>Gói Doanh nghiệp</h3>
            <span className="text-[10px] font-bold uppercase bg-primary text-slate-900 px-2 py-1 rounded">Tốt nhất</span>
          </div>
          <p className="flex items-baseline gap-1 mb-6">
            <span className="text-4xl font-black">299.000 đ</span>
            <span className="text-gray-400 text-sm">/tháng</span>
          </p>
          <button className="w-full bg-white text-slate-900 py-4 rounded-2xl font-black mb-6">Nâng cấp ngay</button>
          <div className="space-y-3">
            {['Quản lý đội xe không giới hạn', 'Phân tích Logistics chuyên sâu', 'API tích hợp hệ thống', 'Hỗ trợ kỹ thuật 24/7'].map((f, i) => (
              <div key={i} className="flex gap-3 text-xs text-gray-400"><span className="material-symbols-outlined text-primary text-sm">check_circle</span>{f}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-12 text-center px-8 opacity-50">
        <p className="text-[10px] leading-relaxed">Thanh toán bảo mật qua Apple Pay hoặc Thẻ tín dụng. Hủy gói bất kỳ lúc nào trong phần cài đặt.</p>
        <div className="flex justify-center gap-4 mt-2">
          <button className="text-[10px] underline">Điều khoản</button>
          <button className="text-[10px] underline">Bảo mật</button>
        </div>
      </div>
    </div>
  );
};

export default PremiumView;
