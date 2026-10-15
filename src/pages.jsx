import { useState, useMemo } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Heart, ShieldCheck, RotateCcw, Truck, BadgeCheck, SlidersHorizontal, X, Search, Minus, Plus } from 'lucide-react';
import { PRODUCTS, CATEGORIES, BRANDS, MAXP, catBySlug, inr, off, art } from './data.js';
import { useStore } from './store.jsx';
import { Img, Rating, SectionHeading, Breadcrumbs, ProductGrid, Newsletter, CartItem, related } from './components.jsx';

export function Home() {
  const nav = useNavigate();
  return (
    <>
      <section className="hero"><div className="wrap hero-in">
        <div><span className="pill">NEW SEASON / NEW ENERGY</span>
          <h1>GEAR UP.<br />PLAY HARDER.</h1>
          <p>Premium sports equipment built for every athlete, every goal, and every game.</p>
          <div className="btns"><button className="btn btn-lime" onClick={() => nav('/shop')}>Shop now</button><button className="btn btn-ghost-l" onClick={() => document.getElementById('sports').scrollIntoView({ behavior: 'smooth' })}>Explore collections</button></div></div>
        <div className="collage" aria-hidden="true">{[0, 1, 2].map((i) => <img key={i} src={PRODUCTS[[1, 2, 5][i]].images[0]} alt="" />)}</div>
      </div></section>
      <section className="wrap sec" id="sports"><SectionHeading title="Shop by sport" />
        <div className="cats">{CATEGORIES.map((c) => <Link key={c.slug} to={`/category/${c.slug}`} className="cat"><img src={art(c.emoji, c.a, c.b)} alt="" /><span>{c.name}</span></Link>)}</div></section>
      <section className="wrap sec"><SectionHeading title="Featured products" to="/shop" /><ProductGrid items={PRODUCTS.slice(0, 8)} /></section>
      <section className="promo"><div className="wrap"><h2>YOUR NEXT PERSONAL BEST STARTS HERE.</h2><p>Weights, bands, mats and more for every training plan.</p><Link to="/category/gym-fitness" className="btn btn-lime">Shop training gear</Link></div></section>
      <section className="wrap sec"><SectionHeading title="New arrivals" to="/shop?sort=newest" /><ProductGrid items={PRODUCTS.filter((p) => p.isNew).slice(0, 4)} /></section>
      <section className="wrap sec"><SectionHeading title="Best sellers" to="/shop?sort=rating" /><ProductGrid items={PRODUCTS.filter((p) => p.best).slice(0, 4)} /></section>
      <section className="wrap sec benefits">{[[BadgeCheck, 'Authentic sports gear'], [ShieldCheck, 'Secure payments'], [RotateCcw, 'Easy returns'], [Truck, 'Fast delivery across India']].map(([I, t]) => <div key={t}><I size={30} /><b>{t}</b></div>)}</section>
      <Newsletter />
    </>
  );
}

