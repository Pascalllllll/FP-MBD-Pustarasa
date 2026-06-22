import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';
import ToastContainer from './components/ToastContainer.jsx';
import GithubFab from './components/GithubFab.jsx';

import Login from './pages/Login.jsx';
import Creators from './pages/Creators.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Books from './pages/Books.jsx';
import Borrowings from './pages/Borrowings.jsx';
import Returns from './pages/Returns.jsx';
import Visitors from './pages/Visitors.jsx';
import Visits from './pages/Visits.jsx';
import Foods from './pages/Foods.jsx';
import Orders from './pages/Orders.jsx';
import Librarians from './pages/Librarians.jsx';
import Sellers from './pages/Sellers.jsx';
import Payments from './pages/Payments.jsx';
import Reports from './pages/Reports.jsx';
import Functions from './pages/Functions.jsx';

export default function App() {
  return (
    <>
      <ToastContainer />
      <GithubFab />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/kreator" element={<Creators />} />

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="buku" element={<Books />} />
          <Route
            path="peminjaman"
            element={
              <ProtectedRoute roles={['admin', 'pustakawan']}>
                <Borrowings />
              </ProtectedRoute>
            }
          />
          <Route
            path="pengembalian"
            element={
              <ProtectedRoute roles={['admin', 'pustakawan']}>
                <Returns />
              </ProtectedRoute>
            }
          />
          <Route
            path="pengunjung"
            element={
              <ProtectedRoute roles={['admin', 'pustakawan', 'penjual']}>
                <Visitors />
              </ProtectedRoute>
            }
          />
          <Route
            path="kunjungan"
            element={
              <ProtectedRoute roles={['admin', 'pustakawan', 'penjual']}>
                <Visits />
              </ProtectedRoute>
            }
          />
          <Route path="makanan" element={<Foods />} />
          <Route
            path="pemesanan"
            element={
              <ProtectedRoute roles={['admin', 'penjual']}>
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route
            path="pustakawan"
            element={
              <ProtectedRoute roles={['admin', 'pustakawan']}>
                <Librarians />
              </ProtectedRoute>
            }
          />
          <Route
            path="penjual"
            element={
              <ProtectedRoute roles={['admin', 'penjual']}>
                <Sellers />
              </ProtectedRoute>
            }
          />
          <Route
            path="metode-pembayaran"
            element={
              <ProtectedRoute roles={['admin', 'pustakawan', 'penjual']}>
                <Payments />
              </ProtectedRoute>
            }
          />
          <Route path="laporan" element={<Reports />} />
          <Route path="function" element={<Functions />} />
        </Route>

        <Route path="*" element={<Dashboard />} />
      </Routes>
    </>
  );
}
