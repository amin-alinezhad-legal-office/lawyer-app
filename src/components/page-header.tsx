export function PageHeader({
  kicker,
  title,
  lede,
}: {
  kicker: string;
  title: string;
  lede: string;
}) {
  return (
    <header className="border-b border-line bg-mist">
      <div className="mx-auto w-full max-w-6xl px-6 py-16 md:px-10 md:py-24">
        <p className="text-sm font-light text-secondary">{kicker}</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
          {title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg font-light leading-9">{lede}</p>
      </div>
    </header>
  );
}
