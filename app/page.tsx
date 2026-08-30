import Link from 'next/link';

export default function Home() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Security Overview</h1>
        <p className="text-gray-400">Real-time visibility into your organization's cyber risk posture.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface border border-gray-800 p-6 rounded-lg">
          <p className="text-gray-400 text-sm mb-1">Total Assets</p>
          <p className="text-3xl font-bold text-white">54</p>
        </div>
        <div className="bg-surface border border-gray-800 p-6 rounded-lg">
          <p className="text-gray-400 text-sm mb-1">Internet-Facing</p>
          <p className="text-3xl font-bold text-yellow-500">12</p>
        </div>
        <div className="bg-surface border border-gray-800 p-6 rounded-lg">
          <p className="text-gray-400 text-sm mb-1">Critical Vulnerabilities</p>
          <p className="text-3xl font-bold text-red-500">1</p>
        </div>
        <div className="bg-surface border border-gray-800 p-6 rounded-lg">
          <p className="text-gray-400 text-sm mb-1">Active Threats</p>
          <p className="text-3xl font-bold text-orange-500">2</p>
        </div>
      </div>

      <div className="bg-surface border border-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
        <div className="flex gap-4">
          <Link href="/assets/ASSET-001" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition">
            View Payment Server (ASSET-001)
          </Link>
          <Link href="/assets" className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition border border-gray-700">
            Browse All Assets
          </Link>
        </div>
      </div>
    </div>
  );
}
