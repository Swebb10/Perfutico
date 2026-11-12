import { addDoc, collection, collectionGroup, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

export const samples = [
  { id: "sample-jazz", name: "Jazz Club", brand: "Maison Margiela", volume: "100 ml", category: "hombre", price: 89500, stock: 8, image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=900&q=85", description: "Una noche íntima entre madera pulida y música que se queda contigo. Cálida, envolvente y con carácter.", notes: { top: "Pimienta rosa, limón", heart: "Ron, salvia", base: "Tabaco, vainilla" }, featured: true },
  { id: "sample-blanche", name: "Blanche", brand: "Byredo", volume: "100 ml", category: "mujer", price: 118000, stock: 5, image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=900&q=85", description: "La textura de una camisa blanca recién planchada, traducida en perfume: limpia, luminosa y floral.", notes: { top: "Aldehídos, rosa", heart: "Peonía, violeta", base: "Maderas claras, almizcle" }, featured: true },
  { id: "sample-santal", name: "Santal 33", brand: "Le Labo", volume: "100 ml", category: "unisex", price: 139000, stock: 4, image: "https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&w=900&q=85", description: "Sándalo, cuero y aire abierto. Una firma olfativa libre que se siente familiar desde la primera vez.", notes: { top: "Cardamomo, violeta", heart: "Sándalo, cedro", base: "Cuero, ámbar" } },
  { id: "sample-philosykos", name: "Philosykos", brand: "Diptyque", volume: "75 ml", category: "unisex", price: 92000, stock: 7, image: "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?auto=format&fit=crop&w=900&q=85", description: "Un paseo bajo una higuera mediterránea. Verde, cremoso y fresco, como un verano junto al mar.", notes: { top: "Hojas de higuera", heart: "Madera de higuera", base: "Coco, cedro" } },
  { id: "sample-oud", name: "Oud Wood", brand: "Tom Ford", volume: "50 ml", category: "hombre", price: 126000, stock: 3, image: "https://images.unsplash.com/photo-1590736969955-71cc94901144?auto=format&fit=crop&w=900&q=85", description: "Oud con maderas preciosas y especias suaves. Oscura, elegante y sorprendentemente cercana.", notes: { top: "Pimienta, cardamomo", heart: "Oud, sándalo", base: "Ámbar, tonka" } },
  { id: "sample-wood-sage", name: "Wood Sage & Sea Salt", brand: "Jo Malone London", volume: "100 ml", category: "unisex", price: 84000, stock: 9, image: "https://images.unsplash.com/photo-1590156221891-3dbfaae81b35?auto=format&fit=crop&w=900&q=85", description: "La costa en un día despejado: sal marina, hierbas aromáticas y una brisa mineral.", notes: { top: "Ambreta, sal marina", heart: "Salvia", base: "Maderas flotantes" }, featured: true },
];

export function watchProducts(next) {
  if (!db) { next(samples); return () => {}; }
  return onSnapshot(collection(db, "products"), (snap) => next(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), () => next([]));
}
export function watchFavorites(uid, next) {
  if (!db || !uid) { next([]); return () => {}; }
  return onSnapshot(collection(db, "users", uid, "favorites"), (snap) => next(snap.docs.map((d) => d.id)));
}
export function favorite(uid, productId, enabled) {
  if (!db) throw new Error("Conecta Firebase para guardar favoritos.");
  const ref = doc(db, "users", uid, "favorites", productId);
  return enabled ? setDoc(ref, { productId, createdAt: serverTimestamp() }) : deleteDoc(ref);
}
export function savePerfume(input) {
  if (!db) throw new Error("Conecta Firebase para gestionar el catálogo.");
  const { id, ...data } = input;
  return id ? setDoc(doc(db, "products", id), { ...data, updatedAt: serverTimestamp() }, { merge: true }) : addDoc(collection(db, "products"), { ...data, createdAt: serverTimestamp() });
}
export function deletePerfume(id) {
  if (!db) throw new Error("Conecta Firebase para gestionar el catálogo.");
  return deleteDoc(doc(db, "products", id));
}
export function createOrder(order) {
  if (!db) throw new Error("Firebase aún no está configurado.");
  return addDoc(collection(db, "orders"), { ...order, status: "pendiente", createdAt: serverTimestamp() });
}
export function watchSuggestions(next, onError) {
  if (!db) { next([]); return () => {}; }
  const suggestionsQuery = query(collectionGroup(db, "suggestions"), orderBy("createdAt", "desc"));
  return onSnapshot(
    suggestionsQuery,
    (snapshot) => next(snapshot.docs.map((item) => ({
      id: item.id,
      userId: item.ref.parent.parent?.id || item.data().userId || "",
      ...item.data(),
    }))),
    (error) => onError?.(error),
  );
}
export function markSuggestionReviewed(userId, suggestionId) {
  if (!db || !userId) throw new Error("No se pudo identificar la cuenta de la sugerencia.");
  return updateDoc(doc(db, "users", userId, "suggestions", suggestionId), {
    status: "revisada",
    reviewedAt: serverTimestamp(),
  });
}
export function sendSuggestion(uid, text, userInfo = {}) {
  if (!db || !uid) throw new Error("Conecta Firebase e inicia sesión para enviar una sugerencia.");
  return addDoc(collection(db, "users", uid, "suggestions"), {
    text: text.trim(),
    status: "nueva",
    userId: uid,
    email: userInfo.email || "",
    displayName: userInfo.displayName || "",
    createdAt: serverTimestamp(),
  });
}
