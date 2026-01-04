
export enum View {
  LOGIN = 'LOGIN',
  HOME = 'HOME',
  ROUTE_INPUT = 'ROUTE_INPUT',
  OPTIMIZATION = 'OPTIMIZATION',
  RESULT = 'RESULT',
  NAVIGATION = 'NAVIGATION',
  ANALYSIS = 'ANALYSIS',
  PROFILE = 'PROFILE',
  DASHBOARD = 'DASHBOARD',
  CHARGING = 'CHARGING',
  BIKE = 'BIKE',
  PREMIUM = 'PREMIUM'
}

export type VehicleCategory = 'VAN' | 'TRUCK_LIGHT' | 'TRUCK_HEAVY' | 'CONTAINER_20' | 'CONTAINER_40' | 'CONTAINER_45' | 'EV_CAR';

export interface MapLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'origin' | 'destination' | 'charging' | 'bike';
  address?: string;
}

export interface RouteState {
  origin: MapLocation | null;
  destination: MapLocation | null;
  vehicleCategory: VehicleCategory;
  optimizedType: 'fastest' | 'greenest' | 'cheapest' | 'truck';
  batteryStatus?: {
    current: number;
    capacity: number;
  };
}
