import {
  IconDashboard, IconBook, IconBorrow, IconReturn, IconVisitor, IconClock,
  IconFood, IconCart, IconLibrarian, IconSeller, IconCard, IconReport,
} from './icons.jsx';

// roles: which roles may see/visit. Empty/undefined = all authenticated
// (including the read-only 'pengunjung'). STAFF = everyone except pengunjung.
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
    ],
  },
];
