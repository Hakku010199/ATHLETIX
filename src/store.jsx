import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PRODUCTS, CATEGORIES, catByName, art } from './data.js';
import { supabase } from './supabase.js';

const Ctx = createContext();
export const useStore = () => useContext(Ctx);

function usePersist(key, init) {
  const [v, setV] = useState(() => { try { return JSON.parse(localStorage.getItem(key)) || init; } catch { return init; } });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} }, [key, v]);
  return [v, setV];
}

export function formatSupabaseProduct(p, client) {
  let images = [];
  if (p.product_images && p.product_images.length > 0) {
    const sorted = [...p.product_images].sort((a, b) => {
      if (a.is_primary && !b.is_primary) return -1;
      if (!a.is_primary && b.is_primary) return 1;
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    });
    images = sorted.map((img) => {
      const path = img.storage_path;
      if (!path) return '';
      if (path.startsWith('http://') || path.startsWith('https://')) return path;
      return client.storage.from('product-images').getPublicUrl(path).data.publicUrl;
    }).filter(Boolean);
  }

  const categoryName = p.categories?.name || 'Football';
  const categorySlug = p.categories?.slug || 'football';

  if (images.length === 0) {
    if (p.image_url) {
      images.push(p.image_url);
    } else {
      const fallback = catByName(categoryName) || {};
      images.push(art(fallback.emoji || '⚽', fallback.a || '#0B1B2B', fallback.b || '#173a4f'));
    }
  }
  while (images.length < 3) {
    images.push(images[0]);
  }

  const variants = p.product_variants || [];
  const variantSizes = [...new Set(variants.map((v) => v.size).filter(Boolean))];
  const variantColors = [...new Set(variants.map((v) => v.color).filter(Boolean))];
  const totalStock = variants.length > 0
    ? variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0)
    : (p.stock_quantity ?? 10);

  const price = Number(p.price) || 0;
  const orig = Number(p.compare_at_price || p.original_price) || price;

  return {
    id: p.id,
    name: p.name,
    category: categoryName,
    categoryId: p.category_id,
    categorySlug: categorySlug,
    brand: p.brand || 'ATHLETIX',
    price,
    orig,
    rating: Number(p.rating) || 4.5,
    reviews: Number(p.review_count || p.reviews) || 12,
    stock: totalStock,
    badge: p.badge || (p.is_best_seller ? 'Best Seller' : p.is_new ? 'New Arrival' : null),
    sizes: variantSizes.length > 0 ? variantSizes : (p.sizes || null),
    colors: variantColors.length > 0 ? variantColors : (p.colors || null),
    isNew: !!(p.is_new || p.badge === 'New Arrival'),
    best: !!(p.is_best_seller || p.badge === 'Best Seller'),
    images,
    desc: p.description || `${p.name} by ${p.brand || 'ATHLETIX'}: high performance sports equipment.`,
    specs: [
      ['Brand', p.brand || 'ATHLETIX'],
      ['Sport', categoryName],
      ['SKU', p.sku || 'N/A'],
      ['Warranty', '6 months'],
    ],
  };
}

export function StoreProvider({ children }) {
  const [cart, setCart] = usePersist('ax_cart', []);
  const [wish, setWish] = usePersist('ax_wish', []);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [categories, setCategories] = useState(CATEGORIES);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [products, setProducts] = useState(PRODUCTS);
  const [productsLoading, setProductsLoading] = useState(true);

  const loadCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (!error && data && data.length > 0) {
        const mapped = data.map((item) => {
          const fallback = catByName(item.name) || {};
          return {
            id: item.id,
            name: item.name,
            slug: item.slug,
            description: item.description || `${item.name} equipment and gear`,
            image_url: item.image_url || null,
            emoji: fallback.emoji || '🏅',
            a: fallback.a || '#0B1B2B',
            b: fallback.b || '#173a4f',
            sort_order: item.sort_order ?? 0,
            is_active: item.is_active,
          };
        });
        setCategories(mapped);
      }
    } catch (err) {
      console.warn('Could not load categories from Supabase:', err);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      setProductsLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(id, name, slug), product_variants(*), product_images(*)')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped = data.map((p) => formatSupabaseProduct(p, supabase));
        setProducts(mapped);
      }
    } catch (err) {
      console.warn('Could not load products from Supabase:', err);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, [loadCategories, loadProducts]);

  const findCategory = useCallback((slugOrName) => {
    if (!slugOrName) return null;
    const s = slugOrName.toLowerCase();
    let found = categories.find((c) => c.slug?.toLowerCase() === s);
    if (found) return found;
    found = categories.find((c) => c.name?.toLowerCase() === s);
    if (found) return found;
    found = categories.find((c) => c.slug?.toLowerCase().replace(/^(demo|sports?)-/, '') === s.replace(/^(demo|sports?)-/, ''));
    if (found) return found;
    return CATEGORIES.find((c) => c.slug === s || c.slug === s.replace(/^(demo|sports?)-/, '') || c.name.toLowerCase() === s);
  }, [categories]);

  const say = (m) => { setToast(m); setTimeout(() => setToast(''), 2200); };
  const addToCart = (id, size = null, qty = 1) => {
    setCart((c) => c.some((x) => String(x.id) === String(id) && x.size === size)
      ? c.map((x) => (String(x.id) === String(id) && x.size === size ? { ...x, qty: Math.min(x.qty + qty, 10) } : x))
      : [...c, { id, size, qty }]);
    say('Added to cart');
  };
  const setQty = (id, size, qty) => setCart((c) => c.map((x) => (String(x.id) === String(id) && x.size === size ? { ...x, qty: Math.max(1, Math.min(10, qty)) } : x)));
  const remove = (id, size) => { setCart((c) => c.filter((x) => !(String(x.id) === String(id) && x.size === size))); say('Removed from cart'); };
  const toggleWish = (id) => { setWish((w) => (w.some((item) => String(item) === String(id)) ? w.filter((x) => String(x) !== String(id)) : [...w, id])); say(wish.some((item) => String(item) === String(id)) ? 'Removed from wishlist' : 'Saved to wishlist'); };
  
  const lines = cart.map((x) => ({ ...x, p: products.find((p) => String(p.id) === String(x.id)) })).filter((x) => x.p);
  const count = lines.reduce((s, x) => s + x.qty, 0);
  const subtotal = lines.reduce((s, x) => s + x.qty * x.p.price, 0);
  const shipping = subtotal === 0 || subtotal >= 1999 ? 0 : 99;
  const clear = () => setCart([]);

  return (
    <Ctx.Provider value={{
      lines, count, subtotal, shipping, total: subtotal + shipping,
      addToCart, setQty, remove, clear, wish, toggleWish, open, setOpen, toast, say,
      categories, categoriesLoading, findCategory,
      products, productsLoading, refreshProducts: loadProducts
    }}>
      {children}
    </Ctx.Provider>
  );
}
