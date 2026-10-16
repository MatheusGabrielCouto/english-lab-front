import { AppHeader } from "@/components/app-header";

export default function AnkiLayout({ children }: LayoutProps<"/anki">) {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 pb-16">
      <AppHeader />
      {children}
    </div>
  );
}
