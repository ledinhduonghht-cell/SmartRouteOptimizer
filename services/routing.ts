
export interface RouteGeometry {
  coordinates: [number, number][];
  distance: number;
  duration: number;
}

export const getRealRoute = async (start: [number, number], end: [number, number]): Promise<RouteGeometry | null> => {
  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`
    );
    const data = await response.json();
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      return {
        coordinates: route.geometry.coordinates.map((c: number[]) => [c[1], c[0]]),
        distance: route.distance, // meters
        duration: route.duration // seconds
      };
    }
    return null;
  } catch (error) {
    console.error("Routing Error:", error);
    return null;
  }
};
