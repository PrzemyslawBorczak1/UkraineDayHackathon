# KORD Logistics — Style Guide

Minimalistyczny, "operacyjny" interfejs dyspozytorski. Inspiracja: panele kontroli (Linear, Arc, Vercel), narzędzia mapowe, terminale wojskowe. Dużo białego/jasnego tła, ostre typograficzne hierarchie, mikro-typografia `text-[10px]/[11px] uppercase tracking-widest` jako etykiety, czarne CTA w kształcie pigułek.

Stack: **React + TailwindCSS v4** (`@import "tailwindcss"`), tokeny w `src/styles.css` (OKLCH), shadcn/ui jako baza komponentów.

---

## 1. Paleta

Bazowo używamy skali **neutral** (Tailwind) zamiast tokenów shadcn — daje surowy, "logistyczny" look.

| Rola              | Klasa Tailwind        | Hex approx |
| ----------------- | --------------------- | ---------- |
| App background    | `bg-[#fafafa]`        | #FAFAFA    |
| Panel / karta     | `bg-white`            | #FFFFFF    |
| Mapa / strefa 2   | `bg-neutral-100`      | #F5F5F5    |
| Border subtelny   | `border-neutral-200`  | #E5E5E5    |
| Tekst główny      | `text-neutral-900`    | #171717    |
| Tekst drugorzędny | `text-neutral-500`    | #737373    |
| Etykiety / meta   | `text-neutral-400`    | #A3A3A3    |
| CTA / aktywny     | `bg-neutral-900 text-white` | #171717 / #FFF |

### Akcenty semantyczne

| Stan        | Klasa                          |
| ----------- | ------------------------------ |
| OK / live   | `bg-emerald-500` (`animate-pulse` dla live) |
| Warning     | `bg-amber-500` / `text-amber-600` |
| Critical P1 | `bg-rose-500` / `text-rose-600`   |
| Info        | `bg-sky-500` / `text-sky-600`     |

Tokeny shadcn (`--primary`, `--background`, …) zdefiniowane w `tokens.css` na wypadek, gdy chcesz używać komponentów shadcn — format **OKLCH**, wymagany Tailwind v4.

---

## 2. Typografia

- Font: domyślny `font-sans` (system / Geist jeśli załadowany przez `<link>` w `__root.tsx`).
- Liczby: **zawsze** `tabular-nums` (np. zegar, liczniki, KPI).
- Hierarchia:
  - Logo/brand: `font-semibold tracking-tight leading-none`
  - Nagłówki sekcji: `text-sm font-medium`
  - **Etykiety mikro**: `text-[10px] font-bold uppercase tracking-widest text-neutral-400` ← znak rozpoznawczy
  - Meta wiersza: `text-[11px] text-neutral-500`
  - Treść listy: `text-sm font-medium`

---

## 3. Kształty i głębia

- **Promienie**: `rounded-md` (chipy), `rounded-lg` (przyciski/karty), `rounded-full` (header pill, CTA).
- **Obramowania jako ring**: `ring-1 ring-black/5` zamiast `border` na "pływających" kartach nad mapą.
- **Cienie**: minimalne — `shadow-sm`. Nigdy duże blur. "Wyniesienie" budujemy przez `bg-white/95 backdrop-blur-md ring-1 ring-black/5`.
- **Brak gradientów dekoracyjnych**. Tło zawsze płaskie.

---

## 4. Layout

```
┌──────────┬─────────────────────────────────────────┐
│  aside   │  main (relative, z mapą / contentem)   │
│  w-80    │  ┌ header absolute top-4 left-4 right-4 │
│  bg-     │  │   (pływające pille)                  │
│  white   │  │                                       │
│  border  │  └ overlay panele (absolute, ring-1)    │
└──────────┴─────────────────────────────────────────┘
```

- Root: `flex h-screen w-full bg-[#fafafa] overflow-hidden`
- Sidebar: `w-80 shrink-0 border-r border-neutral-200 bg-white z-20`
- Main: `relative flex-1 bg-neutral-100`
- Pływające elementy nad mapą: `absolute z-[500] pointer-events-none`, a wewnątrz `pointer-events-auto`.

---

## 5. Komponenty (wzorce)

### Header pill (pływający)
```tsx
<div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-full ring-1 ring-black/5 shadow-sm flex items-center gap-4">
  <span className="text-sm font-medium capitalize">Segment</span>
  <div className="h-4 w-px bg-neutral-200" />
  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
  <span className="text-[11px] tabular-nums text-neutral-500">LIVE</span>
</div>
```

### Item nawigacji (aktywny / nieaktywny)
```tsx
<button className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors
  ${active ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"}`}>
  <div className={`size-2 rounded-full ${active ? "bg-white" : "bg-neutral-300"}`} />
  <span className="flex-1 text-left">Label</span>
  <span className={`text-[10px] tabular-nums ${active ? "text-white/60" : "text-neutral-400"}`}>42</span>
</button>
```

### Chip filtra
```tsx
<button className={`px-2 py-1 text-[11px] font-medium rounded-md ring-1 transition-colors
  ${on ? "bg-neutral-900 text-white ring-neutral-900"
       : "bg-white text-neutral-600 ring-neutral-200 hover:ring-neutral-400"}`}>
  Tag
</button>
```

### Input
```tsx
<input className="w-full px-3 py-2 bg-neutral-100 rounded-lg text-sm border border-transparent
  focus:border-neutral-300 focus:bg-white outline-none transition-all" />
```

### Nagłówek sekcji listy
```tsx
<h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Results</h4>
```

### CTA primary (pigułka)
```tsx
<Link className="px-4 py-2 bg-neutral-900 text-white rounded-full text-sm font-medium hover:bg-neutral-800 transition-colors">
  + New mission
</Link>
```

### Karta KPI
```tsx
<div className="bg-white rounded-2xl ring-1 ring-black/5 p-5">
  <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Cargo moved</div>
  <div className="mt-2 text-3xl font-semibold tabular-nums">12,480 kg</div>
  <div className="mt-1 text-[11px] text-neutral-500">last 24h</div>
</div>
```

---

## 6. Zasady (do-not list)

- ❌ Nie używaj fioletowych/indygo gradientów.
- ❌ Nie używaj Inter/Poppins jako display fontu — zostań przy systemowym sans (lub Geist).
- ❌ Nie używaj `shadow-xl/2xl`. Głębia przez `ring-1 ring-black/5` + `backdrop-blur`.
- ❌ Nie pisz hexów w komponentach (oprócz `#fafafa` jako app bg). Używaj skali `neutral-*`.
- ❌ Nie używaj `border` na kartach pływających nad mapą — `ring-1` daje pół-pixelowy, czystszy efekt.
- ✅ Każda liczba → `tabular-nums`.
- ✅ Każda etykieta meta → `text-[10px] uppercase tracking-widest text-neutral-400`.

---

## 7. Pliki w paczce

- `STYLES.md` — ten dokument
- `tokens.css` — tokeny OKLCH + Tailwind v4 boot (`@import "tailwindcss"`)
- `patterns.tsx` — gotowe do skopiowania komponenty (Pill, NavItem, Chip, Kpi, Input, CTA)
