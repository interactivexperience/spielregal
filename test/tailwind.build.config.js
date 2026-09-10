// Spiegelt die Inline-Config aus index.html, damit der Offline-Test echtes
// Tailwind-CSS bekommt statt eines Stubs — sonst sieht man optische Fehler nicht.
const names = ["bg","surface","surface2","line","faint","dim","ink","accent","gold","teal",
  "tealdeep","plum","lent","info","danger","rim"];
module.exports = {
  content: ["../index.html"],
  theme: { extend: { colors: Object.fromEntries(
    names.map((n) => [n, `rgb(var(--${n}) / <alpha-value>)`])
  ) } },
};
