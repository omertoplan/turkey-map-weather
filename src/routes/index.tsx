import { createFileRoute } from "@tanstack/react-router";
import { WeatherHome } from "@/components/weather/WeatherHome";

const TITLE = "Hava Haritası — En iyi hava durumu uygulaması";
const DESCRIPTION =
  "Türkiye haritasını aç, şehirlerin anlık sıcaklığını gör ve haritada herhangi bir noktaya dokunarak gerçek saatlik, günlük ve haftalık hava tahminine ulaş.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WeatherHome,
});
