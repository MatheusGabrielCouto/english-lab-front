/** Modo foco: sem o cabeçalho do site nem a navegação do Anki, só o estudo. */
export default function StudyLayout({ children }: LayoutProps<"/anki/estudar">) {
  return <div className="min-h-dvh bg-background">{children}</div>;
}
