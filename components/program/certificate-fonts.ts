import localFont from "next/font/local";

/* the certificate's typefaces, after Node's certificate design: a wide serif for the title, a rounded script for the
   name, and Montserrat for everything else */
export const certTitle = localFont({
  src: [
    { path: "../../node_modules/@fontsource/cinzel/files/cinzel-latin-700-normal.woff2", weight: "700", style: "normal" },
    { path: "../../node_modules/@fontsource/cinzel/files/cinzel-latin-900-normal.woff2", weight: "900", style: "normal" },
  ],
  display: "swap",
});
export const certName = localFont({ src: "../../node_modules/@fontsource/pacifico/files/pacifico-latin-400-normal.woff2", weight: "400", display: "swap" });
export const certBody = localFont({
  src: [
    { path: "../../node_modules/@fontsource/montserrat/files/montserrat-latin-300-normal.woff2", weight: "300", style: "normal" },
    { path: "../../node_modules/@fontsource/montserrat/files/montserrat-latin-500-normal.woff2", weight: "500", style: "normal" },
  ],
  display: "swap",
});
