
import React, { useState } from 'react';
import { View, RouteState, MapLocation } from './types';
import LoginView from './views/LoginView';
import HomeView from './views/HomeView';
import RouteInputView from './views/RouteInputView';
import OptimizationView from './views/OptimizationView';
import ResultView from './views/ResultView';
import NavigationView from './views/NavigationView';
import AnalysisView from './views/AnalysisView';
import ProfileView from './views/ProfileView';
import DashboardView from './views/DashboardView';
import ChargingView from './views/ChargingView';
import BikeView from './views/BikeView';
import PremiumView from './views/PremiumView';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.LOGIN);
  const [routeState, setRouteState] = useState<RouteState>({
    origin: { id: 'current', name: 'Vị trí hiện tại', lat: 21.0285, lng: 105.8542, type: 'origin' },
    destination: null,
    vehicleCategory: 'VAN',
    optimizedType: 'fastest'
  });

  const navigate = (view: View) => setCurrentView(view);

  const updateRoute = (updates: Partial<RouteState>) => {
    setRouteState(prev => ({ ...prev, ...updates }));
  };

  const renderView = () => {
    switch (currentView) {
      case View.LOGIN: return <LoginView onLogin={() => navigate(View.HOME)} />;
      case View.HOME: return <HomeView navigate={navigate} />;
      case View.ROUTE_INPUT: return <RouteInputView navigate={navigate} routeState={routeState} updateRoute={updateRoute} />;
      case View.OPTIMIZATION: return <OptimizationView navigate={navigate} routeState={routeState} updateRoute={updateRoute} />;
      case View.RESULT: return <ResultView navigate={navigate} routeState={routeState} updateRoute={updateRoute} />;
      case View.NAVIGATION: return <NavigationView navigate={navigate} routeState={routeState} />;
      case View.ANALYSIS: return <AnalysisView navigate={navigate} />;
      case View.PROFILE: return <ProfileView navigate={navigate} user={{ name: 'Nguyễn Văn A', role: 'Tài xế chuyên nghiệp' }} />;
      case View.DASHBOARD: return <DashboardView navigate={navigate} />;
      case View.CHARGING: return <ChargingView navigate={navigate} />;
      case View.BIKE: return <BikeView navigate={navigate} />;
      case View.PREMIUM: return <PremiumView navigate={navigate} />;
      default: return <HomeView navigate={navigate} />;
    }
  };

  return (
    <div className="h-screen w-full flex flex-col max-w-md mx-auto relative overflow-hidden bg-background-light dark:bg-background-dark shadow-2xl">
      {renderView()}
    </div>
  );
};

export default App;
