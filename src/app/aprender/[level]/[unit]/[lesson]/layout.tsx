/** Tela cheia, sem o cabeçalho do app: a lição pede foco. */
export default function LessonLayout({ children }: LayoutProps<"/aprender/[level]/[unit]/[lesson]">) {
  return <div className="min-h-dvh bg-background">{children}</div>;
}
