export interface District {
  id: number;
  name: string;
  coordinates: [number, number];
  visited: boolean;
}

export interface DistrictFeature {
  type: string;
  id: number;
  properties: {
    // name: string;
    ADM1_EN: string; // division name
    ADM2_EN: string; // district name
  };
  geometry: {
    type: string;
    coordinates: number[][][] | number[][][][];
  };
}

export interface GeoJSONData {
  type: string;
  features: DistrictFeature[];
}
