import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-28">
      <p className="text-sm font-light text-secondary">۴۰۴</p>
      <h1 className="mt-4 text-4xl font-extrabold">این صفحه نیست.</h1>
      <Link href="/" className="mt-8 inline-block text-sm font-bold">
        بازگشت به خانه
      </Link>
    </div>
  );
}
