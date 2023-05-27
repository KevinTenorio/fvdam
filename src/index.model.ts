export interface State<Type> {
  state: Type;
  set: (state: Type) => void;
}

export interface Locality {
  code: string;
  title: string;
  review: string;
  release_date: string;
  spatial_coverage: {
    basin: string;
    field: string;
    latitude: string[];
    longitude: string[];
    regions: {
      name: string;
      latitude: string[];
      longitude: string[];
      central_meridian: number;
      datum: string;
      parameters: string;
      UTMN: string[];
      UTME: string[];
    }[];
    UTMN: string[];
    UTME: string[];
    Datum: string;
    CentralMeridian: string;
  };
  info: {
    class_info: string;
    class_info_display: string;
    reference_level: number;
    direction: string;
    data: string;
    data_description: string;
    sectors: number;
  }[];
}
