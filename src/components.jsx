import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Heart, Search, User, Menu, X, Star, Trash2, Plus, Minus, Zap, Mail, ChevronDown, ChevronRight, ArrowRight } from 'lucide-react';
import { PRODUCTS, inr, off, art } from './data.js';
import { useStore } from './store.jsx';

export function Img({ src, alt, ...rest }) {
  return <img src={src} alt={alt} loading="lazy" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = art('🏅', '#0B1B2B', '#2a3f55'); }} {...rest} />;
}
export const Rating = ({ value, reviews }) => (
  <span className="rating" aria-label={`${value} out of 5`}><Star size={14} fill="currentColor" /> {value}{reviews != null && <small> ({reviews})</small>}</span>
);
export const SectionHeading = ({ title, to, link = 'View all' }) => (
  <div className="sec-head"><h2>{title}</h2>{to && <Link to={to} className="link">{link}</Link>}</div>
);
export const Breadcrumbs = ({ items }) => (
  <nav className="crumbs" aria-label="Breadcrumb">{items.map((it, i) => (it.to ? <span key={i}><Link to={it.to}>{it.label}</Link> / </span> : <strong key={i}>{it.label}</strong>))}</nav>
);

export function ProductCard({ p }) {
  const { toggleWish, wish, addToCart } = useStore();
  const liked = wish.includes(p.id);
  const d = off(p);
  return (
    <article className="card">
      <div className="card-img">
        <Link to={`/product/${p.id}`}><Img src={p.images[0]} alt={p.name} /></Link>
        {p.badge && <span className="badge">{p.badge}</span>}
        <button className={'heart' + (liked ? ' on' : '')} onClick={() => toggleWish(p.id)} aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'}><Heart size={18} fill={liked ? 'currentColor' : 'none'} /></button>
      </div>
      <div className="card-body">
        <small className="muted">{p.category}</small>
        <h3><Link to={`/product/${p.id}`}>{p.name}</Link></h3>
        <Rating value={p.rating} reviews={p.reviews} />
        <div className="price"><b>{inr(p.price)}</b>{d > 0 && <><s>{inr(p.orig)}</s><em>{d}% off</em></>}</div>
        <button className="btn btn-dark btn-sm" disabled={!p.stock} onClick={() => addToCart(p.id, p.sizes ? p.sizes[0] : null)}>{p.stock ? 'Quick add' : 'Out of stock'}</button>
      </div>
    </article>
  );
}
export const ProductGrid = ({ items }) => <div className="grid">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>;

