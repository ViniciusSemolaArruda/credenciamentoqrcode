
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Credenciamento | Guardiões da Capadócia",
    short_name: "Credenciamento",
    description:
      "Sistema oficial de credenciamento da G.R.E.S. Guardiões da Capadócia.",

    start_url: "/",
    scope: "/",
    display: "standalone",

    background_color: "#080F15",
    theme_color: "#080F15",

    lang: "pt-BR",

    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
