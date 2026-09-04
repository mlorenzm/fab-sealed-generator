import { cards } from "@flesh-and-blood/cards";
import { Rarity, Release, Type } from "@flesh-and-blood/types";
import getRandomCard from "./getRandomCard";
import { useState } from "react";

/*
 * IAR — Usurp the Shadow Throne
 *
 * v3: ya no fuerza un héroe. Genera 8 sobres + una sección de "extras" (todos los
 * héroes sealed-legal con su arma y su equipamiento especial) y lo manda todo a
 * Fabrary junto. Tú eliges el héroe dentro de Fabrary.
 *
 * LEGALIDAD EN LIMITADO (Legendary / Fabled / Marvel fuera):
 * En vez de mantener una lista negra de rarezas a mano, uso el campo `legalFormats`
 * que trae cada carta del paquete @flesh-and-blood/cards. Lo comprobé a mano contra
 * el pool real de IAR: las 7 cartas Legendary/Fabled del set (Circlet of Eternal End,
 * Danse Macabre, Reach of the Abyss, Arknight Shard, Soul of Existence, Usurp the
 * Shadow Throne, y el héroe Marvel "Baalghor, Omen of the End") NO tienen 'Sealed' en
 * su legalFormats. Filtrando por `c.legalFormats.includes('Sealed')` se caen solas,
 * sin tener que adivinar qué rarezas están prohibidas en cada set.
 * Ese mismo filtro, de regalo, también excluye los "Expansion slot" (reprints de
 * otros sets insertados en el sobre): en IAR ninguno de esos 14 reprints es
 * sealed-legal, así que no hace falta la lógica de expansionSlotMap que sí necesitaba
 * HVY.js.
 *
 * Comunes por clase: sigue sin haber slots fijos por clase (ver v1/v2): el reparto
 * real es muy desigual (Brute 3, Necromancer 8, Runeblade 15, Generic/NotClassed 6),
 * así que las 11 comunes no-equipo se sacan del pool común entero sin distinguir clase.
 *
 * Extras (héroes + arma + equipo especial):
 * Los héroes, sus armas de firma y su equipo especial de precon están todos marcados
 * con rarity "Basic" en este set (y así es en todo el juego, no es un bug de datos).
 * Filtrando `rarity === Rarity.Basic` dentro del pool sealed-legal salen exactamente:
 *   - Levia (héroe, Brute) + Hell Hammer (arma) + Hex Gauntlet (equipo especial)
 *   - Malice (héroe, Necromancer) + Vox Necropolis (arma) + Appalling Bearers (equipo)
 *     + Corrupted Corpse (acción básica de firma) + Blasmophet (token de invocación)
 *   - Viserai, Between Worlds (héroe, Runeblade) + Seven Sin Nebula (arma)
 *     + Grasp of the Darknight (equipo especial)
 * Las otras variantes de estos héroes (Malice, Domina of the Dead / Viserai, the
 * Forsaken / Viserai, Usurper / Baalghor, Omen of the End) NO están en
 * legalFormats.Sealed, así que ya vienen excluidas por el mismo filtro de arriba —
 * no hace falta descartarlas a mano. Baalghor en concreto es rareza "Rare" con una
 * variante de arte "Marvel", pero como no está en Sealed/Draft para ningún formato,
 * el propio filtro lo tira sin que haya que pensar en su pull rate.
 * Esto NO simula la probabilidad real de sacar cada héroe/arma en un sobre: se
 * añaden todos, uno de cada, para que tengas el pool completo disponible en Fabrary
 * y decidas qué héroe jugar tú.
 *
 * Cartas Marvel (arte alternativo full-art / cold foil de otra carta):
 * En este paquete "Marvel" suele ser solo un tratamiento de arte alternativo de una
 * carta que YA está incluida por su rareza normal (ej. "Become the Shadow Lord" es
 * una majestic estándar que también tiene una versión Marvel full-art de sí misma,
 * no es una carta aparte). Comprobado: 0 cartas del pool sealed-legal de IAR tienen
 * "Marvel" como rareza PRINCIPAL (solo aparece en el array agregado `rarities`, que
 * lista todos los tratamientos que ha tenido el nombre de la carta). El caso de
 * IAR222 (Gate to i'Arathael) tampoco se cuela: es un token de rareza Promo, y los
 * tokens ya están excluidos del pool de sobres.
 */

const RATIOS = {
  packsPerSealedPool: 8,
  commonsPerPack: 12, // incluye 1 de equipo
  equipmentCommonsPerPack: 1,
  majesticChance: 1 / 5, // en el slot variable rara/majestic
  basicsPerPack: 2,
  coldFoilChancePerPack: 1 / 24, // 1 sobre de cada 24 sustituye una básica
};

const iarSealedLegal = cards.filter(
  (card) =>
    card.sets.includes(Release.UsurpTheShadowThrone) &&
    card.legalFormats.includes("Sealed"),
);

// Pool del que se sortean los sobres: fuera héroes, tokens, "Basic" (esos van a extras),
// y fuera las cartas que además pertenecen a Release.GEM. Esas son reprints que se
// reparten en un producto distinto (p.ej. los 7 "Runechant of..."), no salen de un sobre
// de IAR aunque el paquete las marque como parte de este set. OJO: esta exclusión de GEM
// es solo para el pool de sobres — las armas de héroe (Seven Sin Nebula, Vox Necropolis)
// también comparten set con GEM pero se quedan en `extras` porque no se sortean, son el
// arma fija de Viserai/Malice.
const boosterPool = iarSealedLegal.filter(
  (card) =>
    !card.types.includes(Type.Hero) &&
    !card.rarities.includes(Rarity.Token) &&
    card.rarity !== Rarity.Basic
);

