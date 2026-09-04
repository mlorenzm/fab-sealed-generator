import githubMark from "./github-mark.svg";
import { cards } from "@flesh-and-blood/cards";
import { Rarity, Release, Type } from "@flesh-and-blood/types";
import getRandomCard from "./getRandomCard";
import { useState } from "react";

/*
 * IAR — Usurp the Shadow Throne
 *
 * IMPORTANTE (léelo antes de tocar los números):
 * El set todavía no ha salido (primer lanzamiento: 2026-09-25), así que no existen
 * ratios de sobre confirmados públicamente por LSS/comunidad, a diferencia de HNT
 * (vídeo de Naib) o HVY. Los números de abajo son los que tú diste. La única parte
 * que SÍ pude verificar contra el paquete @flesh-and-blood/cards es el pool de cartas
 * disponible y su rareza:
 *   - 35 comunes (3 de ellas equipo: IAR161, IAR162, IAR163)
 *   - 38 raras
 *   - 17 majestics
 *   - reparto por clase MUY desigual: Brute 3, Necromancer 8, Runeblade 15, NotClassed/Generic 6
 * Por eso NO he metido slots fijos "single-class / wedge" como en HVY.js: con solo 3
 * comunes de Brute, forzar p.ej. "3 slots Brute" haría que salieran casi siempre las
 * mismas 3 cartas. En vez de eso, las 11 comunes no-equipo salen de todo el pool común
 * (sin distinguir clase). Si luego sale confirmado el desglose real por clase, es fácil
 * cambiar COMMONS_NON_EQUIPMENT por sub-pools filtrados por Class.
 *
 * Corrección a tu cálculo de ratios:
 * Con 12 comunes + 1 rara + 1 slot rara/majestic por sobre = 14 cartas "de pool" por sobre.
 * En 5 sobres (70 cartas): 60 comunes, y de los 10 huecos rara/majestic (1 fijo + 1 variable
 * por sobre) salen 9 raras y 1 majestic si el slot variable es majestic 1 de cada 5 veces.
 * Es decir: comunes 60/70, RARAS 9/70 (no 59/70, probablemente un despiste de tecleo),
 * majestic 1/70. En porcentaje: comunes ~85.7%, raras ~12.9%, majestic ~1.4%.
 *
 * Básicas: las 2 cartas "básicas" de cada sobre físico no se generan card-por-card porque
 * en Flesh and Blood las cartas básicas (Cracked Bauble, etc.) son legales en cualquier
 * mazo independientemente de qué sobres hayas abierto — por eso ni HNT.js ni HVY.js las
 * simulan, no cambian el pool sellado real. Aun así, como la pediste explícitamente para
 * que el "sobre" se sienta completo, la genero como Cracked Bauble x2, con 1 de cada 24
 * sobres marcando que una de ellas sería cold foil (mismo ratio base que dijiste). Al ser
 * la misma carta imprimible en múltiples sets, el identificador exacto usado da igual para
 * la legalidad del mazo; cojo el primero que trae el paquete.
 */

const RATIOS = {
  packsPerSealedPool: 8,
  commonsPerPack: 12, // incluye 1 de equipo
  equipmentCommonsPerPack: 1,
  raresPerPack: 1, // slot fijo, siempre rara
  rareOrMajesticPerPack: 1, // slot variable
  majesticChance: 1 / 5,
  basicsPerPack: 2,
  coldFoilBasicEveryNPacks: 24,
};

const expansionSlotIds = cards
  .filter(
    (card) =>
      card.sets.includes(Release.UsurpTheShadowThrone) &&
      card.meta?.includes("Expansion slot"),
  )
  .map((card) => card.setIdentifiers[0]);

const iarPool = cards.filter(
  (card) =>
    card.sets.includes(Release.UsurpTheShadowThrone) &&
    !expansionSlotIds.includes(card.setIdentifiers[0]),
);

// OJO: en este set los héroes tienen rarity "Basic" (es así en todo el juego, no un error
// de datos), así que hay que sacarlos ANTES de descartar nada por rareza.
const heroes = iarPool.filter((card) => card.types.includes(Type.Hero));

