import { AppHeader } from "@/components/app-header";

export default function GoalLayout({ children }: LayoutProps<"/meta">) {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 pb-16">
      <AppHeader />
      {children}
    </div>
  );
}
