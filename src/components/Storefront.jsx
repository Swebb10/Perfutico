import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowRight, Check, ChevronDown, Heart, Menu, Moon, Plus, Search, ShoppingBag, Sparkles, Sun, UserRound, X } from "lucide-react";
import ProductCard, { money } from "./ProductCard";
import AdminDashboard from "./AdminDashboard";
import { useAuth } from "../context/AuthContext";
import { firebaseReady, settings } from "../lib/firebase";
import { createOrder, favorite, sendSuggestion, watchFavorites, watchOrders, watchProducts, watchSuggestions } from "../lib/shop";

function useSaved(key, fallback) {
  const [value, setValue] = useState(() => { try { const saved = localStorage.getItem(key); return saved ? JSON.parse(saved) : fallback; } catch { return fallback; } });
  useEffect(() => { localStorage.setItem(key, JSON.stringify(value)); }, [key, value]);
  return [value, setValue];
}

function Sheet({ children, close, title, className = "" }) {
  return <div className="scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}><section className={"sheet " + className} role="dialog" aria-modal="true" aria-label={title}>{children}</section></div>;
}

function ProductDetail({ item, close, add }) {
  const [qty, setQty] = useState(1); if (!item) return null;
  return <Sheet close={close} title={item.name} className="detail-sheet"><button className="sheet-close circle-btn" onClick={close} aria-label="Cerrar"><X /></button><div className="detail-photo"><img src={item.image} alt={item.name} /></div><div className="detail-content"><small>{item.brand} · {item.volume || "100 ml"}</small><h2>{item.name}</h2><strong className="detail-price">{money(item.price)}</strong><p>{item.description || "Una fragancia cuidadosamente seleccionada para acompañar lo que permanece."}</p><div className="notes">{[["Salida", item.notes?.top], ["Corazón", item.notes?.heart], ["Fondo", item.notes?.base]].map(([title, value]) => <div key={title}><small>{title}</small><span>{value || "Notas de autor"}</span></div>)}</div><small className="stock-note">{item.stock ? item.stock + " disponibles" : "Agotado por ahora"}</small><div className="buy-row"><div className="qty"><button onClick={() => setQty(Math.max(1, qty - 1))}><X size={13} /></button>{qty}<button onClick={() => setQty(Math.min(Number(item.stock) || 1, qty + 1))}><Plus size={13} /></button></div><button className="primary grow" disabled={!Number(item.stock)} onClick={() => { add(item, qty); close(); }}>Añadir · {money(item.price * qty)}</button></div></div></Sheet>;
}

function SidePanel({ title, eyebrow, close, children }) {
  return <div className="scrim side-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}><aside className="side-panel"><header className="side-head"><div><small>{eyebrow}</small><h2>{title}</h2></div><button className="circle-btn" onClick={close} aria-label="Cerrar"><X size={18} /></button></header>{children}</aside></div>;
}

