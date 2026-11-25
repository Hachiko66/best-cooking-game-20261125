// recipes.js — Warung Rush: ingredients, their preparation steps, and dishes.
// One job: the food data. Nothing here touches the canvas or the clock.

// An item is { kind, state }.
//   state 'raw'     — straight from the pantry
//   state 'chopped' — after the chopping board
//   state 'cooked'  — after the stove
//   state 'ready'   — usable as-is (chilli, peanut sauce)
export const INGREDIENTS = {
  rice: { name: 'Rice', short: 'Rice', color: '#f5efe0', chop: false, cook: true, icon: 'bowl' },
  noodles: { name: 'Noodles', short: 'Noodle', color: '#f2c14e', chop: false, cook: true, icon: 'noodles' },
  chicken: { name: 'Chicken', short: 'Chick', color: '#e8a87c', chop: true, cook: true, icon: 'drumstick' },
  egg: { name: 'Egg', short: 'Egg', color: '#fff6c9', chop: false, cook: true, icon: 'egg' },
  veg: { name: 'Greens', short: 'Green', color: '#58b368', chop: true, cook: false, icon: 'leaf' },
  chilli: { name: 'Chilli', short: 'Chilli', color: '#d93a2b', chop: false, cook: false, icon: 'chilli' },
  peanut: { name: 'Peanut Sauce', short: 'Peanut', color: '#b5762e', chop: false, cook: false, icon: 'sauce' },
};

// A recipe component is { kind, state } — the exact state the dish needs.
export const RECIPES = [
  {
    id: 'nasi-goreng',
    name: 'Nasi Goreng',
    price: 100,
    color: '#e07b39',
    needs: [
      { kind: 'rice', state: 'cooked' },
      { kind: 'egg', state: 'cooked' },
      { kind: 'chilli', state: 'ready' },
    ],
  },
  {
    id: 'mie-ayam',
    name: 'Mie Ayam',
    price: 120,
    color: '#f2c14e',
    needs: [
      { kind: 'noodles', state: 'cooked' },
      { kind: 'chicken', state: 'cooked' },
      { kind: 'veg', state: 'chopped' },
    ],
  },
  {
    id: 'sate-ayam',
    name: 'Sate Ayam',
    price: 90,
    color: '#c96f2e',
    needs: [
      { kind: 'chicken', state: 'cooked' },
      { kind: 'peanut', state: 'ready' },
    ],
  },
  {
    id: 'gado-gado',
    name: 'Gado-Gado',
    price: 110,
    color: '#7fb069',
    needs: [
      { kind: 'veg', state: 'chopped' },
      { kind: 'egg', state: 'cooked' },
      { kind: 'peanut', state: 'ready' },
    ],
  },
];

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id) || null;
}

// True when the plate's items are exactly the recipe's needs, in any order.
export function plateMatchesRecipe(items, recipe) {
  if (items.length !== recipe.needs.length) return false;
  const left = items.map((i) => i.kind + ':' + i.state);
  for (const need of recipe.needs) {
    const idx = left.indexOf(need.kind + ':' + need.state);
    if (idx === -1) return false;
    left.splice(idx, 1);
  }
  return true;
}

// The recipe a plate already completes, or null while it is still partial.
export function recipeForPlate(items) {
  if (items.length === 0) return null;
  return RECIPES.find((r) => plateMatchesRecipe(items, r)) || null;
}

// Next preparation step for an item, or null when it is ready to plate.
export function nextStep(item) {
  const ing = INGREDIENTS[item.kind];
  if (!ing) return null;
  if (item.state === 'raw' && ing.chop) return 'chop';
  if (item.state === 'raw' && ing.cook) return 'cook';
  if (item.state === 'chopped' && ing.cook) return 'cook';
  return null;
}

// Short label shown above the chef's head, e.g. "Rice (cook)".
export function itemLabel(item) {
  const ing = INGREDIENTS[item.kind];
  if (!ing) return '?';
  if (item.state === 'ready') return ing.short;
  if (item.state === 'chopped') return ing.short + ' ✂';
  if (item.state === 'cooked') return ing.short + ' ♨';
  return ing.short;
}
