import { cards } from '@flesh-and-blood/cards';
import { Class, Foiling, Rarity, Release, Talent, Type } from '@flesh-and-blood/types';
import getRandomCard from './getRandomCard';
import { useState } from 'react';

const RATIOS = {
    packsPerSealedPool: 8,
    commonsPerPack: 12, // incluye 1 de equipo
    equipmentCommonsPerPack: 1,
    majesticChance: 1 / 5,
    basicsPerPack: 2,
    coldFoilChancePerPack: 1 / 24, // 1 sobre de cada 24 sustituye una básica
};

const iarSealedLegal = cards.filter(
    card => card.sets.includes(Release.UsurpTheShadowThrone) && card.legalFormats.includes('Sealed'),
);

const boosterPool = iarSealedLegal.filter(
    card => !card.types.includes(Type.Hero) && !card.rarities.includes(Rarity.Token) && card.rarity !== Rarity.Basic, //for some reason this cracked bauble is not a basic on Cards.tsx
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

// Extras: Rarity: Basic sealed legal cards
const extras = iarSealedLegal.filter(card => card.rarity === Rarity.Basic && !card.setIdentifiers.includes('IAR242'));

// const crackedBauble = cards.find(card => card.name === 'Cracked Bauble');

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
            coldFoilPacksSeen += 1;
            coldFoilCards.push({ pack: i + 1, card: coldFoil });
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

export default function IAR() {
    const [result, setResult] = useState(null);

    const handleGenerate = () => {
        const { coldFoilPacksSeen, coldFoilCards } = generate();
        setResult({ coldFoilPacksSeen, coldFoilCards });
    };

    return (
        <>
            <div id="version">
                <span>v IAR v1.0</span>
            </div>
            <div id="assumptions">
                <div>
                    <b>Assumptions (unpublished set)</b>
                </div>
                <ul>
                    <li>8 packs</li>
                    <li>11 commons:2 Brute, 2 Necromancer, 2 Runeblade, 3 Shadow, 1 wildcard + 1 equipment</li>
                    <li>1 rare slot</li>
                    <li>1 rare/majestic slot (~1 majestic cada 5 sobres)</li>
                    <li>1 rainbow foil: ratio 60/70 common, 9/70 rare, 1/70 majestic</li>
                    <li>
                        1/24 chance per pack: cold foil with same ratio as rest of pool (common 60/70, rare 9/70,
                        majestic 1/70)
                    </li>
                </ul>
            </div>
            <button type="button" onClick={handleGenerate}>
                Generate
            </button>
            {result && (
                <div id="cold-foil-result">
                    {result.coldFoilPacksSeen === 0 ? (
                        <p>Without cold foil (1/24 chance).</p>
                    ) : (
                        <p>
                            ¡Cold foil! In {result.coldFoilPacksSeen} of 8 packs:{' '}
                            {result.coldFoilCards.map(hit => `sobre #${hit.pack} → ${hit.card.name}`).join(', ')}
                        </p>
                    )}
                </div>
            )}
        </>
    );
}
