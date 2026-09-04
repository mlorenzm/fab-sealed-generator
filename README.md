# Try it [here](https://mlorenzm.github.io/fab-sealed-generator/)

## Credits

Big thanks to [FaBrary's typed library](https://github.com/fabrary/cards), which in turn sources data from [The Fab Cube](https://github.com/the-fab-cube/flesh-and-blood-cards).

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

This is a fork of [theblang's](https://github.com/theblang/fab-sealed-generator) project to maintain it up to date and add some ameliorations so thanks to him for the creation of this

## Changelog

**1.0**
Add Omens of the Third Age

**HNT.2**

Add Majestic option

**HNT.1**

Initial implementation

**HVY.2**

-   Fix **significant** bug where all common slots are the same, pulling from the entire pool. In reality: five are single-class, 3 are wedge, and 3 are generic/equipment.
-   Tweak randomization code
-   Implement export using query params, which FaBrary taught me via a message to [their Patreon](https://www.patreon.com/fabrary/posts)!
-   Remove the majestic

**IAR 0.1**

Initial implementation, randomized commons.

TODO:
- Verify if there is at least 1 equipment per pack (IRL)
- Implement sheet distribution of commons (Levia issue, currently (4/9/26) there are only 3 shadow brute commons)
- Verify Hero card, IAR script includes all heroes in the pool, but Fabrary only gets viserai
- Verify if needed to manually remove Gate to i'Arathael (IAR222 is Marvel AND legal in sealed)
- Verify ratios of marvel cards legal in sealed (allies, young heroes)
- Remove marvel cards entirely? 