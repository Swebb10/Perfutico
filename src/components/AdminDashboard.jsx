import { useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { deletePerfume, savePerfume } from "../lib/shop";
import { money } from "./ProductCard";

const blank = { name: "", brand: "", volume: "100 ml", category: "unisex", price: "", stock: "", image: "", description: "", notes: { top: "", heart: "", base: "" } };
export default function AdminDashboard({ products, onClose, notify }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const edit = (item) => { setEditing(item.id); setForm({ ...blank, ...item, notes: { ...blank.notes, ...(item.notes || {}) } }); setError(""); window.scrollTo(0, 0); };
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
    try { await deletePerfume(item.id); notify("Perfume eliminado"); } catch (reason) { setError(reason.message); }
  };
  return <div className="admin-page"><header className="admin-head"><div><small>BACK OFFICE · PERFUTICO</small><h1>Gestión de catálogo</h1><p>Actualiza la selección de la boutique.</p></div><button className="circle-btn" onClick={onClose} aria-label="Cerrar"><X /></button></header>
    <div className="admin-grid"><form className="admin-card admin-form" onSubmit={submit}><div className="admin-card-head"><div><small>{editing ? "EDITAR PERFUME" : "NUEVA REFERENCIA"}</small><h2>{editing ? form.name : "Añadir al catálogo"}</h2></div><Plus color="#a89161" /></div>
      {error && <p className="error-msg">{error}</p>}
      <div className="form-row"><label>Nombre<input required value={form.name} onChange={field("name")} /></label><label>Marca<input required value={form.brand} onChange={field("brand")} /></label></div>
      <div className="form-row"><label>Precio CRC<input required type="number" min="0" value={form.price} onChange={field("price")} /></label><label>Volumen<input required value={form.volume} onChange={field("volume")} /></label></div>
      <div className="form-row"><label>Género<select value={form.category} onChange={field("category")}><option value="hombre">Hombre</option><option value="mujer">Mujer</option><option value="unisex">Unisex</option></select></label><label>Stock<input required type="number" min="0" value={form.stock} onChange={field("stock")} /></label></div>
      <label>Imagen · URL<input type="url" value={form.image} onChange={field("image")} /></label><label>Descripción<textarea rows="3" value={form.description} onChange={field("description")} /></label>
      <small>NOTAS OLFATIVAS</small><div className="form-row three">{[["top","Salida"],["heart","Corazón"],["base","Fondo"]].map(([key,label]) => <label key={key}>{label}<input value={form.notes[key]} onChange={note(key)} /></label>)}</div>
      <div className="admin-buttons"><button className="primary" disabled={busy}>{busy ? "Guardando…" : editing ? "Guardar cambios" : "Añadir perfume"}</button>{editing && <button type="button" className="secondary" onClick={() => { setForm(blank); setEditing(null); }}>Cancelar</button>}</div>
    </form><section className="admin-card"><div className="admin-card-head"><div><small>INVENTARIO</small><h2>Perfumes <span>({products.length})</span></h2></div></div>
      <div className="inventory">{products.map((item) => <div className="inventory-row" key={item.id}><img src={item.image} alt="" /><div><strong>{item.name}</strong><small>{item.brand} · {item.volume}</small></div><div className="inventory-price">{money(item.price)}<small>{item.stock || 0} unid.</small></div><button className="circle-btn" onClick={() => edit(item)} aria-label="Editar"><Pencil size={15} /></button><button className="circle-btn" onClick={() => destroy(item)} aria-label="Eliminar"><Trash2 size={15} /></button></div>)}</div><p className="fine-print">Firestore aplica el rol de administrador en cada operación.</p>
    </section></div></div>;
}
