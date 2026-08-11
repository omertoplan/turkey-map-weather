/**
 * Weather domain types.
 *
 * SERVICE ABSTRACTION POINT
 * Any real provider (OpenWeather, Open-Meteo, AccuWeather...) only needs to
 * implement `WeatherProvider` below and be returned from `getWeatherProvider()`
 * in `src/lib/weather/index.ts`. No UI code imports a provider directly.
 */

export type WeatherCondition =
  | "clear"
  | "partly-cloudy"
  | "cloudy"
  | "rain"
  | "shower"
  | "thunder"
  | "snow"
  | "fog"
  | "wind";

export const CONDITION_LABEL_TR: Record<WeatherCondition, string> = {
  clear: "Açık",
  "partly-cloudy": "Parçalı bulutlu",
  cloudy: "Bulutlu",
  rain: "Yağmurlu",
  shower: "Sağanak yağışlı",
  thunder: "Gök gürültülü",
  snow: "Karlı",
  fog: "Puslu",
  wind: "Rüzgarlı",
};

export interface Coords {
  lat: number;
  lon: number;
}

export interface CurrentWeather {
  temp: number;
  feelsLike: number;
  condition: WeatherCondition;
  precipitationProbability: number;
  windSpeed: number;
  windDirection: string;
  humidity: number;
  uvIndex: number;
  pressure: number;
  visibility: number;
  sunrise: string;
  sunset: string;
}

export interface HourlyEntry {
  time: string;
  temp: number;
  condition: WeatherCondition;
  precipitationProbability: number;
  windSpeed: number;
  windDirection: string;
}

export interface DailyEntry {
  /** ISO date */
  date: string;
  label: string;
  min: number;
  max: number;
  condition: WeatherCondition;
  precipitationProbability: number;
  windSpeedMax: number;
  windDirection: string;
}


export interface WeatherSnapshot {
  location: {
    name: string;
    region: string;
    coords: Coords;
  };
  current: CurrentWeather;
  hourly: HourlyEntry[];
  /** 7 days (used by both Günlük and Haftalık views) */
  daily: DailyEntry[];
}

export interface CityWeather {
  id: string;
  name: string;
  coords: Coords;
  temp: number;
  condition: WeatherCondition;
  /** lower number = shown at smaller sizes first */
  priority: number;
}

export interface WeatherProvider {
  readonly id: string;
  getSnapshot(coords: Coords): Promise<WeatherSnapshot>;
  getCityOverview(): Promise<CityWeather[]>;
  searchPlaces(query: string): Promise<Array<{ name: string; region: string; coords: Coords }>>;
}
