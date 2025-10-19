/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],

  // >>> Ajout pour éviter la purge en prod (classes dynamiques, crochets, etc.)
  safelist: [
    // largeurs/hauteurs arbitraires: w-[...], h-[...], max-w-[...]
    { pattern: /max-w-\[.*\]/, variants: ["sm","md","lg","xl"] },
    { pattern: /w-\[.*\]/,     variants: ["sm","md","lg","xl"] },
    { pattern: /h-\[.*\]/,     variants: ["sm","md","lg","xl"] },

    // espacements
    { pattern: /gap-\d+/,      variants: ["sm","md","lg","xl"] },
    { pattern: /space-y-\d+/,  variants: ["sm","md","lg","xl"] },
    { pattern: /p(?:x|y)?-\d+/, variants: ["sm","md","lg","xl","hover","focus"] },
    { pattern: /m(?:x|y)?-\d+/, variants: ["sm","md","lg","xl"] },

    // bordures / arrondis / ombres
    { pattern: /rounded(?:-(?:sm|md|lg|xl|2xl|3xl))?/ },
    { pattern: /border(?:-[a-z-]+)?/ },
    { pattern: /shadow(?:-[a-z-]+)?/ },

    // typo
    { pattern: /text-(?:xs|sm|base|lg|xl|2xl|3xl|4xl)/, variants: ["sm","md","lg","xl"] },

    // couleurs arbitraires en crochets, ex: bg-[#0E0E0E], border-[rgb(255,0,0)]
    { pattern: /(?:bg|text|border)-\[[^\]]+\]/, variants: ["hover","sm","md","lg","xl"] },
  ],

  theme: {
    extend: {
      colors: {
        // (Conserve tes couleurs existantes)
        brand: { bg: '#0b0f19', card: '#121826', border: '#273148' },
      },
      boxShadow: { soft: '0 4px 20px rgba(0,0,0,0.25)' },
      borderRadius: { xl2: '1rem' },
    },
  },

  plugins: [],
};
