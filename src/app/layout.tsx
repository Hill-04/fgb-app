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
  title: 'FGB — Federação Gaúcha de Basketball',
  description: 'Sistema oficial de gestão de campeonatos da Federação Gaúcha de Basketball. Fundada em 18 de abril de 1952 em Porto Alegre, Rio Grande do Sul.',
  keywords: ['basquete', 'basketball', 'FGB', 'Federação Gaúcha', 'Rio Grande do Sul', 'campeonato', 'estadual', 'Caxias do Sul'],
  authors: [{ name: 'Federação Gaúcha de Basketball' }],
  openGraph: {
    title: 'FGB — Federação Gaúcha de Basketball',
    description: 'Gestão oficial de campeonatos de basquete do Rio Grande do Sul. Fundada em 1952.',
    locale: 'pt_BR',
    type: 'website',
    siteName: 'FGB - Federação Gaúcha de Basketball',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FGB — Federação Gaúcha de Basketball',
    description: 'Gestão oficial de campeonatos de basquete do Rio Grande do Sul.',
  },
};

export default function RootLayout({
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