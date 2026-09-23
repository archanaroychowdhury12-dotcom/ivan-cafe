import type { AddonGroup, CafeTable, Category, DB, MenuItem } from './types';

// Default admin credentials -> user: admin / pass: ivan2026
// (sha256 of "ivan2026"); changeable from Admin › Settings.
export const DEFAULT_PASS_HASH = 'b42e412a45e9eaed0a74f8bb5ecd8990d19324bd1f60f3378b41899bc9dee8dc';

const g = (
  id: string,
  name: string,
  type: 'single' | 'multi',
  options: [string, number][],
  required = false,
): AddonGroup => ({
  id,
  name,
  type,
  required,
  options: options.map(([n, p], i) => ({ id: `${id}-${i}`, name: n, price: p })),
});

const SWEET = g('sweet', 'Sweetness (মিষ্টির পরিমাণ)', 'single', [
  ['Regular (স্বাভাবিক)', 0],
  ['Less sweet (কম মিষ্টি)', 0],
  ['Extra sweet (বেশি মিষ্টি)', 0],
], true);

const SPICE = g('spice', 'Spice level (ঝাল)', 'single', [
  ['Medium (মাঝারি)', 0],
  ['Mild (কম ঝাল)', 0],
  ['Fiery Hot (বেশি ঝাল)', 0],
], true);

const SHAWARMA_EXTRA = g('shawarma-addons', 'Add-ons', 'multi', [
  ['Extra Mayo', 10],
  ['Extra Cheese', 20],
]);

const COFFEE_EXTRA = g('coffee-addons', 'Add-ons', 'multi', [
  ['Vanilla Ice Cream Scoop', 30],
  ['Chocolate Drizzle', 15],
]);

const SNACK_DIP = g('snack-dips', 'Extras', 'multi', [
  ['Extra Tangy Dip / Chutney', 10],
  ['Extra Garlic Mayonnaise', 15],
]);

const LASSI_EXTRA = g('lassi-addons', 'Add-ons', 'multi', [
  ['Extra Dry Fruits & Pistachios', 15],
  ['Extra Malai Cream', 10],
]);

const DRINK_ICE = g('drink-ice', 'Ice Preference', 'single', [
  ['Normal Ice', 0],
  ['Less Ice', 0],
  ['No Ice', 0],
], true);

export const seedCategories: Category[] = [
  { id: 'c-tea', name: 'Tea', emoji: '☕', sort: 1 },
  { id: 'c-coffee', name: 'Coffee', emoji: '☕', sort: 2 },
  { id: 'c-starters', name: 'Starters', emoji: '🍗', sort: 3 },
  { id: 'c-rice', name: 'Rice', emoji: '🍚', sort: 4 },
  { id: 'c-soups', name: 'Soups', emoji: '🍲', sort: 5 },
  { id: 'c-noodles', name: 'Noodles', emoji: '🍜', sort: 6 },
  { id: 'c-chicken-snacks', name: 'Chicken Snacks', emoji: '🍗', sort: 7 },
  { id: 'c-lassi', name: 'Lassi', emoji: '🥤', sort: 8 },
  { id: 'c-mocktails', name: 'Mocktails', emoji: '🍹', sort: 9 },
  { id: 'c-shawarma', name: 'Shawarma', emoji: '🌯', sort: 10 },
  { id: 'c-egg-lolly', name: 'Egg Lolly Pop', emoji: '🍳', sort: 11 },
];

type Row = [string, string, string, number, string, string[], boolean, number, AddonGroup[], boolean?];

