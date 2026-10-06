// Reference imagery for the institutions represented in Valora's simulations.
// AIPPM is a Model UN format, not a standalone institution with one official logo.
export const committeeLogos: Record<string, {src:string; alt:string; source:string}> = {
  who: {src:"/committees/who.svg", alt:"World Health Organization logo", source:"https://commons.wikimedia.org/wiki/File:World_Health_Organization_Logo.svg"},
  unga: {src:"/committees/un.svg", alt:"United Nations emblem", source:"https://commons.wikimedia.org/wiki/File:Emblem_of_the_United_Nations_(blue).svg"},
  unhrc: {src:"/committees/unhrc.svg", alt:"United Nations Human Rights Council emblem", source:"https://en.wikipedia.org/wiki/File:United_Nations_Human_Rights_Council_Logo.svg"},
  "lok-sabha": {src:"/committees/lok-sabha.svg", alt:"Lok Sabha emblem", source:"https://commons.wikimedia.org/wiki/File:Lok_Sabha.svg"},
  aippm: {src:"/committees/aippm-valora.svg", alt:"Valora MUN AIPPM committee emblem", source:""},
  unfccc: {src:"/committees/unfccc.svg", alt:"UNFCCC logo", source:"https://commons.wikimedia.org/wiki/File:UNFCCC_logo.svg"},
};
