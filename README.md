# Turkey Weather Map

Create a NEW standalone mobile-first weather application project, completely separate from any existing project. Do not modify, remix, or reuse the existing Toplan project.

Product concept: a very simple, map-first weather app for Turkey. Working slogan: “En iyi hava durumu uygulaması”. The key differentiator is simplicity: the app opens directly to a Turkey map showing current weather at a glance, and the user can tap anywhere on the map to see weather details for that exact point.

Build the first usable prototype with these priorities:
1) Main screen is almost entirely a map centered on Turkey.
2) Show a small set of major Turkish cities as compact labels with weather icon + current temperature + city name. Keep it visually light and uncluttered.
3) Top controls should be minimal: search and current-location buttons; avoid a heavy navigation bar.
4) When the user taps a point on the map, open a compact bottom sheet with location name, current temperature, weather condition, precipitation probability, wind, and feels-like temperature.
5) The bottom sheet should be expandable upward into a detailed forecast view.
6) Detailed view should have simple tabs: Şimdi, Saatlik, Günlük, Haftalık.
7) Hourly view should show time, weather icon, temperature, and precipitation probability.
8) Daily/weekly view should be clean and compact with min/max temperatures and weather icon.
9) Use a bright, calm, modern weather aesthetic: pale map, lots of whitespace, rounded cards, subtle shadows, clear typography, restrained blue accents. Avoid a dark or overly technical look.
10) Mobile-first responsive UI that feels native on iPhone and Android.

For now use mock weather data so the interface is fully functional without requiring paid API keys. Structure the code so a real weather provider and real map provider can be connected later with minimal refactoring. Include obvious service abstraction points for weather and map data.

Please produce a polished first prototype rather than a generic dashboard. The main product experience should be: open app → see Turkey weather map instantly → tap anywhere → weather card appears → swipe/expand for forecast details.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://turkey-map-weather.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/bfda2cd6-63b5-443a-933a-1b0d51182527).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
