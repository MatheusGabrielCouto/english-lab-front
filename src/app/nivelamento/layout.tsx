/** Tela cheia, sem o cabeçalho do app: o teste pede foco. */
export default function PlacementLayout({ children }: LayoutProps<"/nivelamento">) {
  return <div className="min-h-dvh bg-background">{children}</div>;
}
