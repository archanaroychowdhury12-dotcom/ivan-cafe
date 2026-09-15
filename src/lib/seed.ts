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

export const seedCategories: Category[] = [
  { id: 'c-tea', name: 'Tea (চা)', emoji: '🍵', sort: 1 },
  { id: 'c-coffee', name: 'Coffee (কফি)', emoji: '☕', sort: 2 },
  { id: 'c-chicken-snacks', name: 'Chicken Snacks', emoji: '🍗', sort: 3 },
  { id: 'c-shawarma', name: 'Shawarma & Lolly Pop', emoji: '🌯', sort: 4 },
  { id: 'c-starters', name: 'Starters', emoji: '🔥', sort: 5 },
  { id: 'c-noodles', name: 'Noodles', emoji: '🍜', sort: 6 },
  { id: 'c-rice', name: 'Rice', emoji: '🍚', sort: 7 },
  { id: 'c-soups', name: 'Soups', emoji: '🥣', sort: 8 },
];

type Row = [string, string, string, number, string, string[], boolean, number, AddonGroup[], boolean?];

const rows: Row[] = [
  // TEA (চা)
  ['c-tea', 'Dudh Cha', 'Authentic Kolkata style milk tea brewed fresh with rich Assam tea leaves.', 10, '/menu/malai_cha_hd.jpg', ['Hot', 'Traditional'], true, 3, [SWEET], true],
  ['c-tea', 'Malai Cha', 'Rich and creamy special milk tea topped with luscious clotted malai cream.', 25, '/menu/malai_cha_hd.jpg', ['Bestseller', 'Creamy'], true, 4, [SWEET], true],
  ['c-tea', 'Big Malai Cha', 'Jumbo serving of our rich and velvety Malai Cha in a large cup.', 40, '/menu/malai_cha_hd.jpg', ['Large Cup', 'Creamy'], true, 4, [SWEET]],
  ['c-tea', 'Dudh Masala Cha', 'Milk tea infused with whole cardamom, clove, cinnamon, and fresh crushed ginger.', 15, '/menu/malai_cha_hd.jpg', ['Spiced', 'Aromatic'], true, 3, [SWEET]],
  ['c-tea', 'Lekar Cha', 'Refreshing black liquor tea brewed crisp, aromatic, and clean.', 10, '/menu/malai_cha_hd.jpg', ['Black Tea', 'Classic'], true, 3, [SWEET]],
  ['c-tea', 'Lekar Masala Cha', 'Spiced black liquor tea infused with ginger, black pepper, and herbs.', 10, '/menu/malai_cha_hd.jpg', ['Herbal Spiced', 'Digestive'], true, 3, [SWEET]],
  ['c-tea', 'Lemon Tea', 'Invigorating black liquor tea with hand-squeezed fresh lemon and black salt.', 10, '/menu/peachtea.jpg', ['Citrus', 'Refreshing'], true, 3, [SWEET]],

  // COFFEE (কফি)
  ['c-coffee', 'Small Hot Coffee', 'Steaming whipped hot coffee brewed fresh with rich creamy milk.', 15, '/menu/hot_coffee.jpg', ['Hot', 'Classic'], true, 4, [SWEET]],
  ['c-coffee', 'Big Hot Coffee', 'Large mug of aromatic whipped hot coffee with velvety foam.', 40, '/menu/hot_coffee.jpg', ['Hot', 'Large'], true, 4, [SWEET]],
  ['c-coffee', 'Black Coffee', 'Bold, pure black coffee brewed strong without milk.', 15, '/menu/espresso.jpg', ['Bold', 'Zero Milk'], true, 3, [SWEET]],
  ['c-coffee', 'Cold Coffee', 'Chilled thick blended coffee with creamy milk and rich roasted coffee notes.', 40, '/menu/cold_coffee_special.jpg', ['Chilled', 'Refreshing'], true, 5, [SWEET, COFFEE_EXTRA], true],
  ['c-coffee', 'Big Cold Coffee', 'Jumbo tall glass of chilled thick blended cold coffee.', 80, '/menu/cold_coffee_special.jpg', ['Large Glass', 'Chilled'], true, 5, [SWEET, COFFEE_EXTRA]],
  ['c-coffee', 'Banana Milk with Cold Coffee', 'Healthy and energizing fusion of fresh ripe banana, chilled milk, and cold coffee.', 80, '/menu/mango.jpg', ['Chef Special', 'Fruity'], true, 6, [SWEET]],
  ['c-coffee', 'Cold Coffee with Ice Cream', 'Creamy cold coffee topped with a thick scoop of vanilla ice cream and chocolate drizzle.', 50, '/menu/cold_coffee_special.jpg', ['Bestseller', 'Dessert Coffee'], true, 5, [SWEET, COFFEE_EXTRA], true],
  ['c-coffee', 'Special Cold Coffee with Ice Cream', 'Signature rich thick cold coffee loaded with extra ice cream, crushed chocolate & fudge.', 100, '/menu/cold_coffee_special.jpg', ['Signature', 'Indulgent'], true, 6, [SWEET, COFFEE_EXTRA], true],
  ['c-coffee', 'Big Cold Coffee Special with Ice Cream', 'Giant supreme glass loaded with double ice cream scoops, chocolate syrup and roasted nuts.', 150, '/menu/cold_coffee_special.jpg', ['Giant Supreme', 'Party Size'], true, 7, [SWEET, COFFEE_EXTRA]],

  // CHICKEN SNACKS (চিকেন স্ন্যাক্স)
  ['c-chicken-snacks', 'Chicken Snacki Ball (per plate)', 'Crispy golden crumb-coated savory chicken balls served with house dip.', 50, '/menu/chicken_popcorn_hd.jpg', ['Crispy', 'Snack'], false, 8, [SNACK_DIP], true],
  ['c-chicken-snacks', 'Chicken Butter Fry Snacki (per pcs)', 'Tender chicken piece batter-fried in rich butter marinade, crispy outside and juicy inside.', 20, '/menu/chicken_butter_fry_hd.jpg', ['Butter Fry', 'Crunchy'], false, 6, [SNACK_DIP], true],
  ['c-chicken-snacks', 'Chicken Crispy Mini Popcon (per plate)', 'Bite-sized crunchy fried chicken popcorn tossed in secret Ivan spice seasoning.', 100, '/menu/chicken_popcorn_hd.jpg', ['Bestseller', 'Popcorn'], false, 8, [SNACK_DIP], true],
  ['c-chicken-snacks', 'Chicken French Fry (per plate)', 'Crispy golden french fries loaded with shredded spiced chicken and creamy house sauces.', 150, '/menu/fries.jpg', ['Loaded', 'Fries'], false, 10, [SNACK_DIP]],
  ['c-chicken-snacks', 'Chicken Crispy Pokora (per plate)', 'Classic spiced Kolkata-style crispy chicken pakoras served with green chutney & onion salad.', 100, '/menu/chicken_butter_fry_hd.jpg', ['Hot & Crispy', 'Desi'], false, 8, [SNACK_DIP]],

  // SHAWARMA & EGG LOLLY POP
  ['c-shawarma', 'Chicken Special Shawarma Roll', 'Rumali wrap stuffed generously with slow-roasted spiced chicken, garlic mayo, pickles & extra cheese.', 100, '/menu/shawarma_roll_hd.jpg', ['Chef Special', 'Bestseller'], false, 7, [SHAWARMA_EXTRA], true],
  ['c-shawarma', 'Chicken Shawarma Roll', 'Classic roasted chicken flakes wrapped with authentic garlic tahini sauce and crunchy cabbage.', 80, '/menu/shawarma_roll_hd.jpg', ['Classic', 'Juicy'], false, 6, [SHAWARMA_EXTRA]],
  ['c-shawarma', 'Egg Lolly Pop', 'Seasoned boiled egg dipped in spiced batter and deep-fried on wooden skewers.', 30, '/menu/egg_lolly_hd.jpg', ['Egg Snack', 'Crispy'], false, 6, []],
  ['c-shawarma', 'Chicken Egg Lolly Pop', 'Juicy minced chicken wrapped around egg on skewers, deep-fried to golden perfection.', 50, '/menu/egg_lolly_hd.jpg', ['Special', 'Filling'], false, 8, [], true],
  ['c-shawarma', 'Bread Egg Lolly Pop', 'Spiced egg and potato mix rolled in toasted bread skewer with crunchy golden crust.', 40, '/menu/egg_lolly_hd.jpg', ['Toasted', 'Crispy'], false, 6, []],

  // STARTERS (স্টারটার্স)
  ['c-starters', 'Chicken Pepper Dry', 'Wok-seared boneless chicken chunks tossed with freshly crushed black peppercorns and curry leaves.', 130, '/menu/chilli_chicken_hd.jpg', ['Peppery', 'Spicy'], false, 12, [SPICE], true],
  ['c-starters', 'Dry Chilli Chicken', 'Kolkata Chinatown style crispy fried chicken cubes tossed in hot green chilies, onions & dark soy glaze.', 140, '/menu/chilli_chicken_hd.jpg', ['Bestseller', 'Chilli Hit'], false, 12, [SPICE], true],
  ['c-starters', 'Chicken Lemon Coriander', 'Tender sautéed chicken cubes infused with fresh lime juice, crushed white pepper and coriander glaze.', 150, '/menu/chilli_chicken_hd.jpg', ['Zesty', 'Herbaceous'], false, 12, [SPICE]],
  ['c-starters', 'Veg Manchurian Dry', 'Crispy vegetable dumplings tossed in tangy Manchurian sauce with minced garlic, ginger & scallions.', 60, '/menu/veg_manchurian_hd.jpg', ['Crispy Veg', 'Tangy'], true, 10, [SPICE]],
  ['c-starters', 'Veg Manchurian Semi Gravy', 'Golden fried vegetable balls simmered in a savory ginger-garlic and dark soy semi-gravy.', 80, '/menu/veg_manchurian_hd.jpg', ['Semi Gravy', 'Indo-Chinese'], true, 10, [SPICE]],
  ['c-starters', 'Chinese Sizzler', 'Sizzling hot cast iron platter loaded with noodles, manchurian, crispy bites & stir-fry greens.', 200, '/menu/chinese_sizzler_hd.jpg', ['Sizzling Platter', 'Chef Special'], false, 15, [SPICE], true],
  ['c-starters', 'Chicken 65', 'Spicy deep-fried diced chicken bites tempered with aromatic curry leaves and red chilies.', 150, '/menu/chilli_chicken_hd.jpg', ['Crispy', 'Tempered'], false, 12, [SPICE]],

  // NOODLES (নুডুলস)
  ['c-noodles', 'Veg Hakka Noodles', 'Wok-tossed noodles with shredded cabbage, carrots, bell peppers, scallions, and light soy seasoning.', 80, '/menu/hakka_noodles_hd.jpg', ['Wok Fresh', 'Classic'], true, 10, [SPICE], true],
  ['c-noodles', 'Chicken Schezwan Noodles', 'Fiery wok noodles tossed with tender shredded chicken, authentic Sichuan chili oil & spring onions.', 130, '/menu/schezwan_noodles_hd.jpg', ['Fiery', 'Spicy'], false, 12, [SPICE], true],
  ['c-noodles', 'Chicken Malaysia Noodles', 'Aromatic Malaysian style spiced noodles tossed with juicy chicken cubes and crunchy vegetables.', 150, '/menu/hakka_noodles_hd.jpg', ['Chef Special', 'Aromatic'], false, 12, [SPICE]],

  // RICE (রাইস)
  ['c-rice', 'Veg Fried Rice', 'Fragrant long-grain basmati rice wok-tossed with finely chopped garden vegetables and white pepper.', 90, '/menu/burnt_garlic_rice_hd.jpg', ['Classic', 'Basmati'], true, 10, [SPICE], true],
  ['c-rice', 'Chicken Burnt Garlic Rice', 'Wok-fried aromatic rice infused with golden crisp roasted garlic chips, tender chicken and scallions.', 130, '/menu/burnt_garlic_rice_hd.jpg', ['Garlic Aroma', 'Bestseller'], false, 12, [SPICE], true],
  ['c-rice', 'Chicken Schezwan Rice', 'Spicy and tangy fried rice tossed with tender chicken pieces, homemade schezwan chili sauce & greens.', 150, '/menu/burnt_garlic_rice_hd.jpg', ['Spicy', 'Wok Tossed'], false, 12, [SPICE], true],

  // SOUPS (সুপ)
  ['c-soups', 'Tom Yum Soup', 'Authentic Thai hot & sour soup with lemongrass, galangal, fresh herbs, and zesty lime.', 60, '/menu/manchow_soup_hd.jpg', ['Spicy & Tangy', 'Thai'], true, 8, [SPICE], true],
  ['c-soups', 'Lemon Coriander Soup', 'Clear vegetable broth with zesty fresh lemon, crushed peppercorns, and freshly chopped coriander leaves.', 50, '/menu/manchow_soup_hd.jpg', ['Healthy', 'Citrus'], true, 7, [SPICE]],
  ['c-soups', 'Manchow Soup & Time Pass Noodles', 'Indo-Chinese dark spicy garlic soup served with a generous bowl of crispy fried crunchy noodles.', 60, '/menu/manchow_soup_hd.jpg', ['Indo-Chinese', 'Crispy Noodles'], true, 8, [SPICE], true],
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

export const seedTables: CafeTable[] = [
  { id: 't1', code: 'T01', label: 'Window Two-Top', seats: 2, zone: 'Window', active: true },
  { id: 't2', code: 'T02', label: 'Window Two-Top', seats: 2, zone: 'Window', active: true },
  { id: 't3', code: 'T03', label: 'Courtyard Four', seats: 4, zone: 'Courtyard', active: true },
  { id: 't4', code: 'T04', label: 'Courtyard Four', seats: 4, zone: 'Courtyard', active: true },
  { id: 't5', code: 'T05', label: 'Communal Bench', seats: 8, zone: 'Main Hall', active: true },
  { id: 't6', code: 'T06', label: 'Corner Booth', seats: 6, zone: 'Main Hall', active: true },
  { id: 't7', code: 'T07', label: 'Barista Counter', seats: 3, zone: 'Counter', active: true },
  { id: 't8', code: 'T08', label: 'Terrace Lounge', seats: 5, zone: 'Terrace', active: true },
];

export function seedDB(): DB {
  return {
    version: 7,
    settings: {
      cafeName: 'Ivan Food Court',
      tagline: 'GOOD FOOD · GOOD MOOD',
      currency: '₹',
      taxPercent: 5,
      servicePercent: 5,
      serviceEnabled: true,
      acceptingOrders: true,
      address: 'Ivan Food Court, Main Road',
      hours: '09:00 — 23:00 · Every day',
      adminUser: 'admin',
      adminPassHash: DEFAULT_PASS_HASH,
    },
    categories: seedCategories,
    items: seedItems,
    tables: seedTables,
    orders: [],
    calls: [],
  };
}