function Storefront() {
  const { user, isAdmin, login, register, google, logout } = useAuth();
  const [products, setProducts] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsError, setSuggestionsError] = useState("");
  const [orders, setOrders] = useState([]);
  const [ordersError, setOrdersError] = useState("");
  const [cart, setCart] = useSaved("perfutico-cart", []);
  const [theme, setTheme] = useSaved("perfutico-theme", "light");
  const [filter, setFilter] = useState("todos");
  const [sort, setSort] = useState("curated");
  const [search, setSearch] = useState("");
  const [chosen, setChosen] = useState(null);
  const [panel, setPanel] = useState("");
  const [toast, setToast] = useState("");
  const [menu, setMenu] = useState(false);
  const [order, setOrder] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => watchProducts(setProducts), []);
  useEffect(() => { if (!user) { setFavorites([]); return undefined; } return watchFavorites(user.uid, setFavorites); }, [user]);
  useEffect(() => {
    if (!isAdmin) { setSuggestions([]); setSuggestionsError(""); return undefined; }
    return watchSuggestions(setSuggestions, (reason) => setSuggestionsError(reason.message || "No se pudieron cargar las sugerencias."));
  }, [isAdmin]);
  useEffect(() => {
    if (!isAdmin) { setOrders([]); setOrdersError(""); return undefined; }
    return watchOrders(setOrders, (reason) => setOrdersError(reason.message || "No se pudieron cargar los pedidos."));
  }, [isAdmin]);
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  useEffect(() => { if (!toast) return undefined; const t = setTimeout(() => setToast(""), 2600); return () => clearTimeout(t); }, [toast]);

  const shown = useMemo(() => products.filter((p) => (filter === "todos" || p.category === filter) && (!search.trim() || [p.name,p.brand,p.description].join(" ").toLowerCase().includes(search.toLowerCase()))).sort((a,b) => sort === "low" ? a.price-b.price : sort === "high" ? b.price-a.price : sort === "name" ? a.name.localeCompare(b.name) : Number(Boolean(b.featured))-Number(Boolean(a.featured))), [products,filter,search,sort]);
  const cartCount = cart.reduce((sum,item) => sum + item.quantity, 0);
  const total = cart.reduce((sum,item) => sum + item.price * item.quantity, 0);
  const likedProducts = products.filter((p) => favorites.includes(p.id));
  const notify = (message) => setToast(message);
  const goCollection = () => { setMenu(false); document.getElementById("collection")?.scrollIntoView({ behavior: "smooth" }); };
  const addToCart = (product, qty = 1) => {
    setCart((prev) => { const old = prev.find((p) => p.id === product.id); if (old) return prev.map((p) => p.id === product.id ? { ...p, quantity: Math.min(p.stock || 99, p.quantity + qty) } : p); return [...prev, { id:product.id,name:product.name,brand:product.brand,volume:product.volume,image:product.image,price:Number(product.price),stock:Number(product.stock)||99,quantity:qty }]; });
    notify(product.name + " añadido a la bolsa");
  };
  const toggleFavorite = async (product) => {
    if (!user) { setPanel("auth"); return; }
    try { await favorite(user.uid, product.id, !favorites.includes(product.id)); notify(favorites.includes(product.id) ? "Quitado de favoritos" : "Guardado en favoritos"); }
    catch (e) { notify(e.message || "No se pudo actualizar favoritos"); }
  };
  const setQty = (id, quantity) => setCart((prev) => quantity <= 0 ? prev.filter((p) => p.id !== id) : prev.map((p) => p.id === id ? { ...p, quantity: Math.min(quantity, p.stock || 99) } : p));
  const placeOrder = async (customer) => {
    setBusy(true); setError("");
    let id = "PFT-" + Date.now().toString().slice(-7); let saved = false;
    try {
      const ref = await createOrder({ customerName:customer.name.trim(), phone:customer.phone.trim(), address:customer.address.trim(), items:cart.map((p) => ({ id:p.id,name:p.name,brand:p.brand,quantity:p.quantity,unitPrice:p.price })), total, ...(user ? { userId:user.uid } : {}) });
      id = ref.id; saved = true;
    } catch (e) { if (firebaseReady) setError(e.message || "No se pudo guardar la orden; puedes continuar por WhatsApp."); }
    const lines = cart.map((p) => "• " + p.quantity + " × " + p.name + " — " + money(p.price*p.quantity)).join("\n");
    const message = ["Hola, quiero confirmar mi pedido en Perfutico.","","Orden: " + id,"Nombre: " + customer.name.trim(),"Teléfono: " + customer.phone.trim(),"Entrega: " + customer.address.trim(),"","Productos:",lines,"","Total a pagar: " + money(total),"SINPE Móvil: " + (settings.sinpe || "configurar número"),"Titular: " + (settings.sinpeHolder || "configurar titular"),"","Adjunto en este chat la foto del comprobante SINPE."].join("\n");
    const phone = (settings.whatsapp || "").replace(/\D/g, "");
    setOrder({ id, saved, url:"https://api.whatsapp.com/send?phone=" + phone + "&text=" + encodeURIComponent(message) });
    setBusy(false);
  };
  const closeOrder = () => { setCart([]); setOrder(null); setPanel(""); };
  const nav = <><button onClick={goCollection}>La colección</button><a href="#ritual" onClick={() => setMenu(false)}>Nuestro ritual</a>{user && <button onClick={() => { setPanel("profile"); setMenu(false); }}>Mi perfil</button>}{isAdmin && <button onClick={() => { setPanel("admin"); setMenu(false); }}>Administración</button>}</>;

  return <div className="site">
    <div className="announcement"><Sparkles size={13} /> <span>Una selección personal de fragancias extraordinarias</span><i>·</i><span>San José · Costa Rica</span></div>
    <header className="header"><button className="mobile-toggle circle-btn" onClick={() => setMenu(!menu)} aria-label="Menú">{menu ? <X /> : <Menu />}</button><a className="wordmark" href="#"><b>P</b><span>Perfutico<small>PERFUMERÍA SELECTA</small></span></a><nav className="nav">{nav}</nav><div className="head-actions"><button className="circle-btn search-shortcut" onClick={() => { goCollection(); setTimeout(() => document.getElementById("search")?.focus(), 200); }} aria-label="Buscar"><Search size={17} /></button><button className="circle-btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Cambiar tema">{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</button><button className="circle-btn user-action" aria-label="Mi cuenta" onClick={() => setPanel(user ? "profile" : "auth")}>{user ? <span className="avatar-mini">{(user.email || "P")[0].toUpperCase()}</span> : <UserRound size={17} />}</button><button className="bag" onClick={() => setPanel("cart")}><ShoppingBag size={17} /><span>Bolsa</span><b>{cartCount}</b></button></div>{menu && <nav className="mobile-nav">{nav}<button onClick={() => { setPanel(user ? "profile" : "auth"); setMenu(false); }}>Cuenta</button></nav>}</header>

    <main>
      <section className="hero"><div className="hero-copy"><small className="kicker"><i></i> PERFUMERÍA DE AUTOR · SAN JOSÉ</small><h1>Una esencia<br />que <em>permanece.</em></h1><p>Fragancias con carácter, elegidas para acompañar lo que no necesita explicación.</p><div className="hero-actions"><button className="primary gold" onClick={goCollection}>Explorar la colección <ArrowRight size={15} /></button><span>Una selección, siempre personal.</span></div><div className="hero-foot">01 — 06 <i></i> EL ARTE DE DEJAR HUELLA</div></div><div className="hero-image"><div className="hero-image-caption"><span>01 / 03</span><span>MADE TO BE REMEMBERED</span></div><span className="image-mark">P.</span></div></section>

      <section className="intro" id="ritual"><small>MÁS QUE UN PERFUME</small><p>Una fragancia no solo se lleva.<br /><em>Se convierte en parte de tu historia.</em></p><b>P /</b></section>

      <section className="collection" id="collection"><div className="section-heading"><div><small className="kicker"><i></i> ENCUENTRA TU HUELLA</small><h2>La colección</h2></div><p>Una selección cuidada para quienes entienden<br />que los detalles permanecen.</p></div>
        <div className="catalog-bar"><div className="filters">{[["todos","Todo"],["mujer","Mujer"],["hombre","Hombre"],["unisex","Unisex"]].map(([key,label]) => <button key={key} className={filter===key?"filter active":"filter"} onClick={() => setFilter(key)}>{label}</button>)}</div><div className="catalog-tools"><label className="search"><Search size={15} /><input id="search" placeholder="Buscar perfume o marca" value={search} onChange={(e) => setSearch(e.target.value)} /></label><label className="sort"><select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Ordenar"><option value="curated">Selección Perfutico</option><option value="low">Precio menor</option><option value="high">Precio mayor</option><option value="name">Nombre</option></select><ChevronDown size={13} /></label></div></div>
        <div className="count-row"><span>{String(shown.length).padStart(2,"0")} FRAGANCIAS</span><span>SELECCIÓN OLFATIVA · EDICIÓN ACTUAL</span></div>
        {shown.length ? <div className="grid">{shown.map((p) => <ProductCard key={p.id} item={p} liked={favorites.includes(p.id)} onLike={toggleFavorite} onOpen={setChosen} onAdd={addToCart} />)}</div> : <div className="empty-results"><Search /><h3>Una esencia por descubrir.</h3><p>{firebaseReady ? "Añade perfumes desde el panel de administración." : "No encontramos resultados para esa búsqueda."}</p>{search && <button onClick={() => setSearch("")}>Limpiar búsqueda →</button>}</div>}
        <div className="collection-end">UNA BUENA FRAGANCIA NO SE OLVIDA <i></i> SE QUEDA CONTIGO</div></section>

      <section className="editorial"><div className="editorial-copy"><small className="kicker"><i></i> EL DETALLE INVISIBLE</small><h2>Tu presencia<br />tiene <em>una firma.</em></h2><p>Descubre notas, texturas y recuerdos en una selección pensada para encontrar una fragancia que se sienta auténticamente tuya.</p><button className="outline-light" onClick={goCollection}>Descubrir perfumes <ArrowRight size={14} /></button></div><div className="editorial-art"><div className="ring r1"></div><div className="ring r2"></div><div className="bottle"><span>P.</span></div><small>EAU DE PARFUM<br />SAN JOSÉ · C.R.</small><b>P / 02</b></div></section>

      <section className="services">{[["01","Selección curada","Cada fragancia está aquí por una razón."],["02","Atención personal","Coordinamos tu pedido directamente contigo."],["03","Pago por SINPE","Transparente, directo y sin intermediarios."]].map(([num,title,copy]) => <article key={num}><small>{num}</small><b>{num}</b><h3>{title}</h3><p>{copy}</p></article>)}</section>
      <section className="last-note"><div><small>NOTAS DE LA BOUTIQUE</small><h2>Lo extraordinario<br />se descubre <em>despacio.</em></h2></div><button className="outline-light" onClick={goCollection}>Encontrar mi fragancia <ArrowRight size={14} /></button><span>P.</span></section>
    </main>

    <footer className="footer"><div className="footer-main"><div><a className="wordmark footer-brand" href="#"><b>P</b><span>Perfutico</span></a><p>Una selección personal de fragancias extraordinarias.</p><small>SAN JOSÉ · COSTA RICA</small></div><div><small>EXPLORA</small><button onClick={goCollection}>La colección</button><a href="#ritual">Nuestro ritual</a></div><div><small>ATENCIÓN</small><span>Pedidos por WhatsApp</span><span>Pago con SINPE Móvil</span><span>Entrega por coordinar</span></div><a className="social" href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram"><Sparkles size={17} /></a></div><div className="footer-bottom"><span>© {new Date().getFullYear()} PERFUTICO PERFUMERÍA SELECTA</span><span>HECHO CON INTENCIÓN · SAN JOSÉ, C.R.</span><button onClick={() => window.scrollTo({top:0,behavior:"smooth"})}><ArrowDown size={13} /> VOLVER ARRIBA</button></div>{!firebaseReady && <p className="preview">Vista de catálogo de demostración · Configura las variables del archivo .env.local para activar las funciones de Firebase.</p>}</footer>

    {chosen && <ProductDetail item={chosen} close={() => setChosen(null)} add={addToCart} />}
    {panel === "cart" && <SidePanel title={"Bolsa ("+cartCount+")"} eyebrow="TU SELECCIÓN" close={() => setPanel("")}>{cart.length ? <><div className="cart-list">{cart.map((p) => <article className="cart-item" key={p.id}><img src={p.image} alt="" /><div className="cart-item-info"><small>{p.brand}</small><strong>{p.name}</strong><span>{p.volume}</span><div className="qty"><button onClick={() => setQty(p.id,p.quantity-1)}><X size={12} /></button>{p.quantity}<button onClick={() => setQty(p.id,p.quantity+1)}><Plus size={12} /></button><button className="remove" onClick={() => setQty(p.id,0)}>Quitar</button></div></div><b>{money(p.price*p.quantity)}</b></article>)}</div><div className="cart-bottom"><div><span>Total</span><strong>{money(total)}</strong></div><p>Envío y entrega se coordinan por WhatsApp.</p><button className="primary full" onClick={() => { setPanel("checkout"); setOrder(null); setError(""); }}>Continuar con el pedido <ArrowRight size={15} /></button><small>SINPE Móvil · Confirmación personal</small></div></> : <div className="panel-empty"><ShoppingBag /><h3>Aún no hay perfumes</h3><p>Descubre una esencia que se sienta como tuya.</p><button onClick={() => { setPanel(""); goCollection(); }}>Explorar la colección →</button></div>}</SidePanel>}

    {panel === "checkout" && <Sheet close={() => setPanel("")} title="Coordina tu entrega" className="checkout-sheet"><header className="checkout-head"><div><small>PERFUTICO · PEDIDO</small><h2>{order ? "Pedido listo" : "Coordina tu entrega"}</h2></div><button className="circle-btn" onClick={() => setPanel("")}><X /></button></header>{order ? <div className="order-success"><div className="check-mark"><Check /></div><small>ORDEN {order.id}</small><h3>Tu próxima esencia está cerca.</h3><p>Realiza el SINPE Móvil y comparte el comprobante por WhatsApp para confirmar el pedido.</p><div className="sinpe-box"><small>SINPE MÓVIL</small><div><span>Número</span><b>{settings.sinpe || "Configurar VITE_SINPE_NUMBER"}</b></div><div><span>Titular</span><b>{settings.sinpeHolder || "Configurar VITE_SINPE_HOLDER"}</b></div><div className="sinpe-total"><span>Total a transferir</span><strong>{money(total)}</strong></div></div><div className="order-lines">{cart.map((p) => <div key={p.id}><span>{p.quantity} × {p.name}</span><b>{money(p.price*p.quantity)}</b></div>)}</div>{!order.saved && <p className="notice">No se guardó la orden en Firebase. Puedes continuar por WhatsApp y revisar la configuración.</p>}{error && <p className="notice">{error}</p>}<a className="whatsapp primary full" href={order.url} target="_blank" rel="noreferrer">Enviar comprobante por WhatsApp ↗</a><p className="hint">El mensaje ya incluye tu pedido. Adjunta la foto del comprobante en el chat.</p><button className="plain-link" onClick={closeOrder}>Volver a la tienda</button></div> : <div className="checkout-layout"><form className="checkout-form" onSubmit={(e) => { e.preventDefault(); placeOrder(Object.fromEntries(new FormData(e.currentTarget))); }}><small>DATOS DE ENVÍO · COMPRA COMO INVITADO</small><label>Nombre completo<input name="name" required defaultValue={user?.displayName || ""} placeholder="¿A quién entregamos?" /></label><label>Teléfono<input name="phone" required autoComplete="tel" placeholder="+506 8888 8888" /></label><label>Dirección o punto de entrega<textarea name="address" required rows="3" placeholder="Provincia, cantón y señas para coordinar" /></label><div className="checkout-total"><span>Total del pedido</span><strong>{money(total)}</strong></div>{error && <p className="notice">{error}</p>}<button className="primary full" disabled={busy}>{busy ? "Preparando pedido…" : "Confirmar pedido"} <ArrowRight size={14} /></button><button className="plain-link" type="button" onClick={() => setPanel("cart")}>← Volver a la bolsa</button></form><aside className="checkout-aside"><Sparkles /><h3>Un trato personal, de principio a fin.</h3><p>Primero coordinamos la entrega. Después haces la transferencia SINPE Móvil y nos envías el comprobante.</p><ol><li>Confirma tus datos</li><li>Haz el SINPE</li><li>Adjunta el comprobante</li></ol><small>Sin registro obligatorio</small></aside></div>}</Sheet>}

    {panel === "auth" && <AuthDialog close={() => setPanel("")} login={login} register={register} google={google} />}
    {panel === "profile" && user && <Profile user={user} favorites={likedProducts} openProduct={(p) => { setPanel(""); setChosen(p); }} close={() => setPanel("")} logout={async () => { await logout(); setPanel(""); }} />}
    {panel === "admin" && isAdmin && <div className="admin-scrim"><AdminDashboard products={products} suggestions={suggestions} suggestionsError={suggestionsError} orders={orders} ordersError={ordersError} onClose={() => setPanel("")} notify={notify} /></div>}
    {toast && <div className="toast"><Check size={15} />{toast}<button onClick={() => setToast("")}><X size={13} /></button></div>}
    {favorites.length > 0 && <button className="float-favs" aria-label="Favoritos" onClick={() => setPanel("profile")}><Heart size={15} fill="currentColor" /><b>{favorites.length}</b></button>}
  </div>;
}

