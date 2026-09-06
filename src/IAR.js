import { cards } from '@flesh-and-blood/cards';
import { Class, Foiling, Rarity, Release, Talent, Type } from '@flesh-and-blood/types';
import getRandomCard from './getRandomCard';
import { useState } from 'react';

const RATIOS = {
    packsPerSealedPool: 8,
    commonsPerPack: 12, // incluye 1 de equipo
    equipmentCommonsPerPack: 1,
    majesticChance: 1/5,
    basicsPerPack: 2,
    coldFoilChancePerPack: 1 / 24, // 1 sobre de cada 24 sustituye una básica
};

const iarSealedLegal = cards.filter(
    card => card.sets.includes(Release.UsurpTheShadowThrone) && card.legalFormats.includes('Sealed'),
);

// Pool del que se sortean los sobres: fuera héroes, tokens, "Basic" (esos van a extras),
// y fuera las cartas que además pertenecen a Release.GEM. Esas son reprints que se
// reparten en un producto distinto (p.ej. los 7 "Runechant of..."), no salen de un sobre
// de IAR aunque el paquete las marque como parte de este set. OJO: esta exclusión de GEM
// es solo para el pool de sobres — las armas de héroe (Seven Sin Nebula, Vox Necropolis)
// también comparten set con GEM pero se quedan en `extras` porque no se sortean, son el
// arma fija de Viserai/Malice.
const boosterPool = iarSealedLegal.filter(
    card => !card.types.includes(Type.Hero) && !card.rarities.includes(Rarity.Token) && card.rarity !== Rarity.Basic,
);

const commons = boosterPool.filter(card => card.rarity === Rarity.Common);
const rares = boosterPool.filter(card => card.rarity === Rarity.Rare);
const majestics = boosterPool.filter(card => card.rarity === Rarity.Majestic);

const commonsEquipment = commons.filter(card => card.types.includes(Type.Equipment));
const commonsNonEquipment = commons.filter(card => !card.types.includes(Type.Equipment));

const bruteCommons = commonsNonEquipment.filter(card => card.classes.includes(Class.Brute));
const necromancerCommons = commonsNonEquipment.filter(card => card.classes.includes(Class.Necromancer));
const runebladeCommons = commonsNonEquipment.filter(card => card.classes.includes(Class.Runeblade));

const shadowCommons = commonsNonEquipment.filter(
    card => card.classes.includes(Class.NotClassed) && card.talents.includes(Talent.Shadow),
);

// Extras: héroes + su arma + su equipo especial (todo lo "Basic" sealed-legal).
const extras = iarSealedLegal.filter(card => card.rarity === Rarity.Basic);

const crackedBauble = cards.find(card => card.name === 'Cracked Bauble');

// El foiling no está en la card en sí (card.foiling es siempre undefined), sino en
// cada printing (card.printings[]). Para saber si una carta tiene versión foil en IAR
// hay que mirar sus printings de IAR con ese tratamiento.
const hasIARFoiling = foiling => card =>
    card.printings.some(printing => printing.set === Release.UsurpTheShadowThrone && printing.foiling === foiling);

const coldFoilPool = boosterPool.filter(hasIARFoiling(Foiling.Cold));
const rainbowFoilPool = boosterPool.filter(hasIARFoiling(Foiling.Rainbow));

const coldFoilCommons = coldFoilPool.filter(card => card.rarity === Rarity.Common);
const coldFoilRares = coldFoilPool.filter(card => card.rarity === Rarity.Rare);
const coldFoilMajestics = coldFoilPool.filter(card => card.rarity === Rarity.Majestic);

const rainbowFoilCommons = rainbowFoilPool.filter(card => card.rarity === Rarity.Common);
const rainbowFoilRares = rainbowFoilPool.filter(card => card.rarity === Rarity.Rare);
const rainbowFoilMajestics = rainbowFoilPool.filter(card => card.rarity === Rarity.Majestic);

