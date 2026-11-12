import { ArrowUpRight, Heart, Plus } from "lucide-react";
export const money = (n) => new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC", maximumFractionDigits: 0 }).format(Number(n) || 0);
export default function ProductCard({ item, liked, onLike, onOpen, onAdd }) {
  return <article className="product-card">
    <div className="product-photo" onClick={() => onOpen(item)}>
      <img src={item.image} alt={item.name} loading="lazy" onError={(e) => { e.currentTarget.style.opacity = "0"; }} />
      <span className="tag">{item.category || "unisex"}</span>
      <button className={"heart" + (liked ? " liked" : "")} aria-label="Favorito" onClick={(e) => { e.stopPropagation(); onLike(item); }}><Heart size={16} fill={liked ? "currentColor" : "none"} /></button>
      <span className="peek">Ver perfume <ArrowUpRight size={14} /></span>
    </div>
    <div className="product-meta"><small>{item.brand}</small><button className="product-name" onClick={() => onOpen(item)}>{item.name}</button>
      <div className="product-price"><span>{item.volume || "100 ml"}</span><strong>{money(item.price)}</strong></div>
      <p className="card-notes" title={"Salida: " + (item.notes?.top || "—") + "; corazón: " + (item.notes?.heart || "—") + "; fondo: " + (item.notes?.base || "—")}>{[item.notes?.top, item.notes?.heart, item.notes?.base].filter(Boolean).join(" · ") || "Notas de autor"}</p>
      <button className="add-line" disabled={Number(item.stock) === 0} onClick={() => onAdd(item)}><span>{Number(item.stock) === 0 ? "Agotado" : "Añadir al carrito"}</span><Plus size={15} /></button>
    </div>
  </article>;
}