export function Navbar() {
  const { count, wish, setOpen, categories } = useStore();
  const [menu, setMenu] = useState(false);
  const [q, setQ] = useState('');
  const [find, setFind] = useState(false);
  const [sportsOpen, setSportsOpen] = useState(false);
  const [mSportsOpen, setMSportsOpen] = useState(true);
  const sportsRef = useRef(null);
  const nav = useNavigate();
  const location = useLocation();
  const isSportsActive = location.pathname.startsWith('/category');

  useEffect(() => {
    setSportsOpen(false);
    setMenu(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (sportsRef.current && !sportsRef.current.contains(e.target)) {
        setSportsOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') setSportsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const go = (e) => { e.preventDefault(); nav(`/shop?q=${encodeURIComponent(q.trim())}`); setFind(false); setMenu(false); };
  return (
    <>
      <div className="announce">FREE SHIPPING ON ORDERS ABOVE ₹1,999 &nbsp;|&nbsp; Season sale: up to 30% off</div>
      <header className="nav">
        <div className="wrap nav-in">
          <button className="icon only-m" aria-label="Open menu" onClick={() => setMenu(true)}><Menu /></button>
          <Link to="/" className="logo"><Zap size={22} fill="#C8F31D" stroke="#0B1B2B" />ATHLETIX</Link>
          <nav className="links" aria-label="Main">
            <NavLink to="/" end>Home</NavLink>
            <NavLink to="/shop" end>Shop</NavLink>

            <div
              ref={sportsRef}
              className="nav-dropdown"
              onMouseEnter={() => setSportsOpen(true)}
              onMouseLeave={() => setSportsOpen(false)}
            >
              <button
                type="button"
                className={'nav-link-btn' + (isSportsActive ? ' active' : '')}
                onClick={() => setSportsOpen((o) => !o)}
                aria-expanded={sportsOpen}
                aria-haspopup="true"
              >
                Sports <ChevronDown size={14} className={'chevron' + (sportsOpen ? ' open' : '')} />
              </button>

              <div className={'sports-menu' + (sportsOpen ? ' open' : '')} role="menu">
                <div className="sports-menu-header">
                  <span>Sports Categories</span>
                  <Link to="/shop" onClick={() => setSportsOpen(false)}>All Sports <ArrowRight size={13} /></Link>
                </div>

                <div className="sports-grid">
                  {categories.map((c) => (
                    <Link
                      key={c.slug}
                      to={`/category/${c.slug}`}
                      className="sport-item"
                      onClick={() => setSportsOpen(false)}
                      role="menuitem"
                    >
                      {c.image_url ? (
                        <img
                          src={c.image_url}
                          alt={c.name}
                          className="sport-thumb"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = art(c.emoji || '⚽', c.a || '#0B1B2B', c.b || '#173a4f');
                          }}
                        />
                      ) : (
                        <img
                          src={art(c.emoji || '⚽', c.a || '#0B1B2B', c.b || '#173a4f')}
                          alt={c.name}
                          className="sport-thumb"
                        />
                      )}
                      <div className="sport-info">
                        <span className="sport-name">{c.name}</span>
                        {c.description && <span className="sport-desc">{c.description}</span>}
                      </div>
                      <ChevronRight size={15} className="sport-arrow" />
                    </Link>
                  ))}
                </div>

                <div className="sports-menu-foot">
                  <Link to="/shop" onClick={() => setSportsOpen(false)}>
                    Explore full sports equipment catalog <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>

            <NavLink to="/shop?brand=Nike">Brands</NavLink>
            <NavLink to="/shop?sort=newest">New Arrivals</NavLink>
            <NavLink to="/shop?sale=1">Sale</NavLink>
          </nav>
          <div className="actions">
            {find ? (
              <form onSubmit={go} className="sbar" role="search"><input autoFocus aria-label="Search products" placeholder="Search products, brands…" value={q} onChange={(e) => setQ(e.target.value)} />{q && <button type="button" className="icon" aria-label="Clear search" onClick={() => setQ('')}><X size={16} /></button>}<button className="icon" aria-label="Search"><Search size={18} /></button></form>
            ) : <button className="icon" aria-label="Open search" onClick={() => setFind(true)}><Search /></button>}
            <Link to="/contact" className="icon hide-m" aria-label="Account"><User /></Link>
            <Link to="/wishlist" className="icon" aria-label="Wishlist"><Heart />{wish.length > 0 && <i className="count">{wish.length}</i>}</Link>
            <button className="icon" aria-label="Open cart" onClick={() => setOpen(true)}><ShoppingCart />{count > 0 && <i className="count">{count}</i>}</button>
          </div>
        </div>
      </header>
      {menu && <div className="overlay" onClick={() => setMenu(false)} />}
      <aside className={'drawer left' + (menu ? ' open' : '')} aria-hidden={!menu}>
        <div className="drawer-head"><b className="drawer-title">Menu</b><button className="icon" aria-label="Close menu" onClick={() => setMenu(false)}><X /></button></div>
        <form onSubmit={go} className="msearch"><input aria-label="Search" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} /></form>
        <Link to="/" className="mlink" onClick={() => setMenu(false)}>Home</Link>
        <Link to="/shop" className="mlink" onClick={() => setMenu(false)}>Shop</Link>
        
        <div className="m-sports-group">
          <button
            type="button"
            className="m-sports-toggle"
            onClick={() => setMSportsOpen((o) => !o)}
            aria-expanded={mSportsOpen}
          >
            <span>Sports</span>
            <ChevronDown size={22} className={'chevron' + (mSportsOpen ? ' open' : '')} />
          </button>
          {mSportsOpen && (
            <div className="m-sports-list">
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  to={`/category/${c.slug}`}
                  className="m-sport-item"
                  onClick={() => { setMenu(false); }}
                >
                  {c.image_url ? (
                    <img
                      src={c.image_url}
                      alt={c.name}
                      className="m-sport-thumb"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = art(c.emoji || '⚽', c.a || '#0B1B2B', c.b || '#173a4f');
                      }}
                    />
                  ) : (
                    <img
                      src={art(c.emoji || '⚽', c.a || '#0B1B2B', c.b || '#173a4f')}
                      alt={c.name}
                      className="m-sport-thumb"
                    />
                  )}
                  <span className="m-sport-name">{c.name}</span>
                  <ChevronRight size={16} className="m-sport-arrow" />
                </Link>
              ))}
              <Link to="/shop" className="m-sport-all" onClick={() => { setMenu(false); }}>
                <span>All Sports Equipment</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>

        <Link to="/shop?brand=Nike" className="mlink" onClick={() => setMenu(false)}>Brands</Link>
        <Link to="/shop?sort=newest" className="mlink" onClick={() => setMenu(false)}>New Arrivals</Link>
        <Link to="/shop?sale=1" className="mlink" onClick={() => setMenu(false)}>Sale</Link>
      </aside>
    </>
  );
}

