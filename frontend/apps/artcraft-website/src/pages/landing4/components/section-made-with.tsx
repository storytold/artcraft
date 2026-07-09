import { MADE_WITH_VIDEOS } from "../data";
import { HairlineFrame, LineMaskHeading, SectionHeader } from "./ui";

// /06 — Output. Paper chapter. Asymmetric editorial grid: one large frame plus
// two stacked small frames, all lazy YouTube embeds with mono figure captions.
export const SectionMadeWith = () => {
  const [featureFilm, ...smallFilms] = MADE_WITH_VIDEOS;
  return (
    <section className="mx-auto w-full max-w-[1600px] px-4 py-24 sm:px-8 lg:py-32">
      <SectionHeader number="06" label="OUTPUT" right="COMMUNITY FILMS" />
      <div className="py-10 lg:py-14">
        <LineMaskHeading
          className="text-[clamp(2.8rem,8vw,8.5rem)]"
          lines={[<>MADE WITH</>, <>ARTCRAFT</>]}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div data-l4-wipe className="lg:col-span-8">
          <HairlineFrame caption={featureFilm.caption}>
            <iframe
              className="aspect-video w-full"
              src={featureFilm.embedUrl}
              title="Made with ArtCraft — feature film"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </HairlineFrame>
        </div>
        <div className="flex flex-col gap-8 lg:col-span-4">
          {smallFilms.map((film, i) => (
            <div key={film.embedUrl} data-l4-wipe>
              <HairlineFrame caption={film.caption}>
                <iframe
                  className="aspect-video w-full"
                  src={film.embedUrl}
                  title={`Made with ArtCraft — community film ${i + 2}`}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </HairlineFrame>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