const commons = boosterPool.filter((card) => card.rarity === Rarity.Common);
const rares = boosterPool.filter((card) => card.rarity === Rarity.Rare);
const majestics = boosterPool.filter(
  (card) => card.rarity === Rarity.Majestic,
);

const commonsEquipment = commons.filter((card) =>
  card.types.includes(Type.Equipment),
);
const commonsNonEquipment = commons.filter(
  (card) => !card.types.includes(Type.Equipment),
);

// Extras: héroes + su arma + su equipo especial (todo lo "Basic" sealed-legal).
const extras = iarSealedLegal.filter((card) => card.rarity === Rarity.Basic);

const crackedBauble = cards.find((card) => card.name === "Cracked Bauble");

[
  commons,
  commonsEquipment,
  commonsNonEquipment,
  rares,
  majestics,
  extras,
].forEach((bucket) => {
  if (bucket.length === 0) window.alert("Error: bucket missing cards");
});

// Sorteo ponderado para el cold foil: mismas probabilidades que el resto del pool
// (60/70 común, 9/70 rara, 1/70 majestic).
const RAINBOW_COMMON_CUTOFF = 60 / 70;
const RAINBOW_RARE_CUTOFF = 69 / 70;

const getWeightedRainbowCard = () => {
  const roll = Math.random();
  if (roll < RAINBOW_COMMON_CUTOFF) return getRandomCard(commons);
  if (roll < RAINBOW_RARE_CUTOFF) return getRandomCard(rares);
  return getRandomCard(majestics);
};

const generate = () => {
  const deck = [];
  let coldFoilPacksSeen = 0;
  const coldFoilCards = [];

  for (let i = 0; i < RATIOS.packsPerSealedPool; i++) {
    for (let j = 0; j < RATIOS.equipmentCommonsPerPack; j++)
      deck.push(getRandomCard(commonsEquipment));
    for (
      let j = 0;
      j < RATIOS.commonsPerPack - RATIOS.equipmentCommonsPerPack;
      j++
    )
      deck.push(getRandomCard(commonsNonEquipment));

    deck.push(getRandomCard(rares)); // slot fijo, siempre rara

    // slot variable: rara o majestic
    if (Math.random() < RATIOS.majesticChance) {
      deck.push(getRandomCard(majestics));
    } else {
      deck.push(getRandomCard(rares));
    }

    // básicas: normalmente Cracked Bauble x2, salvo ~1/24 sobres donde una se
    // sustituye por una carta jugable con el ratio de rareza del pool general.
    const packHasColdFoil = Math.random() < RATIOS.coldFoilChancePerPack;
    if (packHasColdFoil) {
      const rainbowCard = getWeightedRainbowCard();
      deck.push(rainbowCard);
      deck.push(crackedBauble);
      coldFoilPacksSeen += 1;
      coldFoilCards.push({ pack: i + 1, card: rainbowCard });
    } else {
      for (let j = 0; j < RATIOS.basicsPerPack; j++) deck.push(crackedBauble);
    }
  }

  // Extras: todos los héroes sealed-legal + su arma + su equipo especial, uno de cada.
  extras.forEach((card) => deck.push(card));

  const params = new URLSearchParams();
  params.append("tab", "import");
  params.append("format", "Sealed");
  deck.forEach((card) => {
    params.append("cards", card.setIdentifiers[0]);
  });

  window.open(`https://fabrary.net/decks?${params.toString()}`, "_blank");

  return { coldFoilPacksSeen, coldFoilCards };
};

export default function IAR() {
  const [result, setResult] = useState(null);

  const handleGenerate = () => {
    const { coldFoilPacksSeen, coldFoilCards } = generate();
    setResult({ coldFoilPacksSeen, coldFoilCards });
  };

  return (
    <>
      <div id="version">
        <span>v IAR 0.2</span>

      </div>
      <div id="assumptions">
        <div>
          <b>Assumptions (unpublished set)</b>
        </div>
        <ul>
          <li>8 packs, sin héroe fijado — eliges dentro de Fabrary</li>
          <li>
            12 comunes por sobre (1 de equipo, 11 del pool común sin
            distinguir clase)
          </li>
          <li>1 rare slot</li>
          <li>1 rare/majestic slot (~1 majestic cada 5 sobres)</li>
          <li>2 basics (Cracked Bauble) por sobre</li>
          <li>
            ~1/24 sobres, una básica se sustituye por una carta rainbow/cold
            foil con el mismo ratio de rareza que el resto del pool (común
            60/70, rara 9/70, majestic 1/70)
          </li>
          <li>
            Extra: se añaden TODOS los héroes sealed-legal + su arma + su
            equipo especial (1 copia de cada), no simula probabilidad de
            sobre, es solo para tener el pool completo
          </li>
          <li>
            Legendary / Fabled / Marvel excluidos automáticamente vía
            legalFormats.includes('Sealed'), no por rareza a mano
          </li>
        </ul>
      </div>
      <button type="button" onClick={handleGenerate}>
        Generate
      </button>
      {result && (
        <div id="cold-foil-result">
          {result.coldFoilPacksSeen === 0 ? (
            <p>Sin cold foil esta vez (probabilidad por sobre: 1/24).</p>
          ) : (
            <p>
              ¡Cold foil! Tocó en {result.coldFoilPacksSeen} de los 8 sobres:{" "}
              {result.coldFoilCards
                .map((hit) => `sobre #${hit.pack} → ${hit.card.name}`)
                .join(", ")}
            </p>
          )}
        </div>
      )}
    </>
  );
}