// mainPool: quita héroes y tokens. Los "Basic rarity" que no son héroe (armas/equipo
// exclusivos de precons, p.ej. Hell Hammer, Vox Necropolis) quedan fuera solos, porque
// commons/rares/majestics se filtran por rarity exacta más abajo.
const mainPool = iarPool.filter(
  (card) =>
    !card.types.includes(Type.Hero) && !card.rarities.includes(Rarity.Token),
);

const commons = mainPool.filter((card) => card.rarity === Rarity.Common);
const rares = mainPool.filter((card) => card.rarity === Rarity.Rare);
const majestics = mainPool.filter((card) => card.rarity === Rarity.Majestic);

const commonsEquipment = commons.filter((card) =>
  card.types.includes(Type.Equipment),
);
const commonsNonEquipment = commons.filter(
  (card) => !card.types.includes(Type.Equipment),
);

[
  commons,
  commonsEquipment,
  commonsNonEquipment,
  rares,
  majestics,
  heroes,
].forEach((bucket) => {
  if (bucket.length === 0) window.alert("Error: bucket missing cards");
});

const crackedBauble = cards.find((card) => card.name === "Cracked Bauble");

const generate = (heroId) => {
  const deck = [];
  let coldFoilBasicsSeen = 0;

  for (let i = 0; i < RATIOS.packsPerSealedPool; i++) {
    for (let j = 0; j < RATIOS.equipmentCommonsPerPack; j++)
      deck.push(getRandomCard(commonsEquipment));
    for (
      let j = 0;
      j < RATIOS.commonsPerPack - RATIOS.equipmentCommonsPerPack;
      j++
    )
      deck.push(getRandomCard(commonsNonEquipment));

    deck.push(getRandomCard(rares)); // slot fijo

    // slot variable: rara o majestic
    if (Math.random() < RATIOS.majesticChance) {
      deck.push(getRandomCard(majestics));
    } else {
      deck.push(getRandomCard(rares));
    }

    // básicas (no afectan al pool sellado real, ver comentario arriba)
    for (let j = 0; j < RATIOS.basicsPerPack; j++) {
      deck.push(crackedBauble);
    }
    coldFoilBasicsSeen += 1;
  }

  const coldFoilBasicPacks = Math.floor(
    coldFoilBasicsSeen / RATIOS.coldFoilBasicEveryNPacks,
  );

  const params = new URLSearchParams();
  params.append("tab", "import");
  params.append("format", "Sealed");
  params.append("cards", heroId);
  deck.forEach((card) => {
    params.append("cards", card.setIdentifiers[0]);
  });

  window.open(`https://fabrary.net/decks?${params.toString()}`, "_blank");

  return coldFoilBasicPacks;
};

export default function IAR() {
  const [selectedHero, setSelectedHero] = useState(
    heroes[0]?.setIdentifiers[0] ?? "",
  );

  const handleHeroChange = (event) => {
    setSelectedHero(event.target.value);
  };

  const runGenerate = () => {
    generate(selectedHero);
  };

  return (
    <>
      <div id="version">
        <span>v IAR.1</span>
        <a id="fork-me" href="https://github.com/theblang/fab-sealed-generator">
          <img src={githubMark} />
        </a>
      </div>
      <div id="assumptions">
        <div>
          <b>
            Assumptions (set sin publicar, ratios sin confirmar oficialmente)
          </b>
        </div>
        <ul>
          <li>8 sobres</li>
          <li>
            12 comunes por sobre (1 de equipo, 11 del pool común sin distinguir
            clase)
          </li>
          <li>1 rara fija</li>
          <li>1 slot rara/majestic (~1 majestic cada 5 sobres, resto rara)</li>
          <li>
            2 básicas (Cracked Bauble) por sobre — no afectan al pool sellado
            legal
          </li>
          <li>1 de cada 24 sobres, una básica sería cold foil (cosmético)</li>
        </ul>
      </div>
      <label htmlFor="hero">Héroe:</label>
      <select id="hero" value={selectedHero} onChange={handleHeroChange}>
        {heroes.map((hero) => (
          <option key={hero.setIdentifiers[0]} value={hero.setIdentifiers[0]}>
            {hero.name} ({hero.classes.join("/")})
          </option>
        ))}
      </select>
      <br />
      <button type="button" onClick={runGenerate}>
        Generate
      </button>
    </>
  );
}
