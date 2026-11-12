/* ============================================================
   EVANA CHIC – store settings + starter products
   The admin page (admin.html) replaces these starter items with
   your real categories, boxes and pictures.
   ============================================================ */

const CURRENCY = '$';
const DELIVERY_FEE = 5;                 // flat delivery fee added to every order
const WHATSAPP_NUMBER = '96171102868';  // WhatsApp number (country code, no + or spaces) - receipts are sent here
const WHISH_NUMBER = '71102868';        // customers send the total on the Whish app to this number

/* Social links - paste your page addresses between the quotes. Empty = icon hidden. */
const FACEBOOK_URL = '';                // e.g. 'https://www.facebook.com/yourpage'
const INSTAGRAM_URL = '';               // e.g. 'https://www.instagram.com/yourpage'

/* Starting choices for every product (you can change them per product in the admin page) */
const DEFAULT_OPTIONS = ['1','2','3','4','5','6','7','8','9','10'];
const DEFAULT_SIZES = ['S','M','L','XL'];

/* Placeholder photo maker (used until you upload real pictures) */
function ph(label, n) {
  const svg =
    "<svg xmlns='http://www.w3.org/2000/svg' width='600' height='800'>" +
    "<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>" +
    "<stop offset='0' stop-color='#232323'/><stop offset='1' stop-color='#000'/></linearGradient></defs>" +
    "<rect width='600' height='800' fill='url(#g)'/>" +
    "<rect x='24' y='24' width='552' height='752' fill='none' stroke='#c9a24b' stroke-width='2'/>" +
    "<text x='300' y='390' fill='#d4af37' font-family='Georgia,serif' font-size='34' text-anchor='middle'>" + label + "</text>" +
    "<text x='300' y='440' fill='#8a6d1f' font-family='Georgia,serif' font-size='26' text-anchor='middle'>" + (n ? 'photo ' + n : '') + "</text>" +
    "</svg>";
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

/* Starter data – "let" because store.js swaps in the admin's saved data */
let CATEGORIES = [
  { name: 'Dresses', images: [ph('Dresses', 1), ph('Dresses', 2)] },
  { name: 'Abayas',  images: [ph('Abayas', 1), ph('Abayas', 2)] },
  { name: 'Shoes',   images: [ph('Shoes', 1), ph('Shoes', 2)] },
  { name: 'Sets',    images: [ph('Sets', 1), ph('Sets', 2)] },
  { name: 'Pyjamas', images: [ph('Pyjamas', 1), ph('Pyjamas', 2)] }
];

let PRODUCTS = [
  { id: 'p1', name: 'Noir Evening Gown', category: 'Dresses', price: 120, isNew: true,
    images: [ph('Noir Gown', 1), ph('Noir Gown', 2), ph('Noir Gown', 3)] },
  { id: 'p2', name: 'Golden Hour Dress', category: 'Dresses', price: 95, isNew: true,
    images: [ph('Golden Dress', 1), ph('Golden Dress', 2), ph('Golden Dress', 3)] },
  { id: 'p3', name: 'Royal Abaya', category: 'Abayas', price: 85, isNew: true,
    images: [ph('Royal Abaya', 1), ph('Royal Abaya', 2)] },
  { id: 'p4', name: 'Satin Pyjama Set', category: 'Pyjamas', price: 55, isNew: true,
    images: [ph('Satin Pyjama', 1), ph('Satin Pyjama', 2)] },
  { id: 'p5', name: 'Velvet Heels', category: 'Shoes', price: 70, isNew: false,
    images: [ph('Velvet Heels', 1), ph('Velvet Heels', 2)] },
  { id: 'p6', name: 'Matching Chic Set', category: 'Sets', price: 90, isNew: true,
    images: [ph('Chic Set', 1), ph('Chic Set', 2), ph('Chic Set', 3)] }
];