// Algunas cartas del pool comparten printing con Release.GEM (p.ej. Acrid Stench
// [GEM196, IAR069]). setIdentifiers[0] devolvería el ID de GEM; para exportar un pool
// de IAR a Fabrary hay que usar el identifier del printing de IAR.
const getIARIdentifier = card => {
    const iarPrinting = card.printings.find(p => p.set === Release.UsurpTheShadowThrone);
    return iarPrinting ? iarPrinting.identifier : card.setIdentifiers[0];
};

[
    commons,
    commonsEquipment,
    commonsNonEquipment,
    rares,
    majestics,
    extras,
    bruteCommons,
    necromancerCommons,
    runebladeCommons,
    shadowCommons,
    coldFoilCommons,
    coldFoilRares,
    coldFoilMajestics,
    rainbowFoilCommons,
    rainbowFoilRares,
    rainbowFoilMajestics,
    crackedBauble,
].forEach(bucket => {
    if (!bucket || bucket.length === 0) window.alert('Error: bucket missing cards');
});

// Sorteo ponderado para el cold foil: mismas probabilidades que el resto del pool
// (60/70 común, 9/70 rara, 1/70 majestic).
const CF_COMMON_CUTOFF = 60 / 70;
const CF_RARE_CUTOFF = 69 / 70;

const getWeightedFoilCard = foilingType => {
    const roll = Math.random();
    if (foilingType === 'cold') {
        if (roll < CF_COMMON_CUTOFF) return getRandomCard(coldFoilCommons);
        if (roll < CF_RARE_CUTOFF) return getRandomCard(coldFoilRares);
        return getRandomCard(coldFoilMajestics);
    } else {
        if (roll < CF_COMMON_CUTOFF) return getRandomCard(rainbowFoilCommons);
        if (roll < CF_RARE_CUTOFF) return getRandomCard(rainbowFoilRares);
        return getRandomCard(rainbowFoilMajestics);
    }
};

const generate = () => {
    let deck = [];
    let coldFoilPacksSeen = 0;
    const coldFoilCards = [];
    const numPacks = 8;
    for (let i = 0; i < numPacks; i++) {
        deck.push(getRandomCard(bruteCommons));
        deck.push(getRandomCard(bruteCommons));
        deck.push(getRandomCard(necromancerCommons));
        deck.push(getRandomCard(necromancerCommons));
        deck.push(getRandomCard(runebladeCommons));
        deck.push(getRandomCard(runebladeCommons));

        deck.push(getRandomCard(shadowCommons));
        deck.push(getRandomCard(shadowCommons));
        deck.push(getRandomCard(shadowCommons));
        // WILDCARD
        deck.push(getRandomCard(commonsNonEquipment));
        deck.push(getRandomCard(commonsEquipment));

        deck.push(getRandomCard(rares));

        if (Math.random() < RATIOS.majesticChance) {
            deck.push(getRandomCard(majestics));
        } else {
            deck.push(getRandomCard(rares));
        }
        const rainbowFoil = getWeightedFoilCard();
        deck.push(rainbowFoil);

        const packHasColdFoil = Math.random() < RATIOS.coldFoilChancePerPack;
        if (packHasColdFoil) {
            const coldFoil = getWeightedFoilCard('cold');
            deck.push(coldFoil);
            deck.push(crackedBauble);
            coldFoilPacksSeen += 1;
            coldFoilCards.push({ pack: i + 1, card: coldFoil });
        } else {
            for (let j = 0; j < RATIOS.basicsPerPack; j++) deck.push(crackedBauble);
        }
    }

    // Extras: todos los héroes sealed-legal + su arma + su equipo especial, uno de cada.
    extras.forEach(card => deck.push(card));

    const params = new URLSearchParams();
    params.append('tab', 'import');
    params.append('format', 'Sealed');
    deck.forEach(card => {
        params.append('cards', getIARIdentifier(card));
    });

    window.open(`https://fabrary.net/decks?${params.toString()}`, '_blank');

    return { coldFoilPacksSeen, coldFoilCards };
};

