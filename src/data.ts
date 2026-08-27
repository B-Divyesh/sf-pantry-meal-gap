import type { AppState, Meal, MealIngredient, Unit } from './types';

type IngredientSeed = [name: string, quantity: number, unit: Unit, substitutions?: string[]];

function ingredient(mealId: string, index: number, seed: IngredientSeed): MealIngredient {
  return {
    id: `${mealId}-ingredient-${index + 1}`,
    name: seed[0],
    quantity: seed[1],
    unit: seed[2],
    substitutions: seed[3] ?? []
  };
}

function meal(id: string, name: string, note: string, tags: string[], seeds: IngredientSeed[]): Meal {
  return {
    id,
    name,
    note,
    tags,
    ingredients: seeds.map((seed, index) => ingredient(id, index, seed)),
    starter: true,
    updatedAt: 1
  };
}

export const STARTER_MEALS: Meal[] = [
  meal('starter-tomato-lentils', 'Tomato lentil pot', 'A pantry-friendly one-pot base. Season it your way.', ['one pot', 'plant-based'], [
    ['red lentils', 1, 'cup', ['brown lentils']], ['tomatoes', 1, 'can', ['chopped tomatoes']], ['onion', 1, 'item', ['shallot']], ['garlic', 2, 'clove', ['garlic powder']], ['vegetable stock', 2, 'cup', ['water']]
  ]),
  meal('starter-fried-rice', 'Use-what-you-have fried rice', 'Best with cooked, chilled rice and any quick-cooking vegetables.', ['quick', 'flexible'], [
    ['cooked rice', 3, 'cup', ['rice']], ['egg', 2, 'item', ['tofu']], ['mixed vegetables', 2, 'cup', ['peas']], ['soy sauce', 2, 'tbsp', ['tamari']], ['vegetable oil', 1, 'tbsp', ['sesame oil']]
  ]),
  meal('starter-bean-tacos', 'Black bean tacos', 'A simple filling to fold into tortillas.', ['quick', 'plant-based'], [
    ['black beans', 1, 'can', ['kidney beans']], ['tortillas', 6, 'item', ['flatbread']], ['onion', 1, 'item', ['shallot']], ['lime', 1, 'item', ['lemon']], ['cheese', 1, 'cup', ['avocado']]
  ]),
  meal('starter-garlic-pasta', 'Garlic pantry pasta', 'A spare pasta route with plenty of room for greens.', ['quick', 'pantry'], [
    ['pasta', 250, 'g', ['noodles']], ['garlic', 4, 'clove', ['garlic powder']], ['olive oil', 3, 'tbsp', ['butter', 'vegetable oil']], ['chilli flakes', 1, 'tsp', ['black pepper']], ['parsley', 1, 'handful', ['spinach']]
  ]),
  meal('starter-potato-hash', 'Potato herb hash', 'Crisp potatoes with an egg or tofu on top.', ['skillet', 'flexible'], [
    ['potatoes', 4, 'item', ['sweet potatoes']], ['onion', 1, 'item', ['shallot']], ['egg', 2, 'item', ['tofu']], ['vegetable oil', 2, 'tbsp', ['olive oil']], ['fresh herbs', 1, 'handful', ['spring onion']]
  ]),
  meal('starter-chickpea-couscous', 'Lemony chickpea couscous', 'Warm or cold; use whichever tender herbs are around.', ['quick', 'plant-based'], [
    ['couscous', 1, 'cup', ['quinoa']], ['chickpeas', 1, 'can', ['white beans']], ['lemon', 1, 'item', ['lime']], ['olive oil', 2, 'tbsp', ['vegetable oil']], ['fresh herbs', 1, 'handful', ['spinach']]
  ]),
  meal('starter-tuna-rice', 'Tuna rice bowl', 'A fast bowl with a sharp, creamy dressing.', ['quick', 'bowl'], [
    ['cooked rice', 2, 'cup', ['couscous']], ['tuna', 1, 'can', ['chickpeas']], ['mayonnaise', 2, 'tbsp', ['yogurt']], ['cucumber', 1, 'item', ['carrot']], ['soy sauce', 1, 'tbsp', ['tamari']]
  ]),
  meal('starter-tomato-eggs', 'Tomato egg skillet', 'Eggs set into a warmly spiced tomato base.', ['skillet', 'vegetarian'], [
    ['tomatoes', 1, 'can', ['chopped tomatoes']], ['egg', 4, 'item', ['tofu']], ['onion', 1, 'item', ['shallot']], ['garlic', 2, 'clove', ['garlic powder']], ['paprika', 1, 'tsp', ['chilli powder']]
  ]),
  meal('starter-dal', 'Everyday yellow dal', 'A gentle lentil pot to pair with rice or flatbread.', ['one pot', 'plant-based'], [
    ['yellow lentils', 1, 'cup', ['red lentils']], ['onion', 1, 'item', ['shallot']], ['tomatoes', 2, 'item', ['tomatoes']], ['turmeric', 1, 'tsp', ['curry powder']], ['cooked rice', 2, 'cup', ['flatbread']]
  ]),
  meal('starter-quesadillas', 'Bean quesadillas', 'A crisp route for beans, cheese, and leftover vegetables.', ['quick', 'skillet'], [
    ['tortillas', 4, 'item', ['flatbread']], ['beans', 1, 'can', ['black beans']], ['cheese', 2, 'cup', ['vegan cheese']], ['mixed vegetables', 1, 'cup', ['corn']], ['salsa', 4, 'tbsp', ['tomatoes']]
  ]),
  meal('starter-bean-toast', 'Herby beans on toast', 'Creamy beans, brightened up, piled on toast.', ['quick', 'plant-based'], [
    ['white beans', 1, 'can', ['chickpeas']], ['bread', 4, 'slice', ['flatbread']], ['lemon', 1, 'item', ['vinegar']], ['olive oil', 2, 'tbsp', ['butter']], ['fresh herbs', 1, 'handful', ['spinach']]
  ]),
  meal('starter-peanut-noodles', 'Peanut noodles', 'A quick, savory sauce for noodles and crisp vegetables.', ['quick', 'bowl'], [
    ['noodles', 250, 'g', ['pasta']], ['peanut butter', 3, 'tbsp', ['tahini']], ['soy sauce', 2, 'tbsp', ['tamari']], ['lime', 1, 'item', ['lemon']], ['carrot', 1, 'item', ['cucumber']]
  ]),
  meal('starter-vegetable-soup', 'Clear-out vegetable soup', 'A forgiving pot for small amounts of several vegetables.', ['one pot', 'flexible'], [
    ['mixed vegetables', 4, 'cup', ['frozen vegetables']], ['vegetable stock', 4, 'cup', ['water']], ['onion', 1, 'item', ['leek']], ['beans', 1, 'can', ['lentils']], ['fresh herbs', 1, 'handful', ['dried herbs']]
  ]),
  meal('starter-baked-potatoes', 'Loaded baked potatoes', 'Use beans, yogurt, and any crunchy topping you have.', ['oven', 'flexible'], [
    ['potatoes', 4, 'item', ['sweet potatoes']], ['beans', 1, 'can', ['lentils']], ['cheese', 1, 'cup', ['yogurt']], ['spring onion', 1, 'handful', ['fresh herbs']], ['olive oil', 1, 'tbsp', ['vegetable oil']]
  ]),
  meal('starter-chickpea-salad', 'Crunchy chickpea salad', 'A sturdy no-cook bowl with a bright dressing.', ['no cook', 'plant-based'], [
    ['chickpeas', 1, 'can', ['white beans']], ['cucumber', 1, 'item', ['carrot']], ['tomatoes', 2, 'item', ['red pepper']], ['lemon', 1, 'item', ['vinegar']], ['olive oil', 2, 'tbsp', ['vegetable oil']]
  ]),
  meal('starter-omelette', 'Pantry omelette', 'A fold-over home for cheese, herbs, and leftover vegetables.', ['quick', 'skillet'], [
    ['egg', 4, 'item', ['tofu']], ['cheese', 1, 'cup', ['yogurt']], ['mixed vegetables', 1, 'cup', ['spinach']], ['butter', 1, 'tbsp', ['olive oil']], ['fresh herbs', 1, 'handful', ['spring onion']]
  ]),
  meal('starter-tomato-pasta', 'Tomato bean pasta', 'Pasta with a tomato sauce made more substantial by beans.', ['one pot', 'pantry'], [
    ['pasta', 250, 'g', ['noodles']], ['tomatoes', 1, 'can', ['chopped tomatoes']], ['white beans', 1, 'can', ['chickpeas']], ['garlic', 2, 'clove', ['garlic powder']], ['olive oil', 2, 'tbsp', ['vegetable oil']]
  ]),
  meal('starter-coconut-curry', 'Coconut vegetable curry', 'A mellow sauce for whichever vegetables need using.', ['one pot', 'plant-based'], [
    ['coconut milk', 1, 'can', ['tomatoes']], ['mixed vegetables', 3, 'cup', ['frozen vegetables']], ['chickpeas', 1, 'can', ['tofu']], ['curry powder', 2, 'tsp', ['curry paste']], ['cooked rice', 2, 'cup', ['flatbread']]
  ]),
  meal('starter-panzanella', 'Tomato bread salad', 'A useful destination for ripe tomatoes and day-old bread.', ['no cook', 'vegetarian'], [
    ['bread', 6, 'slice', ['flatbread']], ['tomatoes', 4, 'item', ['cherry tomatoes']], ['cucumber', 1, 'item', ['red pepper']], ['olive oil', 3, 'tbsp', ['vegetable oil']], ['vinegar', 1, 'tbsp', ['lemon']]
  ]),
  meal('starter-oats', 'Savory oat bowl', 'Oats cooked soft and topped like a grain bowl.', ['quick', 'bowl'], [
    ['oats', 1, 'cup', ['cooked rice']], ['egg', 2, 'item', ['tofu']], ['vegetable stock', 2, 'cup', ['water']], ['spinach', 1, 'handful', ['mixed vegetables']], ['soy sauce', 1, 'tbsp', ['salt']]
  ])
];

export function freshState(): AppState {
  return {
    pantry: [],
    meals: structuredClone(STARTER_MEALS),
    shopping: [],
    history: [],
    seeded: true,
    updatedAt: Date.now()
  };
}
