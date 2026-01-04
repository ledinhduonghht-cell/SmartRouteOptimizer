
import React from 'react';
import { View } from '../types';

interface Props { navigate: (v: View) => void; user: { name: string, role: string }; }

const ProfileView: React.FC<Props> = ({ navigate, user }) => {
  return (
    <div className="flex-1 flex flex-col bg-background-light dark:bg-background-dark pb-24">
      <header className="sticky top-0 z-30 flex items-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 border-b">
        <button className="size-10 rounded-full hover:bg-black/5 flex items-center justify-center" onClick={() => navigate(View.HOME)}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="flex-1 text-center font-bold pr-10">Thông tin cá nhân</h2>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="flex flex-col items-center pt-8 pb-6">
          <div className="relative group cursor-pointer">
            <div className="size-28 rounded-full bg-cover bg-center ring-4 ring-white shadow-lg" style={{ backgroundImage: 'url("https://picsum.photos/200")' }}></div>
            <div className="absolute bottom-0 right-0 bg-primary size-9 rounded-full border-4 border-background-light flex items-center justify-center text-slate-900 shadow-sm"><span className="material-symbols-outlined text-[18px]">photo_camera</span></div>
          </div>
          <div className="mt-4 text-center">
            <h1 className="text-xl font-bold">{user.name}</h1>
            <div className="flex items-center gap-1 mt-1 px-3 py-1 bg-primary/10 rounded-full">
              <span className="material-symbols-outlined text-primary text-base">local_shipping</span>
              <p className="text-primary text-[10px] font-bold uppercase">{user.role}</p>
            </div>
          </div>
        </div>

        <div className="px-5 space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Họ và tên</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">person</span>
              <input className="w-full pl-10 pr-4 py-3.5 rounded-xl border-gray-200 dark:bg-slate-800 dark:border-slate-700 text-sm font-bold" value={user.name} readOnly />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Email</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">mail</span>
              <input className="w-full pl-10 pr-4 py-3.5 rounded-xl border-gray-200 dark:bg-slate-800 dark:border-slate-700 text-sm font-bold" value="taixe.nguyenvana@gmail.com" readOnly />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Số điện thoại</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">call</span>
              <input className="w-full pl-10 pr-4 py-3.5 rounded-xl border-gray-200 dark:bg-slate-800 dark:border-slate-700 text-sm font-bold" value="0912 345 678" readOnly />
            </div>
          </div>
        </div>

        <div className="px-5 mt-8 space-y-4">
          <button className="w-full flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-50">
            <div className="flex items-center gap-4">
              <div className="size-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><span className="material-symbols-outlined">lock_reset</span></div>
              <div className="text-left"><p className="font-bold text-sm">Đổi mật khẩu</p><p className="text-[10px] text-gray-400">Cập nhật mật khẩu bảo mật</p></div>
            </div>
            <span className="material-symbols-outlined text-gray-300">chevron_right</span>
          </button>
          
          <button className="w-full text-red-500 font-bold py-3 flex items-center justify-center gap-2 hover:bg-red-50 rounded-xl transition-all">
            <span className="material-symbols-outlined text-xl">delete</span>
            Xóa tài khoản
          </button>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t z-50">
        <button className="w-full bg-primary hover:bg-primary-dark text-slate-900 font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2" onClick={() => navigate(View.HOME)}>
          <span className="material-symbols-outlined">save</span>
          Lưu thay đổi
        </button>
      </div>
    </div>
  );
};

export default ProfileView;
