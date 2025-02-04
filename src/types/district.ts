export interface District {
  id: string;
  name: string;
  coordinates: [number, number];
  visited: boolean;
}

export interface DistrictFeature {
  type: 'Feature';
  id: string;
  properties: {
    name: string;
    ADM1_EN: string; // division name
    ADM2_EN: string; // district name
  };
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

export interface GeoJSONData {
  type: 'FeatureCollection';
  features: DistrictFeature[];
}
