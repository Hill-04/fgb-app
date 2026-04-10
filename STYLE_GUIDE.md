# FGB App — Guia de Estilo

Este guia consolida cores, tipografia e padrões de componentes para manter o app consistente.

## Paleta de Cores (Brand)
- **FGB Blue (Primary):** `#0056B3`
- **FGB Accent (Secondary):** `#FF4500`
- **Background:** `#F8F9FA`
- **Foreground:** `#212529`
- **Border:** `#DEE2E6`
- **Muted:** `#6C757D`

### Tokens (HSL — shadcn/ui)
```css
:root {
  --background: 210 20% 98%;
  --foreground: 210 11% 15%;
  --card: 0 0% 100%;
  --card-foreground: 210 11% 15%;
  --primary: 211 100% 35%;
  --primary-foreground: 0 0% 100%;
  --secondary: 16 100% 50%;
  --secondary-foreground: 0 0% 100%;
  --muted: 210 14% 96%;
  --muted-foreground: 210 11% 45%;
  --accent: 210 14% 94%;
  --accent-foreground: 211 100% 35%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 100%;
  --border-hsl: 210 14% 89%;
  --input: 210 14% 83%;
  --ring: 211 100% 35%;
}
```

## Tipografia
- **Fonte base:** DM Sans
- **Display (H1):** 48px, 700, line-height 1.2
- **Heading (H2):** 36px, 700, line-height 1.3
- **Subheading (H3):** 30px, 600, line-height 1.4
- **Title (H4):** 24px, 600, line-height 1.5
- **Subtitle (H5):** 20px, 500, line-height 1.6
- **Body:** 16px, 400, line-height 1.6
- **Small:** 14px, 400, line-height 1.5
- **Caption:** 12px, 400, line-height 1.4

## Espaçamento (escala 4px)
`4, 8, 16, 24, 32, 48, 64`

## Botões (Button)
### Primary
- `bg-primary text-primary-foreground`
- `hover:bg-primary/90`

### Secondary
- `bg-secondary text-secondary-foreground`
- `hover:bg-secondary/90`

### Outline
- `border border-border bg-background`
- `hover:bg-accent`

### Ghost
- `hover:bg-accent`

### Destructive
- `bg-destructive text-destructive-foreground`
- `hover:bg-destructive/90`

## Cards
Base:
- `bg-card border border-border rounded-lg shadow-sm`
- `hover:shadow-md` (quando interativo)

Estrutura:
- **CardHeader:** padding padrão, `border-b`
- **CardContent:** padding padrão
- **CardFooter:** `border-t`

## Ícones
- Biblioteca: Lucide React
- Tamanhos: 16px, 20px, 24px
- Cores: `var(--foreground)` ou `var(--muted-foreground)` para secundários

## Imagens
- Escudos: 1:1 (ex: `w-8 h-8`, `w-12 h-12`)
- Banners: 16:9 ou 2:1
- Sempre com fallback visual e `alt`

## Microinterações
- `transition-colors duration-200`
- `hover` com leve elevação ou sombra
