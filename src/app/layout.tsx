import type { Metadata } from "next";
import { Barlow_Condensed, DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const barlowCondensed = Barlow_Condensed({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'FGB — Federacao Gaucha de Basketball',
  description: 'Sistema oficial de gestao de campeonatos da Federacao Gaucha de Basketball. Fundada em 18 de abril de 1952 em Porto Alegre, Rio Grande do Sul.',
  keywords: ['basquete', 'basketball', 'FGB', 'Federacao Gaucha', 'Rio Grande do Sul', 'campeonato', 'estadual', 'Caxias do Sul'],
  authors: [{ name: 'Federacao Gaucha de Basketball' }],
  openGraph: {
    title: 'FGB — Federacao Gaucha de Basketball',
    description: 'Gestao oficial de campeonatos de basquete do Rio Grande do Sul. Fundada em 1952.',
    locale: 'pt_BR',
    type: 'website',
    siteName: 'FGB - Federacao Gaucha de Basketball',
    images: [
      {
        url: 'https://basquetegaucho.com.br/wp-content/uploads/2023/09/Federacao-Gaucha-de-Basketball-Logo-01.png',
        width: 1200,
        height: 630,
        alt: 'FGB',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FGB — Federacao Gaucha de Basketball',
    description: 'Gestao oficial de campeonatos de basquete do Rio Grande do Sul.',
    images: ['https://basquetegaucho.com.br/wp-content/uploads/2023/09/Federacao-Gaucha-de-Basketball-Logo-01.png'],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${dmSans.variable} ${barlowCondensed.variable} antialiased`} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
