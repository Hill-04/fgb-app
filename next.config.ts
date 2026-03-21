import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* No Turbopack do Next 16, os erros de lint/ts devem ser tratados via CLI ou variáveis de ambiente se necessário */
  serverExternalPackages: ["jspdf", "jspdf-autotable", "fflate"],
};

export default nextConfig;