export function Shop() {
  const { slug } = useParams();
  const nav = useNavigate();
  const [sp, setSp] = useSearchParams();
  const [shown, setShown] = useState(8);
  const [drawer, setDrawer] = useState(false);
  const q = sp.get('q') || '', brand = sp.get('brand') || '', sort = sp.get('sort') || 'featured';
  const max = +(sp.get('max') || MAXP), rating = +(sp.get('rating') || 0), stock = sp.get('stock') === '1', sale = sp.get('sale') === '1';
  const cat = slug ? catBySlug(slug) : null;
  const set = (k, v) => { const n = new URLSearchParams(sp); v === '' || v == null || v === false ? n.delete(k) : n.set(k, v); setSp(n); setShown(8); };
  const items = useMemo(() => {
    let r = PRODUCTS.filter((p) => (!cat || p.category === cat.name) && (!brand || p.brand === brand) && p.price <= max && p.rating >= rating && (!stock || p.stock > 0) && (!sale || off(p) > 0)
      && (!q || (p.name + p.category + p.brand).toLowerCase().includes(q.toLowerCase())));
    const s = { 'price-asc': (a, b) => a.price - b.price, 'price-desc': (a, b) => b.price - a.price, rating: (a, b) => b.rating - a.rating, newest: (a, b) => b.id - a.id }[sort];
    return s ? [...r].sort(s) : r;
  }, [cat, brand, max, rating, stock, sale, q, sort]);
  const clear = () => { setSp({}); setShown(8); if (slug) nav('/shop'); };
  const Filters = (
    <div className="filters">
      <h4>Category</h4>
      <label><input type="radio" name="c" checked={!cat} onChange={() => nav('/shop')} /> All</label>
      {CATEGORIES.map((c) => <label key={c.slug}><input type="radio" name="c" checked={cat?.slug === c.slug} onChange={() => nav(`/category/${c.slug}`)} /> {c.name}</label>)}
      <h4>Brand</h4>
      <select aria-label="Brand" value={brand} onChange={(e) => set('brand', e.target.value)}><option value="">All brands</option>{BRANDS.map((b) => <option key={b}>{b}</option>)}</select>
      <h4>Max price: {inr(max)}</h4>
      <input type="range" aria-label="Max price" min="500" max={MAXP} step="100" value={max} onChange={(e) => set('max', e.target.value)} />
      <h4>Rating</h4>
      <select aria-label="Minimum rating" value={rating} onChange={(e) => set('rating', e.target.value === '0' ? '' : e.target.value)}><option value="0">Any</option><option value="4">4★ & up</option><option value="4.5">4.5★ & up</option></select>
      <h4>Availability</h4>
      <label><input type="checkbox" checked={stock} onChange={(e) => set('stock', e.target.checked ? '1' : '')} /> In stock only</label>
      <label><input type="checkbox" checked={sale} onChange={(e) => set('sale', e.target.checked ? '1' : '')} /> On sale</label>
      <button className="btn btn-ghost btn-sm" onClick={clear}>Clear all filters</button>
    </div>
  );
  return (
    <div className="wrap sec">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: cat ? cat.name : 'Shop' }]} />
      <h1 className="title">{cat ? cat.name : 'Shop all'}</h1>
      <div className="shop">
        <aside className="side">{Filters}</aside>
        {drawer && <div className="overlay" onClick={() => setDrawer(false)} />}
        <aside className={'drawer left only-m' + (drawer ? ' open' : '')}><div className="drawer-head"><b>Filters</b><button className="icon" aria-label="Close filters" onClick={() => setDrawer(false)}><X /></button></div><div className="pad">{Filters}<button className="btn btn-lime" onClick={() => setDrawer(false)}>Show {items.length} results</button></div></aside>
        <div>
          <div className="toolbar">
            <button className="btn btn-ghost btn-sm only-m" onClick={() => setDrawer(true)}><SlidersHorizontal size={16} /> Filters</button>
            <div className="search"><Search size={16} /><input aria-label="Search products" placeholder="Search products" value={q} onChange={(e) => set('q', e.target.value)} />{q && <button className="icon" aria-label="Clear search" onClick={() => set('q', '')}><X size={14} /></button>}</div>
            <span className="muted">{items.length} products</span>
            <select aria-label="Sort" value={sort} onChange={(e) => set('sort', e.target.value)}><option value="featured">Featured</option><option value="price-asc">Price: Low to High</option><option value="price-desc">Price: High to Low</option><option value="rating">Top Rated</option><option value="newest">Newest</option></select>
          </div>
          {items.length === 0 ? <div className="empty"><Search size={40} /><p>No products match your search or filters.</p><button className="btn btn-lime" onClick={clear}>Clear all filters</button></div>
            : <><ProductGrid items={items.slice(0, shown)} />{shown < items.length && <div className="center"><button className="btn btn-dark" onClick={() => setShown(shown + 8)}>Load more</button></div>}</>}
        </div>
      </div>
    </div>
  );
}

export function ProductDetails() {
  const { id } = useParams();
  const p = PRODUCTS.find((x) => x.id === +id);
  const { addToCart, toggleWish, wish } = useStore();
  const nav = useNavigate();
  const [img, setImg] = useState(0); const [size, setSize] = useState(null); const [qty, setQty] = useState(1);
  const [pin, setPin] = useState(''); const [pinMsg, setPinMsg] = useState(null); const [needSize, setNeedSize] = useState(false);
  if (!p) return <NotFound />;
  const d = off(p); const liked = wish.includes(p.id);
  const add = () => { if (p.sizes && !size) { setNeedSize(true); return false; } addToCart(p.id, size, qty); return true; };
  const check = () => setPinMsg(/^[1-9]\d{5}$/.test(pin) ? { t: `Delivery to ${pin} in 3-5 days.` } : { bad: true, t: 'Enter a valid 6-digit PIN code.' });
  return (
    <div className="wrap sec">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Shop', to: '/shop' }, { label: p.name }]} />
      <div className="pd">
        <div className="gal"><Img src={p.images[img]} alt={p.name} className="main" /><div className="thumbs">{p.images.map((s, i) => <button key={i} className={i === img ? 'on' : ''} aria-label={`View image ${i + 1}`} onClick={() => setImg(i)}><Img src={s} alt="" /></button>)}</div></div>
        <div className="info">
          <small className="muted">{p.category} · {p.brand}</small><h1>{p.name}</h1><Rating value={p.rating} reviews={p.reviews} />
          <div className="price big"><b>{inr(p.price)}</b>{d > 0 && <><s>{inr(p.orig)}</s><em>{d}% off</em></>}</div>
          <p>{p.desc}</p>
          {p.sizes && <div><b>Size</b><div className="sizes">{p.sizes.map((s) => <button key={s} className={s === size ? 'on' : ''} onClick={() => { setSize(s); setNeedSize(false); }}>{s}</button>)}</div>{needSize && <p className="err">Please select a size.</p>}</div>}
          <p className={p.stock ? 'ok' : 'err'}>{p.stock ? (p.stock < 10 ? `Only ${p.stock} left` : 'In stock') : 'Out of stock'}</p>
          <div className="qty lg"><button aria-label="Decrease quantity" onClick={() => setQty(Math.max(1, qty - 1))}><Minus size={16} /></button><span>{qty}</span><button aria-label="Increase quantity" onClick={() => setQty(Math.min(10, qty + 1))}><Plus size={16} /></button></div>
          <div className="btns"><button className="btn btn-lime" disabled={!p.stock} onClick={add}>Add to cart</button><button className="btn btn-dark" disabled={!p.stock} onClick={() => add() && nav('/cart')}>Buy now</button><button className={'btn btn-ghost' + (liked ? ' on' : '')} onClick={() => toggleWish(p.id)} aria-label="Toggle wishlist"><Heart size={18} fill={liked ? 'currentColor' : 'none'} /></button></div>
          <div className="pin"><label htmlFor="pin"><b>Check delivery</b></label><div><input id="pin" inputMode="numeric" maxLength={6} placeholder="PIN code" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} /><button className="btn btn-dark btn-sm" onClick={check}>Check</button></div>{pinMsg && <p className={pinMsg.bad ? 'err' : 'ok'}>{pinMsg.t}</p>}</div>
          <table className="specs"><tbody>{p.specs.map(([k, v]) => <tr key={k}><th>{k}</th><td>{v}</td></tr>)}</tbody></table>
          <p className="muted">Free shipping above ₹1,999. 7-day easy returns on unused items.</p>
        </div>
      </div>
      <SectionHeading title="Related products" /><ProductGrid items={related(p)} />
    </div>
  );
}

