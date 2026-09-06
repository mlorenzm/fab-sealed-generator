import { cards } from '@flesh-and-blood/cards';
import { Class, Rarity, Release, Talent, Type } from '@flesh-and-blood/types';
import getRandomCard from './getRandomCard';
import { useState } from 'react';
import './HNT.css';

const sealedLegal = cards.filter(
    c =>
        c.sets.includes(Release.OmensOfTheThirdAge) &&
        !c.meta?.includes('Expansion slot') &&
        !c.rarities.includes(Rarity.Token) &&
        !c.types.includes(Type.Hero),
);

const common = sealedLegal.filter(c => c.rarity === Rarity.Common);
const rare = sealedLegal.filter(c => c.rarity === Rarity.Rare);
const majestic = sealedLegal.filter(c => c.rarity === Rarity.Majestic);
const commonRare = common.concat(rare);

const commonNoEquipment = common.filter(c => !c.types.includes(Type.Equipment));
const commonEquipment = common.filter(c => c.types.includes(Type.Equipment));

const illusionist = commonNoEquipment.filter(c => c.classes.length === 1 && c.classes.includes(Class.Illusionist));
const wizard = commonNoEquipment.filter(c => c.classes.length === 1 && c.classes.includes(Class.Wizard));
const runeblade = commonNoEquipment.filter(c => c.classes.length === 1 && c.classes.includes(Class.Runeblade));

const lightningOnly = commonNoEquipment.filter(
    c => c.classes.includes(Class.NotClassed) && c.talents.includes(Talent.Lightning),
);
const generic = commonNoEquipment.filter(c => c.classes.includes(Class.Generic));
const lightningGeneric = (lightningOnly).concat(generic);

[
    sealedLegal,
    common,
    rare,
    commonRare,
    commonNoEquipment,
    commonEquipment,
    illusionist,
    runeblade,
    wizard,
    lightningOnly,
    generic,
    lightningGeneric,
].forEach(b => {
    if (b.length === 0) window.alert('Error: bucket missing cards');
});

// See https://www.youtube.com/watch?v=HCKLBXimmfY&t=28s
const generate = majesticCount => {
    let deck = [];
    const numPacks = 8;

    for (let i = 0; i < numPacks; i++) {
        deck.push(getRandomCard(runeblade));
        deck.push(getRandomCard(runeblade));
        deck.push(getRandomCard(wizard));
        deck.push(getRandomCard(wizard));
        deck.push(getRandomCard(illusionist));
        deck.push(getRandomCard(illusionist));

        deck.push(getRandomCard(lightningGeneric));
        deck.push(getRandomCard(lightningGeneric));
        deck.push(getRandomCard(lightningGeneric));

        deck.push(getRandomCard(common));
        deck.push(getRandomCard(commonEquipment));

        deck.push(getRandomCard(rare));

        if (i < majesticCount) {
            deck.push(getRandomCard(majestic));
        } else {
            deck.push(getRandomCard(rare));
        }

        deck.push(getRandomCard(commonRare));
    }

    // Prerelease pack
    const prereleaseWeapons = cards.filter(
        c =>
            c.setIdentifiers.includes('OMN003') ||
            c.setIdentifiers.includes('OMN096') ||
            c.setIdentifiers.includes('OMN049') ||
            c.setIdentifiers.includes('OMN209') ||
            c.setIdentifiers.includes('OMN210') ||
            c.setIdentifiers.includes('OMN211') ||
            c.setIdentifiers.includes('OMN212') ||
            c.setIdentifiers.includes('OMN227'),
    );
    deck = deck.concat(prereleaseWeapons);

    const params = new URLSearchParams();
    params.append('tab', 'import');
    params.append('format', 'Sealed');
    params.append('cards', 'OMN048'); // Aurora default
    deck.forEach((c, i) => {
        params.append('cards', c.setIdentifiers[0]);
    });

    // debugging
    // console.log(deck.filter(c => c.types.includes(Type.Equipment)));
    // console.log(deck.filter(c => c.classes.includes(Class.Generic) && !c.types.includes(Type.Equipment)));
    // console.log(deck.filter(c => c.classes.length === 0 && c.talents.includes(Talent.Draconic)));

    window.open(`https://fabrary.net/decks?${params.toString()}`, '_blank');
};

export default function OMN() {
    const [majesticCount, setMajesticCount] = useState(0);

    const handleMajesticCountChange = event => {
        let count = parseInt(event.target.value, 10) || 0;
        if (count > 8) count = 8;
        setMajesticCount(count); // Parse to integer, default to 0 if invalid
    };

    const runGenerate = () => {
        generate(majesticCount);
    };

    return (
        <>
            <div id="version">
                <span>V1.0</span>
                <ul>
                    <li>2 Wizard only</li>
                    <li>2 Runeblade only</li>
                    <li>2 Illusionist only</li>
                    <li>3 Lightning only / Generic</li>
                    <li>1 Common wildcard</li>
                    <li>1 Common Equipment</li>
                    <li>1 Rare slot</li>
                    <li>1 Rare / Majestic slot</li>
                    <li>1 Rainbow Foil slot</li>
                    <li>Prerelease pack with all tokens</li>
                </ul>
            </div>
            <label htmlFor="majesticCount">Majestic count:</label>
            <input
                type="number"
                id="majesticCount"
                value={majesticCount}
                min="0"
                max="8"
                onChange={handleMajesticCountChange}
            />
            {majesticCount > 3 && <span>You wish :D</span>}
            <br />
            <button type="button" onClick={runGenerate}>
                Generate
            </button>
        </>
    );
}