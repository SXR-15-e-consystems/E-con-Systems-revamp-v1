import type { HeroData } from '@/types';

interface Props {
  data: Record<string, unknown>;
}

export function HeroBlock({ data }: Props) {
  const hero = data as unknown as HeroData;

  return (
    <section
      className="relative min-h-[320px] md:min-h-[500px] bg-cover bg-center"
      style={{ backgroundImage: `url(${hero.image_url ?? ''})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/20" />
      <div className="relative mx-auto flex min-h-[320px] max-w-6xl flex-col justify-center px-6 py-12 text-white md:min-h-[500px]">
        <h1 className="max-w-2xl text-3xl font-bold md:text-5xl">{hero.title ?? 'Untitled Hero'}</h1>
        {hero.subtitle ? <p className="mt-3 max-w-xl text-lg text-slate-100">{hero.subtitle}</p> : null}
        {hero.cta_text && hero.cta_link ? (
          <a
            className="mt-6 inline-flex w-fit rounded bg-white px-5 py-3 font-semibold text-slate-900"
            href={hero.cta_link}
          >
            {hero.cta_text}
          </a>
        ) : null}
      </div>
    </section>
  );
}
