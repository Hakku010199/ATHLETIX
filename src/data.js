export const CATEGORIES = [
  { slug: 'football', name: 'Football', emoji: '⚽', a: '#0f5132', b: '#198754' },
  { slug: 'cricket', name: 'Cricket', emoji: '🏏', a: '#7a1f1f', b: '#c0392b' },
  { slug: 'running', name: 'Running', emoji: '👟', a: '#12324d', b: '#2a7ab0' },
  { slug: 'gym-fitness', name: 'Gym & Fitness', emoji: '🏋️', a: '#2b2b3d', b: '#5a5a8a' },
  { slug: 'basketball', name: 'Basketball', emoji: '🏀', a: '#8a3b0c', b: '#e67e22' },
  { slug: 'badminton', name: 'Badminton', emoji: '🏸', a: '#4a2a7a', b: '#8e5bd0' },
  { slug: 'cycling', name: 'Cycling', emoji: '🚴', a: '#0b4f4a', b: '#1abc9c' },
  { slug: 'swimming', name: 'Swimming', emoji: '🏊', a: '#0a3d6b', b: '#3498db' },
];
export const catBySlug = (s) => CATEGORIES.find((c) => c.slug === s || (s && c.slug === s.replace(/^demo-/, '')) || (s && c.name.toLowerCase() === s.toLowerCase()));
export const catByName = (n) => CATEGORIES.find((c) => n && c.name.toLowerCase() === n.toLowerCase());

// Self-contained generated artwork (no external image links to break). Replace with real photos via product.images.
export const art = (emoji, a, b, rot = 0) =>
  'data:image/svg+xml;utf8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><defs><linearGradient id="g" gradientTransform="rotate(${rot} .5 .5)"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="400" height="400" fill="url(#g)"/><circle cx="320" cy="80" r="120" fill="#C8F31D" opacity=".18"/><circle cx="60" cy="360" r="90" fill="#fff" opacity=".07"/><text x="200" y="250" font-size="150" text-anchor="middle">${emoji}</text></svg>`);

const RAW = [
  ['Nike Football Match Ball', 'Football', 'Nike', 2499, 2999, 4.6, 312, 24, 'Best Seller', null],
  ['Professional Cricket Bat', 'Cricket', 'SG', 4999, 5999, 4.7, 188, 12, 'Best Seller', null],
  ['Performance Running Shoes', 'Running', 'Nike', 3499, 4499, 4.5, 421, 30, 'New Arrival', ['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10']],
  ['Adjustable Dumbbell Set', 'Gym & Fitness', 'Decathlon', 2999, 3499, 4.4, 267, 18, 'Best Seller', null, '🏋️'],
  ['Premium Basketball', 'Basketball', 'Spalding', 1799, 1799, 4.6, 154, 40, null, null],
  ['Badminton Racket', 'Badminton', 'Yonex', 2199, 2599, 4.8, 233, 15, 'Best Seller', null],
  ['Resistance Band Set', 'Gym & Fitness', 'Decathlon', 799, 999, 4.3, 512, 60, 'Best Seller', null, '🎽'],
  ['Sports Training Gloves', 'Gym & Fitness', 'Adidas', 999, 999, 4.2, 98, 25, null, ['S', 'M', 'L'], '🧤'],
  ['Road Cycling Helmet', 'Cycling', 'Decathlon', 2799, 3299, 4.5, 76, 10, 'New Arrival', ['M', 'L'], '⛑️'],
  ['Racing Swim Goggles', 'Swimming', 'Speedo', 899, 1099, 4.4, 140, 35, null, null, '🥽'],
  ['Trail Running Jacket', 'Running', 'Adidas', 3999, 5499, 4.3, 64, 8, 'New Arrival', ['S', 'M', 'L', 'XL'], '🧥'],
  ['Yoga Mat Pro', 'Gym & Fitness', 'Decathlon', 1299, 1599, 4.6, 330, 50, null, null, '🧘'],
  ['Cricket Batting Pads', 'Cricket', 'SG', 2299, 2799, 4.2, 90, 0, null, ['Youth', 'Men']],
  ['Pro Football Boots', 'Football', 'Adidas', 4299, 5299, 4.5, 205, 14, 'New Arrival', ['UK 7', 'UK 8', 'UK 9', 'UK 10'], '👟'],
  ['Shuttlecock Pack (12)', 'Badminton', 'Yonex', 1099, 1099, 4.7, 400, 70, 'Best Seller', null],
  ['Court Basketball Shoes', 'Basketball', 'Nike', 5499, 6499, 4.6, 120, 9, 'New Arrival', ['UK 8', 'UK 9', 'UK 10', 'UK 11'], '👟'],
];
const MATERIAL = { Football: 'Synthetic leather', Cricket: 'English willow / PU', Running: 'Breathable mesh', 'Gym & Fitness': 'Rubber & steel', Basketball: 'Composite rubber', Badminton: 'Graphite composite', Cycling: 'EPS foam shell', Swimming: 'Silicone & polycarbonate' };

export const PRODUCTS = RAW.map(([name, category, brand, price, orig, rating, reviews, stock, badge, sizes, emoji], i) => {
  const c = catByName(category);
  const e = emoji || c.emoji;
  return {
    id: i + 1, name, category, brand, price, orig, rating, reviews, stock, badge, sizes,
    isNew: badge === 'New Arrival', best: badge === 'Best Seller',
    images: [art(e, c.a, c.b, 0), art(e, c.b, c.a, 90), art(e, c.a, '#0B1B2B', 45)],
    desc: `${name} by ${brand}: built for ${category.toLowerCase()} athletes who want reliable performance from the first session to the hundredth. Tested for durability, comfort and control.`,
    specs: [['Brand', brand], ['Sport', category], ['Material', MATERIAL[category]], ['Warranty', '6 months']],
  };
});
export const BRANDS = [...new Set(PRODUCTS.map((p) => p.brand))].sort();
export const MAXP = Math.max(...PRODUCTS.map((p) => p.price));
export const inr = (n) => '₹' + n.toLocaleString('en-IN');
export const off = (p) => (p.orig > p.price ? Math.round((1 - p.price / p.orig) * 100) : 0);
