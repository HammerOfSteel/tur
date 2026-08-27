import { getPagesContent } from "@/lib/content";

const STORE_LAT = 63.1760791;
const STORE_LON = 14.6362029;

function buildMapEmbedUrl(lat: number, lon: number): string {
  const bbox = [lon - 0.006, lat - 0.003, lon + 0.006, lat + 0.003].map((n) => n.toFixed(7)).join("%2C");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lon}`;
}

export default function KontaktPage() {
  const { kontakt } = getPagesContent();
  const hoursItems = kontakt.hours.split(" · ");

  return (
    <div className="mx-auto max-w-(--container-brand) px-brand-6 py-brand-8">
      <h1 className="font-heading text-brand-2xl font-bold">{kontakt.title}</h1>
      <div className="mt-brand-6 grid gap-brand-6 md:grid-cols-[2fr_3fr]">
        <div className="bg-brand-surface rounded-brand-md flex flex-col gap-brand-4 p-brand-6">
          <div>
            <h3 className="font-heading font-bold">Besök oss</h3>
            <p className="text-brand-ink mt-1">{kontakt.address}</p>
          </div>
          <div>
            <h3 className="font-heading font-bold">Öppettider</h3>
            <ul className="text-brand-ink mt-1">
              {hoursItems.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-heading font-bold">Kontakta oss</h3>
            <p className="mt-1">
              <a href={`tel:${kontakt.phone}`} className="text-brand-primary hover:underline">
                {kontakt.phone}
              </a>
            </p>
            <p>
              <a href={kontakt.instagram_url} className="text-brand-primary hover:underline">
                Instagram
              </a>
            </p>
          </div>
        </div>
        <iframe
          title="Karta till Tur Second Hand"
          src={buildMapEmbedUrl(STORE_LAT, STORE_LON)}
          className="rounded-brand-md min-h-96 w-full border-0"
        />
      </div>
    </div>
  );
}