function AuthDialog({ close, login, register, google }) {
  const [mode,setMode] = useState("login"); const [error,setError] = useState(""); const [busy,setBusy] = useState(false);
  const submit = async (e) => { e.preventDefault(); setBusy(true); setError(""); const data = Object.fromEntries(new FormData(e.currentTarget)); try { await (mode === "login" ? login(data.email,data.password) : register(data.email,data.password)); close(); } catch (err) { setError(err.message || "No se pudo iniciar sesión."); } finally { setBusy(false); } };
  const googleLogin = async () => { setBusy(true); setError(""); try { await google(); close(); } catch (err) { setError(err.message || "No se pudo abrir Google."); } finally { setBusy(false); } };
  return <Sheet close={close} title="Acceso a Perfutico" className="auth-sheet"><button className="sheet-close circle-btn" onClick={close}><X /></button><span className="auth-symbol">P.</span><small>TU ESPACIO PERFUTICO</small><h2>{mode === "login" ? "Qué bueno verte." : "Crea tu cuenta."}</h2><p>Guarda tus favoritos y cuéntanos qué fragancias te gustaría encontrar.</p><button className="google-btn" onClick={googleLogin} disabled={busy}><b>G</b> Continuar con Google</button><div className="or"><span>o con correo</span></div><form className="checkout-form" onSubmit={submit}><label>Correo electrónico<input type="email" name="email" required placeholder="tu@correo.com" /></label><label>Contraseña<input type="password" name="password" required minLength="6" placeholder="Mínimo 6 caracteres" /></label>{error && <p className="notice">{error}</p>}<button className="primary full" disabled={busy}>{busy ? "Un momento…" : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}</button></form><button className="switch-auth" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>{mode === "login" ? "¿Primera vez? Crear una cuenta" : "¿Ya tienes cuenta? Iniciar sesión"}</button><button className="plain-link" onClick={close}>← Continuar como invitado</button></Sheet>;
}