export function Wishlist() {
  const { wish } = useStore();
  const items = PRODUCTS.filter((p) => wish.includes(p.id));
  return <div className="wrap sec"><h1 className="title">Wishlist</h1>{items.length ? <ProductGrid items={items} /> : <div className="empty"><Heart size={40} /><p>Nothing saved yet.</p><Link to="/shop" className="btn btn-lime">Browse products</Link></div>}</div>;
}
export function CartPage() {
  const { lines, subtotal, shipping, total, setQty, remove, clear, say } = useStore();
  const [done, setDone] = useState(false);
  if (done) return <div className="wrap sec empty"><BadgeCheck size={48} /><h1>Demo order placed</h1><p>This is a frontend demo. No payment was taken.</p><Link to="/shop" className="btn btn-lime">Continue shopping</Link></div>;
  return (
    <div className="wrap sec"><h1 className="title">Shopping cart</h1>
      {lines.length === 0 ? <div className="empty"><p>Your cart is empty.</p><Link to="/shop" className="btn btn-lime">Continue shopping</Link></div> : (
        <div className="cartpg"><div>{lines.map((l) => <CartItem key={l.id + '-' + l.size} l={l} setQty={setQty} remove={remove} />)}</div>
          <div className="sum"><div className="row"><span>Subtotal</span><b>{inr(subtotal)}</b></div><div className="row"><span>Shipping</span><b>{shipping ? inr(shipping) : 'Free'}</b></div><div className="row tot"><span>Total</span><b>{inr(total)}</b></div>
            <button className="btn btn-lime" onClick={() => { clear(); setDone(true); say('Demo order placed'); }}>Place demo order</button><small className="muted">Frontend demo: no real payments.</small></div></div>)}
    </div>
  );
}
export const About = () => <div className="wrap sec narrow"><h1 className="title">About ATHLETIX</h1><p>ATHLETIX is a demo sports equipment store built to show a premium shopping experience: authentic gear, clear pricing and fast delivery across India.</p><p>From the football pitch to the gym floor, we stock equipment for eight sports from brands athletes trust.</p></div>;
export function Contact() {
  const [f, setF] = useState({ name: '', email: '', subject: '', message: '' }); const [err, setErr] = useState({}); const [sent, setSent] = useState(false);
  const submit = (e) => {
    e.preventDefault(); const x = {};
    if (!f.name.trim()) x.name = 'Enter your name.'; if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email)) x.email = 'Enter a valid email.';
    if (!f.subject.trim()) x.subject = 'Enter a subject.'; if (f.message.trim().length < 10) x.message = 'Message must be at least 10 characters.';
    setErr(x); if (!Object.keys(x).length) { setSent(true); setF({ name: '', email: '', subject: '', message: '' }); }
  };
  const field = (k, label, tag) => { const T = tag || 'input'; return <div className="fld"><label htmlFor={k}>{label}</label><T id={k} value={f[k]} rows={5} onChange={(e) => setF({ ...f, [k]: e.target.value })} aria-invalid={!!err[k]} />{err[k] && <small className="err">{err[k]}</small>}</div>; };
  return <div className="wrap sec narrow"><h1 className="title">Contact us</h1>{sent && <p className="ok" role="status">Thanks! Your message was sent (demo).</p>}<form onSubmit={submit} noValidate>{field('name', 'Name')}{field('email', 'Email')}{field('subject', 'Subject')}{field('message', 'Message', 'textarea')}<button className="btn btn-dark">Send message</button></form></div>;
}
export const NotFound = () => <div className="wrap sec empty"><h1>404</h1><p>We could not find that page.</p><Link to="/" className="btn btn-lime">Back to home</Link></div>;
