import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-3 text-muted-foreground">
        That page doesn&apos;t exist.{" "}
        <Link href="/" className="font-medium text-foreground underline underline-offset-4">
          Browse visualizations
        </Link>
        .
      </p>
    </div>
  );
}