// // OLD; DEPRECATED
// const generate2 = () => {
//   const deck = [];
//   let coldFoilPacksSeen = 0;
//   const coldFoilCards = [];

//   for (let i = 0; i < RATIOS.packsPerSealedPool; i++) {
//     for (let j = 0; j < RATIOS.equipmentCommonsPerPack; j++)
//       deck.push(getRandomCard(commonsEquipment));
//     for (
//       let j = 0;
//       j < RATIOS.commonsPerPack - RATIOS.equipmentCommonsPerPack;
//       j++
//     )
//       deck.push(getRandomCard(commonsNonEquipment));

//     deck.push(getRandomCard(rares)); // slot fijo, siempre rara

//     // slot variable: rara o majestic
//     if (Math.random() < RATIOS.majesticChance) {
//       deck.push(getRandomCard(majestics));
//     } else {
//       deck.push(getRandomCard(rares));
//     }

//     // básicas: normalmente Cracked Bauble x2, salvo ~1/24 sobres donde una se
//     // sustituye por una carta jugable con el ratio de rareza del pool general.
//     const packHasColdFoil = Math.random() < RATIOS.coldFoilChancePerPack;
//     if (packHasColdFoil) {
//       const coldFoil = getWeightedCFCard();
//       deck.push(coldFoil);
//       deck.push(crackedBauble);
//       coldFoilPacksSeen += 1;
//       coldFoilCards.push({ pack: i + 1, card: coldFoil });
//     } else {
//       for (let j = 0; j < RATIOS.basicsPerPack; j++) deck.push(crackedBauble);
//     }
//   }

//   // Extras: todos los héroes sealed-legal + su arma + su equipo especial, uno de cada.
//   extras.forEach((card) => deck.push(card));

//   const params = new URLSearchParams();
//   params.append("tab", "import");
//   params.append("format", "Sealed");
//   deck.forEach((card) => {
//     params.append("cards", card.setIdentifiers[0]);
//   });

//   window.open(`https://fabrary.net/decks?${params.toString()}`, "_blank");

//   return { coldFoilPacksSeen, coldFoilCards };
// };

export default function IAR() {
    const [result, setResult] = useState(null);

    const handleGenerate = () => {
        const { coldFoilPacksSeen, coldFoilCards } = generate();
        setResult({ coldFoilPacksSeen, coldFoilCards });
    };

    return (
        <>
            <div id="version">
                <span>v IAR 0.3</span>
            </div>
            <div id="assumptions">
                <div>
                    <b>Assumptions (unpublished set)</b>
                </div>
                <ul>
                    <li>8 packs, sin héroe fijado — eliges dentro de Fabrary</li>
                    <li>
                        11 comunes por sobre repartidas por clase (2 Brute, 2 Necromancer, 2 Runeblade, 3 Shadow, 1
                        wildcard) + 1 equipo común
                    </li>
                    <li>1 rainbow foil por sobre con ratio 60/70 común, 9/70 rara, 1/70 majestic</li>
                    <li>1 rare slot</li>
                    <li>1 rare/majestic slot (~1 majestic cada 5 sobres)</li>
                    <li>2 basics (Cracked Bauble) por sobre</li>
                    <li>
                        ~1/24 sobres, una básica se sustituye por una carta cold foil con el mismo ratio de rareza que
                        el resto del pool (común 60/70, rara 9/70, majestic 1/70)
                    </li>
                    <li>
                        Extra: se añaden TODOS los héroes sealed-legal + su arma + su equipo especial (1 copia de cada),
                        no simula probabilidad de sobre, es solo para tener el pool completo
                    </li>
                    <li>
                        Legendary / Fabled / Marvel excluidos automáticamente vía legalFormats.includes('Sealed'), no
                        por rareza a mano
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
                            ¡Cold foil! Tocó en {result.coldFoilPacksSeen} de los 8 sobres:{' '}
                            {result.coldFoilCards.map(hit => `sobre #${hit.pack} → ${hit.card.name}`).join(', ')}
                        </p>
                    )}
                </div>
            )}
        </>
    );
}