const rows: Row[] = [
  // 1. TEA (চা) - 7 items
  ['c-tea', 'Dudh Cha', 'Authentic Kolkata style milk tea brewed fresh with rich Assam tea leaves.', 10, '/menu/malai_cha_hd.jpg', ['Hot', 'Traditional'], true, 3, [SWEET], true],
  ['c-tea', 'Malai Cha', 'Rich and creamy special milk tea topped with luscious clotted malai cream.', 25, '/menu/malai_cha_hd.jpg', ['Bestseller', 'Creamy'], true, 4, [SWEET], true],
  ['c-tea', 'Big Malai Cha', 'Jumbo serving of our rich and velvety Malai Cha in a large cup.', 40, '/menu/malai_cha_hd.jpg', ['Large Cup', 'Creamy'], true, 4, [SWEET]],
  ['c-tea', 'Dudh Masala Cha', 'Milk tea infused with whole cardamom, clove, cinnamon, and fresh crushed ginger.', 15, '/menu/malai_cha_hd.jpg', ['Spiced', 'Aromatic'], true, 3, [SWEET]],
  ['c-tea', 'Lekar Cha', 'Refreshing black liquor tea brewed crisp, aromatic, and clean.', 10, '/menu/malai_cha_hd.jpg', ['Black Tea', 'Classic'], true, 3, [SWEET]],
  ['c-tea', 'Lekar Masala Cha', 'Spiced black liquor tea infused with ginger, black pepper, and herbs.', 10, '/menu/malai_cha_hd.jpg', ['Herbal Spiced', 'Digestive'], true, 3, [SWEET]],
  ['c-tea', 'Lemon Tea', 'Invigorating black liquor tea with hand-squeezed fresh lemon and black salt.', 10, '/menu/peachtea.jpg', ['Citrus', 'Refreshing'], true, 3, [SWEET]],

  // 2. COFFEE (কফি) - 9 items
  ['c-coffee', 'Small Hot Coffee', 'Steaming whipped hot coffee brewed fresh with rich creamy milk.', 15, '/menu/hot_coffee.jpg', ['Hot', 'Classic'], true, 4, [SWEET]],
  ['c-coffee', 'Big Hot Coffee', 'Large mug of aromatic whipped hot coffee with velvety foam.', 40, '/menu/hot_coffee.jpg', ['Hot', 'Large'], true, 4, [SWEET]],
  ['c-coffee', 'Black Coffee', 'Bold, pure black coffee brewed strong without milk.', 15, '/menu/espresso.jpg', ['Bold', 'Zero Milk'], true, 3, [SWEET]],
  ['c-coffee', 'Cold Coffee', 'Chilled thick blended coffee with creamy milk and rich roasted coffee notes.', 40, '/menu/cold_coffee_special.jpg', ['Chilled', 'Refreshing'], true, 5, [SWEET, COFFEE_EXTRA], true],
  ['c-coffee', 'Big Cold Coffee', 'Jumbo tall glass of chilled thick blended cold coffee.', 80, '/menu/cold_coffee_special.jpg', ['Large Glass', 'Chilled'], true, 5, [SWEET, COFFEE_EXTRA]],
  ['c-coffee', 'Banana Milk with Cold Coffee', 'Healthy and energizing fusion of fresh ripe banana, chilled milk, and cold coffee.', 80, '/menu/mango.jpg', ['Chef Special', 'Fruity'], true, 6, [SWEET]],
  ['c-coffee', 'Cold Coffee with Ice Cream', 'Creamy cold coffee topped with a thick scoop of vanilla ice cream and chocolate drizzle.', 50, '/menu/cold_coffee_special.jpg', ['Bestseller', 'Dessert Coffee'], true, 5, [SWEET, COFFEE_EXTRA], true],
  ['c-coffee', 'Special Cold Coffee with Ice Cream', 'Signature rich thick cold coffee loaded with extra ice cream, crushed chocolate & fudge.', 100, '/menu/cold_coffee_special.jpg', ['Signature', 'Indulgent'], true, 6, [SWEET, COFFEE_EXTRA], true],
  ['c-coffee', 'Big Cold Coffee Special with Ice Cream', 'Giant supreme glass loaded with double ice cream scoops, chocolate syrup and roasted nuts.', 150, '/menu/cold_coffee_special.jpg', ['Giant Supreme', 'Party Size'], true, 7, [SWEET, COFFEE_EXTRA]],

  // 3. STARTERS (স্টারটার্স) - 7 items
  ['c-starters', 'Chicken Pepper Dry', 'Wok-seared boneless chicken chunks tossed with freshly crushed black peppercorns and curry leaves.', 130, '/menu/chilli_chicken_hd.jpg', ['Peppery', 'Spicy'], false, 12, [SPICE], true],
  ['c-starters', 'Dry Chilli Chicken', 'Kolkata Chinatown style crispy fried chicken cubes tossed in hot green chilies, onions & dark soy glaze.', 140, '/menu/chilli_chicken_hd.jpg', ['Bestseller', 'Chilli Hit'], false, 12, [SPICE], true],
  ['c-starters', 'Chicken Lemon Coriander', 'Tender sautéed chicken cubes infused with fresh lime juice, crushed white pepper and coriander glaze.', 150, '/menu/chilli_chicken_hd.jpg', ['Zesty', 'Herbaceous'], false, 12, [SPICE]],
  ['c-starters', 'Veg Manchurian Dry', 'Crispy vegetable dumplings tossed in tangy Manchurian sauce with minced garlic, ginger & scallions.', 60, '/menu/veg_manchurian_hd.jpg', ['Crispy Veg', 'Tangy'], true, 10, [SPICE]],
  ['c-starters', 'Veg Manchurian Semi Gravy', 'Golden fried vegetable balls simmered in a savory ginger-garlic and dark soy semi-gravy.', 80, '/menu/veg_manchurian_hd.jpg', ['Semi Gravy', 'Indo-Chinese'], true, 10, [SPICE]],
  ['c-starters', 'Chinese Sizzler', 'Sizzling hot cast iron platter loaded with noodles, manchurian, crispy bites & stir-fry greens.', 200, '/menu/chinese_sizzler_hd.jpg', ['Sizzling Platter', 'Chef Special'], false, 15, [SPICE], true],
  ['c-starters', 'Chicken 65', 'Spicy deep-fried diced chicken bites tempered with aromatic curry leaves and red chilies.', 150, '/menu/chilli_chicken_hd.jpg', ['Crispy', 'Tempered'], false, 12, [SPICE]],

  // 4. RICE (রাইস) - 3 items
  ['c-rice', 'Veg Fried Rice', 'Fragrant long-grain basmati rice wok-tossed with finely chopped garden vegetables and white pepper.', 90, '/menu/burnt_garlic_rice_hd.jpg', ['Classic', 'Basmati'], true, 10, [SPICE], true],
  ['c-rice', 'Chicken Butter Garlic Rice', 'Wok-fried aromatic rice infused with golden crisp butter garlic chips, tender chicken and scallions.', 130, '/menu/burnt_garlic_rice_hd.jpg', ['Butter Garlic', 'Bestseller'], false, 12, [SPICE], true],
  ['c-rice', 'Chicken Schezwan Rice', 'Spicy and tangy fried rice tossed with tender chicken pieces, homemade schezwan chili sauce & greens.', 150, '/menu/burnt_garlic_rice_hd.jpg', ['Spicy', 'Wok Tossed'], false, 12, [SPICE], true],

  // 5. SOUPS (সুপ) - 3 items
  ['c-soups', 'Tom Yum Soup', 'Authentic Thai hot & sour soup with lemongrass, galangal, fresh herbs, and zesty lime.', 60, '/menu/manchow_soup_hd.jpg', ['Spicy & Tangy', 'Thai'], true, 8, [SPICE], true],
  ['c-soups', 'Lemon Coriander Soup', 'Clear vegetable broth with zesty fresh lemon, crushed peppercorns, and freshly chopped coriander leaves.', 50, '/menu/manchow_soup_hd.jpg', ['Healthy', 'Citrus'], true, 7, [SPICE]],
  ['c-soups', 'Manchow Soup & Lime Class Noodles', 'Indo-Chinese dark spicy garlic soup served with a generous bowl of crispy fried crunchy noodles.', 60, '/menu/manchow_soup_hd.jpg', ['Indo-Chinese', 'Crispy Noodles'], true, 8, [SPICE], true],

  // 6. NOODLES (নুডুলস) - 3 items
  ['c-noodles', 'Veg Hakka Noodles', 'Wok-tossed noodles with shredded cabbage, carrots, bell peppers, scallions, and light soy seasoning.', 80, '/menu/hakka_noodles_hd.jpg', ['Wok Fresh', 'Classic'], true, 10, [SPICE], true],
  ['c-noodles', 'Chicken Schezwan Noodles', 'Fiery wok noodles tossed with tender shredded chicken, authentic Sichuan chili oil & spring onions.', 130, '/menu/schezwan_noodles_hd.jpg', ['Fiery', 'Spicy'], false, 12, [SPICE], true],
  ['c-noodles', 'Chicken Malaysia Noodles', 'Aromatic Malaysian style spiced noodles tossed with juicy chicken cubes and crunchy vegetables.', 150, '/menu/hakka_noodles_hd.jpg', ['Chef Special', 'Aromatic'], false, 12, [SPICE]],

  // 7. CHICKEN SNACKS (চিকেন স্ন্যাক্স) - 5 items
  ['c-chicken-snacks', 'Chicken Snacki Ball (per plate)', 'Crispy golden crumb-coated savory chicken balls served with house dip.', 50, '/menu/chicken_popcorn_hd.jpg', ['Crispy', 'Snack'], false, 8, [SNACK_DIP], true],
  ['c-chicken-snacks', 'Chicken Butter Fry Snacki (per pcs)', 'Tender chicken piece batter-fried in rich butter marinade, crispy outside and juicy inside.', 20, '/menu/chicken_butter_fry_hd.jpg', ['Butter Fry', 'Crunchy'], false, 6, [SNACK_DIP], true],
  ['c-chicken-snacks', 'Chicken Crispy Mini Popcorn (per plate)', 'Bite-sized crunchy fried chicken popcorn tossed in secret Ivan spice seasoning.', 100, '/menu/chicken_popcorn_hd.jpg', ['Bestseller', 'Popcorn'], false, 8, [SNACK_DIP], true],
  ['c-chicken-snacks', 'Chicken French Fry (per plate)', 'Crispy golden french fries loaded with shredded spiced chicken and creamy house sauces.', 150, '/menu/fries.jpg', ['Loaded', 'Fries'], false, 10, [SNACK_DIP]],
  ['c-chicken-snacks', 'Chicken Crispy Pokora (per plate)', 'Classic spiced Kolkata-style crispy chicken pakoras served with green chutney & onion salad.', 100, '/menu/chicken_butter_fry_hd.jpg', ['Hot & Crispy', 'Desi'], false, 8, [SNACK_DIP]],

  // 8. LASSI (লাচ্ছি) - 3 items
  ['c-lassi', 'Blue Curacao Lassi', 'Exotic creamy yogurt lassi infused with vibrant blue curacao syrup, dry fruits & nuts.', 50, '/menu/blue_curacao_lassi_hd.jpg', ['Exotic', 'Signature'], true, 5, [LASSI_EXTRA], true],
  ['c-lassi', 'Dry Fruit Lassi', 'Traditional rich thick sweet lassi loaded with crushed almonds, pistachios & saffron.', 30, '/menu/dry_fruit_lassi_hd.jpg', ['Rich & Creamy', 'Nutty'], true, 5, [LASSI_EXTRA], true],
  ['c-lassi', 'Banana Dry Fruit Lassi', 'Healthy blend of fresh ripe bananas and thick curd topped with generous roasted nuts.', 50, '/menu/dry_fruit_lassi_hd.jpg', ['Healthy', 'Filling'], true, 6, [LASSI_EXTRA]],

  // 9. MOCKTAILS (মকটেল) - 6 items
  ['c-mocktails', 'Fresh Lemon Soda', 'Bubbly chilled soda with freshly squeezed lime, rock salt and mint.', 30, '/menu/limesoda.jpg', ['Refreshing', 'Digestive'], true, 4, [DRINK_ICE], true],
  ['c-mocktails', 'Nimbu Mint', 'Cooling crushed mint leaves and lime cooler with sparkling soda.', 40, '/menu/limesoda.jpg', ['Cooler', 'Minty'], true, 4, [DRINK_ICE]],
  ['c-mocktails', 'Cokra Return', 'Spiced tangy cola mocktail with black salt, cumin, and fresh lemon twist.', 40, '/menu/tropical_mocktail_hd.jpg', ['Desi Fizz', 'Spicy Twist'], true, 4, [DRINK_ICE]],
  ['c-mocktails', 'Dabang Pineapple', 'Juicy pineapple cooler with a fiery dash of masala and citrus foam.', 50, '/menu/tropical_mocktail_hd.jpg', ['Tropical', 'Tangy'], true, 5, [DRINK_ICE], true],
  ['c-mocktails', 'Mango with Blue Curacao', 'Stunning layered cocktail-style mocktail with sweet mango puree and vibrant blue syrup.', 80, '/menu/tropical_mocktail_hd.jpg', ['Layered', 'Bestseller'], true, 5, [DRINK_ICE], true],
  ['c-mocktails', 'Three Mixed Mocktails', 'Chef signature triple fruit fiesta with citrus, berry, and tropical passion fruit sparkle.', 80, '/menu/tropical_mocktail_hd.jpg', ['Signature', 'Triple Blend'], true, 6, [DRINK_ICE], true],

  // 10. SHAWARMA (শাওয়ার্মা) - 2 items
  ['c-shawarma', 'Chicken Special Shawarma Roll', 'Rumali wrap stuffed generously with slow-roasted spiced chicken, garlic mayo, pickles & extra cheese.', 100, '/menu/shawarma_roll_hd.jpg', ['Chef Special', 'Bestseller'], false, 7, [SHAWARMA_EXTRA], true],
  ['c-shawarma', 'Chicken Shawarma Roll', 'Classic roasted chicken flakes wrapped with authentic garlic tahini sauce and crunchy cabbage.', 80, '/menu/shawarma_roll_hd.jpg', ['Classic', 'Juicy'], false, 6, [SHAWARMA_EXTRA]],

  // 11. EGG LOLLY POP (এগ ললিপপ) - 3 items
  ['c-egg-lolly', 'Egg Lolly Pop', 'Seasoned boiled egg dipped in spiced batter and deep-fried on wooden skewers.', 30, '/menu/egg_lolly_hd.jpg', ['Egg Snack', 'Crispy'], false, 6, []],
  ['c-egg-lolly', 'Chicken Egg Lolly Pop', 'Juicy minced chicken wrapped around egg on skewers, deep-fried to golden perfection.', 50, '/menu/egg_lolly_hd.jpg', ['Special', 'Filling'], false, 8, [], true],
  ['c-egg-lolly', 'Bread Egg Lolly Pop', 'Spiced egg and potato mix rolled in toasted bread skewer with crunchy golden crust.', 40, '/menu/egg_lolly_hd.jpg', ['Toasted', 'Crispy'], false, 6, []],
];

