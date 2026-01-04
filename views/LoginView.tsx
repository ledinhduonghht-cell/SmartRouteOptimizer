
import React, { useState } from 'react';

interface Props { onLogin: () => void; }

const LoginView: React.FC<Props> = ({ onLogin }) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');

  return (
    <div className="flex-1 flex flex-col relative overflow-y-auto no-scrollbar bg-white">
      {/* Hero Section với Logo trong suốt và hiệu ứng hiện đại */}
      <div className="relative w-full h-[340px] shrink-0 flex flex-col items-center justify-center px-6 overflow-hidden">
        <div 
          className="absolute inset-0 bg-center bg-no-repeat bg-cover opacity-10 grayscale scale-110" 
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80")' }}
        ></div>
        
        {/* Lớp phủ gradient để tạo chiều sâu */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/40 to-white"></div>
        
        <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in duration-700">
          <div className="bg-primary/20 backdrop-blur-xl p-5 rounded-[2.2rem] mb-6 shadow-glow ring-1 ring-primary/30">
            <span className="material-symbols-outlined text-primary text-6xl filled">alt_route</span>
          </div>
          <div className="text-center">
            <h1 className="font-black text-4xl tracking-tighter text-slate-900 uppercase leading-none">Smart Route</h1>
            <h1 className="font-black text-4xl tracking-tighter text-primary uppercase mt-1 leading-none">Optimizer</h1>
            <p className="text-[11px] text-slate-400 font-black mt-4 tracking-[0.3em] uppercase">Logistics Thông Minh Hà Nội</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-8 relative z-30 flex flex-col -mt-2">
        <div className="text-center mb-8">
          <h2 className="text-slate-900 text-3xl font-black tracking-tight mb-3">Xin chào bạn!</h2>
          <p className="text-slate-500 font-medium text-[15px] leading-relaxed px-2">
            Giải pháp vận chuyển tối ưu bằng AI, thân thiện với môi trường tại Thủ đô.
          </p>
        </div>

        <div className="mb-8">
          <div className="bg-slate-50 p-1.5 rounded-2xl flex border border-slate-100 h-14">
            <button 
              onClick={() => setTab('login')}
              className={`flex-1 rounded-xl font-black text-sm transition-all duration-300 ${tab === 'login' ? 'bg-white text-primary shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
            > Đăng nhập </button>
            <button 
              onClick={() => setTab('register')}
              className={`flex-1 rounded-xl font-black text-sm transition-all duration-300 ${tab === 'register' ? 'bg-white text-primary shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
            > Đăng ký </button>
          </div>
        </div>

        <form className="space-y-4 mb-8" onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
          <div className="group">
            <input 
              className="block w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary focus:bg-white transition-all shadow-sm font-semibold" 
              placeholder="Email hoặc Số điện thoại" 
              type="text" 
            />
          </div>
          <div className="group">
            <input 
              className="block w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary focus:bg-white transition-all shadow-sm font-semibold" 
              placeholder="Mật khẩu" 
              type="password" 
            />
          </div>
          
          <div className="pt-2">
            <button 
              className="w-full bg-primary hover:bg-primary-dark text-slate-900 font-black text-lg h-[60px] rounded-[22px] shadow-[0_8px_25px_-5px_rgba(0,230,118,0.4)] flex items-center justify-center gap-3 active:scale-[0.97] transition-all" 
              type="submit"
            >
              <span>Bắt đầu ngay</span>
              <span className="material-symbols-outlined font-black">arrow_forward</span>
            </button>
          </div>
        </form>

        <div className="relative flex items-center justify-center mb-8">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
          <span className="relative bg-white px-5 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">TIẾP TỤC BẰNG</span>
        </div>

        <div className="grid grid-cols-2 gap-4 pb-12">
          <button className="flex items-center justify-center gap-3 h-14 rounded-[20px] border border-slate-100 bg-white hover:bg-slate-50 transition-all active:scale-[0.97] shadow-sm group">
            <img src="https://www.google.com/favicon.ico" className="size-5" alt="Google" />
            <span className="font-black text-[14px] text-slate-700 tracking-tight">Google</span>
          </button>
          <button className="flex items-center justify-center gap-3 h-14 rounded-[20px] bg-[#1877F2] hover:bg-[#166fe5] transition-all active:scale-[0.97] shadow-lg shadow-blue-100">
            <svg viewBox="0 0 24 24" className="size-5 fill-white" xmlns="http://www.w3.org/2000/svg"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            <span className="font-black text-[14px] text-white tracking-tight">Facebook</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
