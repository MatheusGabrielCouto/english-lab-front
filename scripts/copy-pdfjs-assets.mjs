// Copia para public/pdfjs os recursos que o pdf.js carrega em tempo de execução:
// fontes padrão, mapas de caracteres (CMaps), perfis ICC e decodificadores WASM.
// Sem eles, PDFs com fontes não embutidas ou imagens JPEG2000 renderizam mal.
import { cp, mkdir, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const source = dirname(require.resolve("pdfjs-dist/package.json"));
const target = join(process.cwd(), "public", "pdfjs");

await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
for (const dir of ["cmaps", "standard_fonts", "iccs", "wasm"]) {
  await cp(join(source, dir), join(target, dir), { recursive: true });
}
console.log("pdf.js: recursos copiados para public/pdfjs");