export const seedItems: MenuItem[] = rows.map((r, i) => ({
  id: `m-${i + 1}`,
  categoryId: r[0],
  name: r[1],
  description: r[2],
  price: r[3],
  image: r[4],
  tags: r[5],
  veg: r[6],
  prepMins: r[7],
  addonGroups: r[8],
  popular: r[9] ?? false,
  soldOut: false,
  createdAt: Date.now() - (rows.length - i) * 60000,
}));

// Exactly 6 tables as requested
export const seedTables: CafeTable[] = [
  { id: 't1', code: 'T01', label: 'Table 01', seats: 2, zone: 'Window', active: true },
  { id: 't2', code: 'T02', label: 'Table 02', seats: 2, zone: 'Window', active: true },
  { id: 't3', code: 'T03', label: 'Table 03', seats: 4, zone: 'Main Hall', active: true },
  { id: 't4', code: 'T04', label: 'Table 04', seats: 4, zone: 'Main Hall', active: true },
  { id: 't5', code: 'T05', label: 'Table 05', seats: 4, zone: 'Main Hall', active: true },
  { id: 't6', code: 'T06', label: 'Table 06', seats: 6, zone: 'Family Booth', active: true },
];

export function seedDB(): DB {
  return {
    version: 10,
    settings: {
      cafeName: 'Ivan Food Court',
      tagline: 'GOOD FOOD · GOOD MOOD',
      currency: '₹',
      taxPercent: 0,
      taxEnabled: false,
      servicePercent: 0,
      serviceEnabled: false,
      acceptingOrders: true,
      address: 'Ivan Food Court, Main Road',
      hours: '09:00 — 23:00 · Every day',
      adminUser: 'admin',
      adminPass: 'ivan2026',
      adminPassHash: DEFAULT_PASS_HASH,
      customDomain: 'https://ivan-caffe.vercel.app',
    },
    categories: seedCategories,
    items: seedItems,
    tables: seedTables,
    orders: [],
    calls: [],
  };
}
