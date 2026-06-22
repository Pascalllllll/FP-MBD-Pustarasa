import {
  IconDashboard, IconBook, IconBorrow, IconReturn, IconVisitor, IconClock,
  IconFood, IconCart, IconLibrarian, IconSeller, IconCard, IconReport, IconBolt,
} from './icons.jsx';

// roles: who may see this item; empty = everyone incl. 'pengunjung'.
const STAFF = ['admin', 'pustakawan', 'penjual'];

export const NAV_GROUPS = [
  {
    label: null,
    items: [{ to: '/', label: 'Dasbor', icon: IconDashboard, end: true }],
  },
  {
    label: 'Perpustakaan',
    service: 'perpustakaan',
    items: [
      // Katalog visible to pengunjung (read-only — no write buttons render)
      { to: '/buku', label: 'Katalog Buku', icon: IconBook },
      { to: '/peminjaman', label: 'Peminjaman', icon: IconBorrow, roles: ['admin', 'pustakawan'] },
      { to: '/pengembalian', label: 'Pengembalian', icon: IconReturn, roles: ['admin', 'pustakawan'] },
    ],
  },
  {
    label: 'Kunjungan',
    service: 'kunjungan',
    items: [
      { to: '/pengunjung', label: 'Pengunjung', icon: IconVisitor, roles: STAFF },
      { to: '/kunjungan', label: 'Buku Tamu', icon: IconClock, roles: STAFF },
    ],
  },
  {
    label: 'Kantin',
    service: 'kantin',
    items: [
      // Menu visible to pengunjung (read-only)
      { to: '/makanan', label: 'Menu Makanan', icon: IconFood },
      { to: '/pemesanan', label: 'Kasir & Pesanan', icon: IconCart, roles: ['admin', 'penjual'] },
    ],
  },
  {
    label: 'Manajemen',
    service: 'manajemen',
    items: [
      { to: '/pustakawan', label: 'Pustakawan', icon: IconLibrarian, roles: ['admin', 'pustakawan'] },
      { to: '/penjual', label: 'Penjual', icon: IconSeller, roles: ['admin', 'penjual'] },
      { to: '/metode-pembayaran', label: 'Metode Bayar', icon: IconCard, roles: STAFF },
      // Reports visible to pengunjung (read-only analytics)
      { to: '/laporan', label: 'Laporan', icon: IconReport },
      // Read-only function tester, visible to pengunjung too
      { to: '/function', label: 'Uji Function', icon: IconBolt },
      // Procedure/trigger testers write to real tables (trigger auto-rolls back) — admin only
      { to: '/procedure', label: 'Uji Procedure', icon: IconBolt, roles: ['admin'] },
      { to: '/trigger', label: 'Uji Trigger', icon: IconBolt, roles: ['admin'] },
    ],
  },
];
