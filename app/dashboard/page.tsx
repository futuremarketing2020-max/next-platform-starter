'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Download, Bell, User, LogOut } from 'lucide-react';

interface CustomerData {
  email: string;
  name: string;
  purchases: any[];
  totalSpent: number;
  createdAt: string;
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  createdAt: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // Fetch customer data
        const customerRef = doc(db, 'customers', currentUser.uid);
        const customerSnap = await getDoc(customerRef);
        
        if (customerSnap.exists()) {
          setCustomerData(customerSnap.data() as CustomerData);
        }

        // Fetch announcements
        const announcementsRef = collection(db, 'announcements');
        const q = query(announcementsRef, orderBy('createdAt', 'desc'), limit(5));
        const announcementsSnap = await getDocs(q);
        
        const announcementsList = announcementsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Announcement[];
        
        setAnnouncements(announcementsList);
        setLoading(false);
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="Me vs Me" className="h-10" />
              <h1 className="text-2xl font-bold text-gray-900">UC Warrior Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{customerData?.email}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-8 text-white mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {customerData?.name || 'UC Warrior'}!</h2>
          <p className="text-orange-100">Your resources are ready to download below.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Downloads Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Download size={24} className="text-orange-500" />
                Your Downloads
              </h3>
              
              <div className="space-y-3">
                <a
                  href="https://firebasestorage.googleapis.com/v0/b/mevsme-uc-funnel.appspot.com/o/Me%20vs%20Me%20My%20Battle%20With%20UC.pdf?alt=media"
                  target="_blank"
                  className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      📖
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Me vs Me: My Battle With UC</p>
                      <p className="text-sm text-gray-500">Main book (PDF)</p>
                    </div>
                  </div>
                  <Download size={20} className="text-gray-400" />
                </a>

                <a
                  href="https://firebasestorage.googleapis.com/v0/b/mevsme-uc-funnel.appspot.com/o/7-DAY%20UC%20CONTROL%20QUICK%20START.pdf?alt=media"
                  target="_blank"
                  className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      🚀
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">7-Day UC Control Quick Start</p>
                      <p className="text-sm text-gray-500">Bonus #1 (PDF)</p>
                    </div>
                  </div>
                  <Download size={20} className="text-gray-400" />
                </a>

                <a
                  href="https://firebasestorage.googleapis.com/v0/b/mevsme-uc-funnel.appspot.com/o/UC%20FOOD%20TRIGGER%20CHECKLIST.pdf?alt=media"
                  target="_blank"
                  className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      📋
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">UC Food Trigger Checklist</p>
                      <p className="text-sm text-gray-500">Bonus #2 (PDF)</p>
                    </div>
                  </div>
                  <Download size={20} className="text-gray-400" />
                </a>

                <a
                  href="https://firebasestorage.googleapis.com/v0/b/mevsme-uc-funnel.appspot.com/o/UC%20TRACKING%20TEMPLATE.pdf?alt=media"
                  target="_blank"
                  className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      📊
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">UC Tracking Template</p>
                      <p className="text-sm text-gray-500">Bonus #3 (PDF)</p>
                    </div>
                  </div>
                  <Download size={20} className="text-gray-400" />
                </a>

