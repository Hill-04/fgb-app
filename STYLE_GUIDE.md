# FGB App — Guia de Estilo (v7)

Identidade visual da **Federação Gaúcha de Basquete** aplicada ao app.
Fonte de verdade dos tokens: [`src/app/globals.css`](src/app/globals.css).

---

## Paleta de Cores

### Brand anchors
| Token CSS | Hex | Uso |
|---|---|---|
| `--fgb-green-700` | `#106B33` | Cor primária (brand) |
| `--fgb-green-800` | `#0C5C2D` | Headers, sidebars admin, blocos institucionais |
| `--fgb-green-900` | `#084E26` | "Preto da FGB" — fundos darker (use no lugar de `#000`) |
| `--fgb-yellow-500` | `#E5AB00` | CTAs primários (sempre fundo amarelo + texto verde-900) |
| `--fgb-red-500` | `#D72020` | Live / energia / alerta — **uso restrito** |
| `--fgb-navy-700` | `#1A2C42` | Suporte (gráficos, fundos institucionais alternativos) |

Cada cor tem escala 50→950. Use as utilities Tailwind: `bg-fgb-green-700`, `text-fgb-yellow-500`, `border-fgb-red-500`, etc.

### Neutros (ink)
Tons `--fgb-ink-50` → `--fgb-ink-900`. Substituem cinzas genéricos (`slate-*`, `gray-*`).

### Tricolor (assinatura)
Listra horizontal `verde → amarelo → vermelho` em proporção 33%/33%/33%.
Use a classe `.fgb-tricolor` (4px) ou a variável `--fgb-gradient-tricolor`.

### Gradientes oficiais
- `--fgb-gradient-tricolor` — assinatura
- `--fgb-gradient-court` — verde-800 → verde-700 → verde-600 (heros, CTAs grandes)
- `--fgb-gradient-night` — navy-800 → navy-950 (fundos darker)

---

## Tipografia

Variáveis carregadas em `layout.tsx` via `next/font/google`:

| Variável | Família | Uso |
|---|---|---|
| `--font-anton` | **Anton** | Títulos massivos (>26px), heros, números de placar |
| `--font-accent` | **Big Shoulders Display** | Callouts secundários, cards de jogador |
| `--font-stencil` | **Big Shoulders Stencil** | Números de camisa |
| `--font-display` | **Barlow Condensed** | Labels, eyebrows, navegação, badges (sempre UPPERCASE + tracking 0.10–0.22em) |
| `--font-sans` | **DM Sans** | Body text |

> **Atenção ao nome:** apesar do nome, `--font-display` é Barlow Condensed (uso editorial — nav/labels/badges). Para títulos massivos use `--font-anton`.

### Utilities prontas
- `.fgb-display` — title massivo (Anton 900, uppercase, letter-spacing -0.01em, line-height 0.9)
- `.fgb-heading` — heading médio (Barlow 800, uppercase)
- `.fgb-label` — label pequeno 10px (Barlow 700, uppercase, tracking 0.12em)

---

## Componentes essenciais

### Botão CTA primário
Use `.fgb-btn-primary`: fundo amarelo, texto verde-900, **cantos cortados via `clip-path`** (12px nos cantos top-right e bottom-left).

```tsx
<Link href="/login" className="fgb-btn-primary">Entrar</Link>
```

**Nunca** use `border-radius` em CTAs primários.

Variantes: `.fgb-btn-secondary` (outline branco), `.fgb-btn-outline`, `.fgb-btn-soft`.

### Header público
Use o componente `<PublicHeader />` (`src/components/PublicHeader.tsx`).
Estrutura: utility bar verde-800 → stripe tricolor → main bar verde com logo, nav, CTA "Entrar" e ticker vermelho.

### Sidebar admin
Use `<SideNav role="ADMIN" />` (`src/components/SideNav.tsx`).
Verde-800 + stripe tricolor + item ativo amarelo com border-left 3px.

### Ticker / Marquee
Classes `.fgb-ticker` + `.fgb-ticker-track` + `.fgb-ticker-item`.
Fundo vermelho FGB, animação 32s linear infinite. Badges internas: `.fgb-badge-live`, `.fgb-badge-novo`, `.fgb-badge-info`.

### Cards
- `.fgb-card` — base (border + shadow-sm, hover translateY + shadow-lg, border-top verde no hover)
- `.fgb-card-premium` — variante destacada
- Variantes hover: `.fgb-card-red`, `.fgb-card-yellow`

### Badges
- `.fgb-badge-verde`, `.fgb-badge-yellow`, `.fgb-badge-red`, `.fgb-badge-orange`, `.fgb-badge-outline`

---

## Regras invioláveis

### ✅ Do
- **Verde FGB é a cor primária.** Headers e sidebars admin usam verde-800.
- **Amarelo em todos os CTAs primários** (fundo amarelo + texto verde-900).
- **Vermelho só para "live / energia / alerta"** — marquee de notícias, badge "AO VIVO", contadores regressivos.
- **Listra tricolor 4–6px** como assinatura: divisor entre header utility e main, topo da sidebar admin, borders de cards importantes.
- **Cantos cortados** (`clip-path` polygon) em CTAs — não `border-radius`.
- **Tipografia hierárquica:** Anton para massivos, Big Shoulders para callouts, Barlow para labels/nav, DM Sans para body.
- **Fundo padrão é branco.** Sections "dark" usam verde-800 ou verde-900.

### ❌ Don't
- **Nunca** use `#000` puro como fundo. Use `--fgb-green-900` ou `--fgb-ink-900`.
- **Nunca** use cinza neutro genérico (`#1f2937`, `slate-900`). Use `--fgb-ink-*`.
- **Nunca** troque verde por azul como primária. Navy é cor de suporte.
- **Nunca** use `border-radius` em botões CTA.
- **Nunca** use emoji como ícone funcional. Use Lucide React.
- **Nunca** use Inter, Roboto, Arial, system-ui para títulos.
- **Nunca** use sombras coloridas neon. Sombras são neutras (`rgba(15,30,20,.x)`).
- **Nunca** vire a listra tricolor vertical. Sempre horizontal, 33%/33%/33%.

---

## Espaçamento, sombras, motion

- **Escala** (4px): 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96
- **Sombras**: `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-premium`
- **Raio**: 8, 12, 14, 16px (CTAs primários **não** usam raio — usam clip-path)
- **Easing**: `--fgb-ease`, `--fgb-ease-out`
- **Durações**: `--fgb-duration-fast` (150ms), `--fgb-duration-base` (220ms), `--fgb-duration-slow` (360ms)
- **Cut-corner CTA**: `--fgb-cut` (12px)

---

## Ícones e imagens

- **Biblioteca**: Lucide React
- **Tamanhos**: 14, 16, 20, 24px
- **Escudos**: 1:1 (ex: `w-8 h-8`, `w-12 h-12`)
- **Banners**: 16:9 ou 2:1
- Sempre com fallback visual e `alt`

---

## Fonte de verdade externa

Manual completo v7 (tokens canônicos, patterns, regras):
`c:\Users\braya\Downloads\App fgb (2)\handoff\`

Em caso de divergência entre este guia e o handoff, **o handoff é canônico**.