export function CartDrawer() {
  const { open, setOpen, lines, subtotal, shipping, total, setQty, remove } = useStore();
  const nav = useNavigate();
  return (
    <>
      {open && <div className="overlay" onClick={() => setOpen(false)} />}
      <aside className={'drawer right' + (open ? ' open' : '')} aria-label="Shopping cart">
        <div className="drawer-head"><b>Your cart ({lines.length})</b><button className="icon" aria-label="Close cart" onClick={() => setOpen(false)}><X /></button></div>
        {lines.length === 0 ? (
          <div className="empty"><ShoppingCart size={40} /><p>Your cart is empty.</p><button className="btn btn-lime" onClick={() => { setOpen(false); nav('/shop'); }}>Continue shopping</button></div>
        ) : (
          <>
            <div className="drawer-body">{lines.map((l) => <CartItem key={l.id + '-' + l.size} l={l} setQty={setQty} remove={remove} />)}</div>
            <div className="drawer-foot">
              <div className="row"><span>Subtotal</span><b>{inr(subtotal)}</b></div>
              <div className="row"><span>Shipping</span><b>{shipping ? inr(shipping) : 'Free'}</b></div>
              <div className="row tot"><span>Total</span><b>{inr(total)}</b></div>
              <button className="btn btn-lime" onClick={() => { setOpen(false); nav('/cart'); }}>Proceed to checkout</button>
              <button className="btn btn-ghost" onClick={() => setOpen(false)}>Continue shopping</button>
              <small className="muted">Checkout is a frontend demo. No real payments are processed.</small>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
export function CartItem({ l, setQty, remove }) {
  return (
    <div className="citem">
      <Img src={l.p.images[0]} alt={l.p.name} />
      <div>
        <Link to={`/product/${l.p.id}`}><b>{l.p.name}</b></Link>
        {l.size && <small className="muted">Size: {l.size}</small>}
        <span>{inr(l.p.price)}</span>
        <div className="qty"><button aria-label="Decrease quantity" onClick={() => setQty(l.id, l.size, l.qty - 1)}><Minus size={14} /></button><span>{l.qty}</span><button aria-label="Increase quantity" onClick={() => setQty(l.id, l.size, l.qty + 1)}><Plus size={14} /></button></div>
      </div>
      <button className="icon" aria-label={`Remove ${l.p.name}`} onClick={() => remove(l.id, l.size)}><Trash2 size={18} /></button>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap fgrid">
        <div><div className="logo light"><Zap size={22} fill="#C8F31D" stroke="#0B1B2B" />ATHLETIX</div><p>Premium sports equipment for every athlete, every goal and every game.</p><p className="soc">Instagram · YouTube · X · Facebook</p></div>
        <div><h4>Shop</h4><Link to="/category/football">Football</Link><Link to="/category/cricket">Cricket</Link><Link to="/category/running">Running</Link><Link to="/category/gym-fitness">Gym & Fitness</Link></div>
        <div><h4>Support</h4><Link to="/about">About Us</Link><Link to="/contact">Contact</Link><Link to="/contact">FAQs</Link><Link to="/contact">Shipping</Link><Link to="/contact">Returns</Link></div>
        <div><h4>We accept</h4><p className="pay"><span>UPI</span><span>VISA</span><span>MC</span><span>COD</span></p></div>
      </div>
      <div className="wrap copy">© {new Date().getFullYear()} ATHLETIX. Demo store; no real orders or payments.</div>
    </footer>
  );
}
export function Newsletter() {
  const [e, setE] = useState(''); const [msg, setMsg] = useState(null);
  const submit = (ev) => { ev.preventDefault(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) return setMsg({ bad: true, t: 'Enter a valid email address.' }); setMsg({ t: 'You are in! Check your inbox for 10% off.' }); setE(''); };
  return (
    <section className="news"><div className="wrap"><Mail size={28} /><h2>Get 10% off your first order</h2>
      <form onSubmit={submit} noValidate><label className="sr" htmlFor="nl">Email</label><input id="nl" type="email" placeholder="you@example.com" value={e} onChange={(x) => setE(x.target.value)} /><button className="btn btn-dark">Subscribe</button></form>
      {msg && <p role="status" className={msg.bad ? 'err' : 'ok'}>{msg.t}</p>}</div></section>
  );
}
export const Toast = () => { const { toast } = useStore(); return toast ? <div className="toast" role="status">{toast}</div> : null; };
export const related = (p, allProducts) =>
  (allProducts && allProducts.length > 0 ? allProducts : PRODUCTS)
    .filter((x) => x.category === p.category && String(x.id) !== String(p.id))
    .slice(0, 4);