                {/* Ultimate Bundle Bonuses */}
                {customerData && customerData.purchases.length > 1 && (
                  <>
                    <div className="border-t border-gray-200 my-6 pt-4">
                      <p className="text-lg font-bold text-orange-600 mb-3">🎁 Ultimate Bundle Bonuses:</p>
                    </div>
                    
                    <a
                      href="https://firebasestorage.googleapis.com/v0/b/mevsme-uc-funnel.appspot.com/o/Advanced%20UC%20Tracking%20System.pdf?alt=media"
                      target="_blank"
                      className="flex items-center justify-between p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition border-2 border-orange-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-200 rounded-lg flex items-center justify-center">
                          📊
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Advanced UC Tracking System</p>
                          <p className="text-sm text-orange-700">90-Day Journal + Food Database + Worksheets</p>
                        </div>
                      </div>
                      <Download size={20} className="text-orange-600" />
                    </a>

                    <a
                      href="https://firebasestorage.googleapis.com/v0/b/mevsme-uc-funnel.appspot.com/o/Emergency%20Flare%20Protocol.pdf?alt=media"
                      target="_blank"
                      className="flex items-center justify-between p-4 bg-red-50 hover:bg-red-100 rounded-lg transition border-2 border-red-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-200 rounded-lg flex items-center justify-center">
                          🚨
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Emergency Flare Protocol</p>
                          <p className="text-sm text-red-700">Crisis Guide + Safe Foods + Action Steps</p>
                        </div>
                      </div>
                      <Download size={20} className="text-red-600" />
                    </a>

                    <a
                      href="https://firebasestorage.googleapis.com/v0/b/mevsme-uc-funnel.appspot.com/o/Get%20Better%20Care%20at%20Your%20Appointments.pdf?alt=media"
                      target="_blank"
                      className="flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition border-2 border-blue-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center">
                          👨⚕️
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Doctor Visit Prep Sheet</p>
                          <p className="text-sm text-blue-700">Maximize Your Appointments + Track Results</p>
                        </div>
                      </div>
                      <Download size={20} className="text-blue-600" />
                    </a>

                    {/* Meditation Videos - Coming Soon */}
                    <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-purple-200 rounded-lg flex items-center justify-center">
                          🧘
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Stress Management Video Series</p>
                          <p className="text-sm text-purple-700">5 Guided Meditation Videos (10 min each)</p>
                        </div>
                      </div>
                      <p className="text-sm text-purple-800 bg-purple-100 px-3 py-2 rounded">
                        ⏳ <strong>Coming Soon!</strong> Your meditation videos are being finalized. You'll receive an email when they're ready to watch.
                      </p>
                    </div>

                    {/* Signed Paperback Notice */}
                    <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200 mt-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-green-200 rounded-lg flex items-center justify-center">
                          📚
                        </div>
                        <p className="font-semibold text-gray-900">Signed Paperback</p>
                      </div>
                      <p className="text-sm text-green-800">
                        Your personally signed copy is being prepared and will ship within 3-5 business days. You'll receive tracking info via email.
                      </p>
                    </div>

                    {/* 30-Day Email Series Notice */}
                    <div className="p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200 mt-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-yellow-200 rounded-lg flex items-center justify-center">
                          📧
                        </div>
                        <p className="font-semibold text-gray-900">30-Day Mindset Email Series</p>
                      </div>
                      <p className="text-sm text-yellow-800">
                        Starting tomorrow, you'll receive daily mindset and motivation emails from Charles for 30 days. Check your inbox!
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Announcements */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Bell size={24} className="text-orange-500" />
                Updates from Charles
              </h3>
              
              {announcements.length > 0 ? (
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <div key={announcement.id} className="border-l-4 border-orange-500 pl-4 py-2">
                      <p className="font-semibold text-gray-900 mb-1">{announcement.title}</p>
                      <p className="text-sm text-gray-600 mb-2">{announcement.message}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(announcement.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No announcements yet. Check back soon!</p>
              )}
            </div>

            {/* Social Links */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Connect With Me</h3>
              <div className="space-y-3">
                <a
                  href="https://www.facebook.com/mevsmeuc/"
                  target="_blank"
                  className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                >
                  <span className="text-2xl">📘</span>
                  <span className="font-medium text-blue-900">Facebook</span>
                </a>
                <a
                  href="https://www.instagram.com/mevsmeuc/"
                  target="_blank"
                  className="flex items-center gap-3 p-3 bg-pink-50 hover:bg-pink-100 rounded-lg transition"
                >
                  <span className="text-2xl">📸</span>
                  <span className="font-medium text-pink-900">Instagram</span>
                </a>
                <a
                  href="https://www.tiktok.com/@mevsmeuc"
                  target="_blank"
                  className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
                >
                  <span className="text-2xl">🎵</span>
                  <span className="font-medium text-gray-900">TikTok</span>
                </a>
              </div>
            </div>

            {/* Account Stats */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Your Account</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Member Since:</span>
                  <span className="font-semibold">
                    {customerData && new Date(customerData.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Spent:</span>
                  <span className="font-semibold text-green-600">
                    ${customerData?.totalSpent.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Products:</span>
                  <span className="font-semibold">
                    {customerData?.purchases.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-gray-500">
          <p>&copy; 2025 Me vs Me UC. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
