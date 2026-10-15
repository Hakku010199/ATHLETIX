import { createContext, useContext, useState, useEffect } from 'react';
import { PRODUCTS } from './data.js';
const Ctx = createContext();
export const useStore = () => useContext(Ctx);
function usePersist(key, init) {
  const [v, setV] = useState(() => { try { return JSON.parse(localStorage.getItem(key)) || init; } catch { return init; } });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} }, [key, v]);
  return [v, setV];
}
export function StoreProvider({ children }) {
  const [cart, setCart] = usePersist('ax_cart', []);
  const [wish, setWish] = usePersist('ax_wish', []);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState('');
  const say = (m) => { setToast(m); setTimeout(() => setToast(''), 2200); };
  const addToCart = (id, size = null, qty = 1) => {
    setCart((c) => c.some((x) => x.id === id && x.size === size)
      ? c.map((x) => (x.id === id && x.size === size ? { ...x, qty: Math.min(x.qty + qty, 10) } : x))
      : [...c, { id, size, qty }]);
    say('Added to cart');
  };
  const setQty = (id, size, qty) => setCart((c) => c.map((x) => (x.id === id && x.size === size ? { ...x, qty: Math.max(1, Math.min(10, qty)) } : x)));
  const remove = (id, size) => { setCart((c) => c.filter((x) => !(x.id === id && x.size === size))); say('Removed from cart'); };
  const toggleWish = (id) => { setWish((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id])); say(wish.includes(id) ? 'Removed from wishlist' : 'Saved to wishlist'); };
  const lines = cart.map((x) => ({ ...x, p: PRODUCTS.find((p) => p.id === x.id) })).filter((x) => x.p);
  const count = lines.reduce((s, x) => s + x.qty, 0);
  const subtotal = lines.reduce((s, x) => s + x.qty * x.p.price, 0);
  const shipping = subtotal === 0 || subtotal >= 1999 ? 0 : 99;
  const clear = () => setCart([]);
  return <Ctx.Provider value={{ lines, count, subtotal, shipping, total: subtotal + shipping, addToCart, setQty, remove, clear, wish, toggleWish, open, setOpen, toast, say }}>{children}</Ctx.Provider>;
}
