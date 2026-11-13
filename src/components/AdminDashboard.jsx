import { useState } from "react";
import { Check, Clock3, Mail, MapPin, Pencil, Phone, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { deletePerfume, markSuggestionReviewed, savePerfume, updateOrderStatus } from "../lib/shop";
import { money } from "./ProductCard";

const blank = { name: "", brand: "", volume: "100 ml", category: "unisex", price: "", stock: "", image: "", description: "", notes: { top: "", heart: "", base: "" } };
const orderStatuses = [
  ["pendiente", "Pendiente SINPE"],
  ["sinpe_confirmado", "SINPE confirmado"],
  ["preparando", "En preparación"],
  ["enviado", "Enviado"],
  ["completado", "Completado"],
  ["cancelado", "Cancelado"],
];
const dateLabel = (value) => {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? new Intl.DateTimeFormat("es-CR", { dateStyle: "medium", timeStyle: "short" }).format(date) : "Fecha no disponible";
};

export default function AdminDashboard({ products, suggestions, suggestionsError, orders, ordersError, onClose, notify }) {
  const [tab, setTab] = useState("catalog");
  const [orderFilter, setOrderFilter] = useState("todos");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState("");
  const pending = suggestions.filter((item) => item.status !== "revisada").length;
  const pendingOrders = orders.filter((item) => item.status === "pendiente").length;
  const visibleOrders = orders.filter((item) => orderFilter === "todos" || item.status === orderFilter);
  const edit = (item) => { setEditing(item.id); setForm({ ...blank, ...item, notes: { ...blank.notes, ...(item.notes || {}) } }); setError(""); document.querySelector(".admin-scrim")?.scrollTo({ top: 0, behavior: "smooth" }); };
  const field = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const note = (key) => (e) => setForm((f) => ({ ...f, notes: { ...f.notes, [key]: e.target.value } }));

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError("");
    try { await savePerfume({ ...form, id: editing || undefined, price: Number(form.price), stock: Number(form.stock) }); setForm(blank); setEditing(null); notify("Catálogo actualizado"); }
    catch (reason) { setError(reason.message || "No se pudo guardar. Revisa las reglas de Firestore."); }
    finally { setBusy(false); }
  };
  const destroy = async (item) => {
    if (!window.confirm("¿Eliminar " + item.name + " del catálogo?")) return;
    try { await deletePerfume(item.id); notify("Perfume eliminado"); }
    catch (reason) { setError(reason.message || "No se pudo eliminar."); }
  };
  const review = async (item) => {
    setError("");
    try { await markSuggestionReviewed(item.userId, item.id); notify("Sugerencia marcada como revisada"); }
    catch (reason) { setError(reason.message || "No se pudo actualizar la sugerencia. Revisa las reglas de Firestore."); }
  };
  const changeOrderStatus = async (item, status) => {
    setError(""); setUpdatingOrder(item.id);
    try { await updateOrderStatus(item.id, status); notify("Estado del pedido actualizado"); }
    catch (reason) { setError(reason.message || "No se pudo actualizar el pedido. Revisa las reglas de Firestore."); }
    finally { setUpdatingOrder(""); }
  };
  const whatsappLink = (item) => {
    let phone = (item.phone || "").replace(/\D/g, "");
    if (phone.length === 8) phone = "506" + phone;
    const message = "Hola " + (item.customerName || "") + ", te contactamos de Perfutico por tu pedido " + item.id + ".";
    return "https://wa.me/" + phone + "?text=" + encodeURIComponent(message);
  };

  return <div className="admin-page">
    <header className="admin-head"><div><small>BACK OFFICE · PERFUTICO</small><h1>Panel de administración</h1><p>Gestiona el catálogo, los pedidos y las sugerencias de tus clientes.</p></div><button className="circle-btn" onClick={onClose} aria-label="Cerrar"><X /></button></header>
    <nav className="admin-tabs" aria-label="Secciones de administración">
      <button className={tab === "catalog" ? "admin-tab active" : "admin-tab"} onClick={() => { setTab("catalog"); setError(""); }}>Catálogo <span>{products.length}</span></button>
      <button className={tab === "inbox" ? "admin-tab active" : "admin-tab"} onClick={() => { setTab("inbox"); setError(""); }}><Mail size={16} /> Sugerencias <span className={pending ? "admin-count has-pending" : "admin-count"}>{pending}</span></button>
      <button className={tab === "orders" ? "admin-tab active" : "admin-tab"} onClick={() => { setTab("orders"); setError(""); }}><ShoppingBag size={16} /> Pedidos <span className={pendingOrders ? "admin-count has-pending" : "admin-count"}>{pendingOrders}</span></button>
    </nav>

    {tab === "orders" ? <section className="admin-orders">
      <div className="orders-heading"><div><small>VENTAS DE PERFUTICO</small><h2>Pedidos <span>{orders.length}</span></h2></div><p>{pendingOrders} pendientes de SINPE</p></div>
      <div className="orders-toolbar"><label htmlFor="order-filter">Filtrar pedidos</label><select id="order-filter" value={orderFilter} onChange={(event) => setOrderFilter(event.target.value)}><option value="todos">Todos los estados</option>{orderStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
      {ordersError && <div className="error-msg">{ordersError}</div>}
      {error && <div className="error-msg">{error}</div>}
      {!ordersError && visibleOrders.length === 0 ? <div className="inbox-empty"><ShoppingBag size={25} /><h3>{orders.length ? "No hay pedidos en este estado" : "Aún no hay pedidos"}</h3><p>Los pedidos confirmados desde la tienda aparecerán aquí para darles seguimiento.</p></div> : <div className="order-list">
        {visibleOrders.map((item) => {
          const statusLabel = orderStatuses.find(([value]) => value === item.status)?.[1] || item.status || "Estado pendiente";
          return <article className="order-card" key={item.id}>
            <header className="order-card-head"><div><small>PEDIDO · {item.id}</small><time>{dateLabel(item.createdAt)}</time></div><span className={"order-status order-status-" + (item.status || "pendiente")}>{statusLabel}</span></header>
            <div className="order-customer"><div><small>CLIENTE</small><strong>{item.customerName}</strong><span>{item.phone}</span></div><div><small>ENTREGA</small><p><MapPin size={14} />{item.address}</p></div></div>
            <a className="order-contact" href={whatsappLink(item)} target="_blank" rel="noreferrer"><Phone size={15} /> Contactar por WhatsApp</a>
            <div className="order-products"><small>PRODUCTOS</small>{(item.items || []).map((product, index) => <div className="order-product-row" key={product.id || index}><span>{product.quantity} × {product.name}</span><b>{money(Number(product.unitPrice || 0) * Number(product.quantity || 0))}</b></div>)}</div>
            <footer className="order-card-foot"><div className="order-total"><span>Total del pedido</span><strong>{money(item.total)}</strong></div><label className="order-status-control">Estado<select value={item.status || "pendiente"} disabled={updatingOrder === item.id} onChange={(event) => changeOrderStatus(item, event.target.value)}>{orderStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></footer>
          </article>;
        })}
      </div>}
    </section> : tab === "inbox" ? <section className="admin-inbox">
      <div className="inbox-heading"><div><small>BUZÓN DE CLIENTES</small><h2>Sugerencias <span>{suggestions.length}</span></h2></div><p>{pending} por revisar</p></div>
      {suggestionsError && <div className="error-msg">{suggestionsError}</div>}
      {error && <div className="error-msg">{error}</div>}
      {!suggestionsError && suggestions.length === 0 ? <div className="inbox-empty"><Mail size={25} /><h3>Aún no hay sugerencias</h3><p>Los mensajes enviados desde el buzón de los perfiles aparecerán aquí.</p></div> : <div className="suggestion-list">
        {suggestions.map((item) => <article className={item.status === "revisada" ? "suggestion-card is-reviewed" : "suggestion-card"} key={item.id}>
          <div className="suggestion-meta"><span className="suggestion-author">{item.displayName || item.email || ("Cuenta " + (item.userId || "").slice(0, 8))}</span><span className={item.status === "revisada" ? "suggestion-status reviewed" : "suggestion-status"}>{item.status === "revisada" ? <Check size={13} /> : <Clock3 size={13} />}{item.status === "revisada" ? "Revisada" : "Nueva"}</span></div>
          <time>{dateLabel(item.createdAt)}</time>
          <p className="suggestion-message">{item.text}</p>
          {item.email && <a className="suggestion-email" href={"mailto:" + item.email}>{item.email}</a>}
          {item.status !== "revisada" && <button className="review-button" onClick={() => review(item)}><Check size={15} /> Marcar como revisada</button>}
        </article>)}
      </div>}
    </section> : <div className="admin-grid">
      <form className="admin-card admin-form" onSubmit={submit}>
        <div className="admin-card-head"><div><small>{editing ? "EDITAR PERFUME" : "NUEVA REFERENCIA"}</small><h2>{editing ? form.name : "Añadir al catálogo"}</h2></div><Plus color="#a89161" /></div>
        {error && <p className="error-msg">{error}</p>}
        <div className="form-row"><label>Nombre<input required value={form.name} onChange={field("name")} /></label><label>Marca<input required value={form.brand} onChange={field("brand")} /></label></div>
        <div className="form-row"><label>Precio CRC<input required type="number" min="0" value={form.price} onChange={field("price")} /></label><label>Volumen<input required value={form.volume} onChange={field("volume")} /></label></div>
        <div className="form-row"><label>Género<select value={form.category} onChange={field("category")}><option value="hombre">Hombre</option><option value="mujer">Mujer</option><option value="unisex">Unisex</option></select></label><label>Stock<input required type="number" min="0" value={form.stock} onChange={field("stock")} /></label></div>
        <label>Imagen · URL<input type="url" value={form.image} onChange={field("image")} /></label><label>Descripción<textarea rows="3" value={form.description} onChange={field("description")} /></label>
        <small>NOTAS OLFATIVAS</small><div className="form-row three">{[["top", "Salida"], ["heart", "Corazón"], ["base", "Fondo"]].map(([key, label]) => <label key={key}>{label}<input value={form.notes[key]} onChange={note(key)} /></label>)}</div>
        <div className="admin-buttons"><button className="primary" disabled={busy}>{busy ? "Guardando…" : editing ? "Guardar cambios" : "Añadir perfume"}</button>{editing && <button type="button" className="secondary" onClick={() => { setForm(blank); setEditing(null); }}>Cancelar</button>}</div>
      </form>
      <section className="admin-card"><div className="admin-card-head"><div><small>INVENTARIO</small><h2>Perfumes <span>({products.length})</span></h2></div></div>
        <div className="inventory">{products.map((item) => <div className="inventory-row" key={item.id}><img src={item.image} alt="" /><div><strong>{item.name}</strong><small>{item.brand} · {item.volume}</small></div><div className="inventory-price">{money(item.price)}<small>{item.stock || 0} unid.</small></div><button className="circle-btn" onClick={() => edit(item)} aria-label={"Editar " + item.name}><Pencil size={15} /></button><button className="circle-btn" onClick={() => destroy(item)} aria-label={"Eliminar " + item.name}><Trash2 size={15} /></button></div>)}</div>
        <p className="fine-print">Firestore aplica el rol de administrador en cada operación.</p>
      </section>
    </div>}
  </div>;
}
