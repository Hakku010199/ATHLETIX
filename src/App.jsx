import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { StoreProvider } from './store.jsx';
import { Navbar, Footer, CartDrawer, Toast } from './components.jsx';
import { Home, Shop, ProductDetails, Wishlist, CartPage, About, Contact, NotFound } from './pages.jsx';

function ScrollTop() { const { pathname } = useLocation(); useEffect(() => window.scrollTo(0, 0), [pathname]); return null; }
export default function App() {
  return (
    <StoreProvider>
      <ScrollTop /><Navbar /><CartDrawer /><Toast />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/category/:slug" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </StoreProvider>
  );
}