function Profile({ user, favorites, openProduct, close, logout }) {
  const [feedback,setFeedback] = useState(""); const [busy,setBusy] = useState(false);
  const send = async (e) => { e.preventDefault(); const form = e.currentTarget; setBusy(true); setFeedback(""); try { await sendSuggestion(user.uid,new FormData(form).get("suggestion"),{ email:user.email, displayName:user.displayName }); form.reset(); setFeedback("Gracias. Tu sugerencia llegó a la boutique."); } catch (err) { setFeedback(err.message || "No se pudo enviar."); } finally { setBusy(false); } };
  return <SidePanel title="Mi perfil" eyebrow="TU ESPACIO" close={close}><div className="profile-user"><b>{(user.displayName || user.email || "P")[0].toUpperCase()}</b><span><strong>{user.displayName || "Bienvenido a Perfutico"}</strong><small>{user.email}</small></span></div><div className="profile-section"><div className="profile-title"><Heart size={15} /> Mis favoritos <small>{favorites.length}</small></div>{favorites.length ? favorites.map((p) => <button className="favorite-row" key={p.id} onClick={() => openProduct(p)}><img src={p.image} alt="" /><span><small>{p.brand}</small><strong>{p.name}</strong></span><b>→</b></button>) : <p className="muted">Guarda aquí las fragancias que quieras volver a descubrir.</p>}</div><div className="profile-section"><div className="profile-title">Buzón de sugerencias</div><p className="muted">¿Qué perfume te gustaría encontrar en la boutique?</p><form className="checkout-form" onSubmit={send}><textarea name="suggestion" rows="4" maxLength="1200" required placeholder="Cuéntanos qué tienes en mente…" />{feedback && <p className="notice">{feedback}</p>}<button className="primary full" disabled={busy}>{busy ? "Enviando…" : "Enviar sugerencia"}</button></form></div><button className="logout" onClick={logout}>Cerrar sesión</button></SidePanel>;
}

export default Storefront;
