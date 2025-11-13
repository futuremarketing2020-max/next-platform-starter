'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, addDoc, query, orderBy } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, Users, ShoppingCart, TrendingUp, Send, Download } from 'lucide-react';

interface Customer {
  id: string;
  email: string;
  name: string;
  totalSpent: number;
  createdAt: string;
  purchases: any[];
}

export default function AdminPanel() {
  const [user, setUser] = useState<any>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [sending, setSending] = useState(false);
  const router = useRouter();

  // Check if user is admin (you'll need to set this up in Firebase)
  const ADMIN_EMAIL = 'charles@remissio.app'; // Admin email

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && currentUser.email === ADMIN_EMAIL) {
        setUser(currentUser);
        await loadCustomers();
        setLoading(false);
      } else {
        router.push('/dashboard');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const loadCustomers = async () => {
    const customersRef = collection(db, 'customers');
    const q = query(customersRef, orderBy('createdAt', 'desc'));
    const customersSnap = await getDocs(q);
    
    const customersList = customersSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Customer[];
    
    setCustomers(customersList);
  };

  const sendBroadcast = async () => {
    if (!broadcastTitle || !broadcastMessage) {
      alert('Please fill in all fields');
      return;
    }

    setSending(true);

    try {
      // Save announcement to Firestore
      await addDoc(collection(db, 'announcements'), {
        title: broadcastTitle,
        message: broadcastMessage,
        createdAt: new Date().toISOString(),
      });

      // Send emails to all customers
      const response = await fetch('/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: broadcastTitle,
          message: broadcastMessage,
          recipients: customers.map(c => c.email),
        }),
      });

      if (response.ok) {
        alert('Broadcast sent successfully!');
        setBroadcastTitle('');
        setBroadcastMessage('');
        setShowBroadcast(false);
      } else {
        alert('Failed to send broadcast');
      }
    } catch (error) {
      console.error('Broadcast error:', error);
      alert('Error sending broadcast');
    } finally {
      setSending(false);
    }
  };

  const exportCustomers = () => {
    const csv = [
      ['Email', 'Name', 'Total Spent', 'Purchases', 'Created At'].join(','),
      ...customers.map(c => [
        c.email,
        c.name || '',
        c.totalSpent,
        c.purchases.length,
        new Date(c.createdAt).toLocaleDateString(),
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Calculate analytics
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const totalCustomers = customers.length;
  const avgOrderValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
  const bundleBuyers = customers.filter(c => c.purchases.length > 1).length;
  const bundleConversion = totalCustomers > 0 ? (bundleBuyers / totalCustomers) * 100 : 0;

  // Chart data (sales by day)
  const salesByDay = customers.reduce((acc, customer) => {
    const date = new Date(customer.createdAt).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = { date, sales: 0, revenue: 0 };
    }
    acc[date].sales += 1;
    acc[date].revenue += customer.totalSpent;
    return acc;
  }, {} as Record<string, any>);

  const chartData = Object.values(salesByDay).slice(-7); // Last 7 days

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBroadcast(!showBroadcast)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
              >
                <Send size={16} />
                Send Broadcast
              </button>
              <button
                onClick={exportCustomers}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition"
              >
                <Download size={16} />
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Broadcast Modal */}
        {showBroadcast && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
              <h2 className="text-2xl font-bold mb-4">Send Broadcast Message</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Update: New Bonuses Available!"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Your message here..."
                  />
                </div>

                <p className="text-sm text-gray-600">
                  This will be sent to <strong>{customers.length} customers</strong>
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={sendBroadcast}
                    disabled={sending}
                    className="flex-1 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition disabled:opacity-50"
                  >
                    {sending ? 'Sending...' : 'Send to All Customers'}
                  </button>
                  <button
                    onClick={() => setShowBroadcast(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Revenue</h3>
              <DollarSign className="text-green-500" size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-1">All time</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Customers</h3>
              <Users className="text-blue-500" size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalCustomers}</p>
            <p className="text-sm text-gray-500 mt-1">Book buyers</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Avg Order Value</h3>
              <ShoppingCart className="text-purple-500" size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-900">${avgOrderValue.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-1">Per customer</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Bundle Conversion</h3>
              <TrendingUp className="text-orange-500" size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-900">{bundleConversion.toFixed(1)}%</p>
            <p className="text-sm text-gray-500 mt-1">{bundleBuyers} of {totalCustomers}</p>
          </div>
        </div>

        {/* Sales Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Sales (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="#f97316" name="Revenue ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Customers Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Recent Customers</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Spent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Products
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {customer.name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">{customer.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-green-600">
                        ${customer.totalSpent.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {customer.purchases.length === 1 ? 'Book Only' : 'Ultimate Bundle'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
