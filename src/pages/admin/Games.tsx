import React, { useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Search, Plus, Filter, Edit, Trash2, Eye } from 'lucide-react';

// Mock Data para sa Catalogue Games
const mockGames = [
  { id: "G-101", title: "Elden Ring", category: "Action RPG", developer: "FromSoftware", status: "Published", rating: 4.9, reviews: 1240 },
  { id: "G-102", title: "Cyberpunk 2077", category: "RPG", developer: "CD Projekt Red", status: "Published", rating: 4.5, reviews: 890 },
  { id: "G-103", title: "Hades II", category: "Roguelike", developer: "Supergiant Games", status: "Draft", rating: 0.0, reviews: 0 },
  { id: "G-104", title: "God of War Ragnarök", category: "Action", developer: "Santa Monica Studio", status: "Published", rating: 4.8, reviews: 650 },
  { id: "G-105", title: "Silksong", category: "Metroidvania", developer: "Team Cherry", status: "Archived", rating: 0.0, reviews: 0 },
];

export const Games: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGames = mockGames.filter(game =>
    game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    game.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Catalogue Games</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your game library, edit metadata, and publish new titles.
          </p>
        </div>

        <button className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition shadow-md shadow-purple-600/20">
          <Plus className="w-4 h-4" />
          Add New Game
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#151024] border border-[#261e3b] p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search game title or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#181329] text-xs text-slate-200 pl-9 pr-4 py-2 rounded-lg border border-[#2d2545] focus:outline-none focus:border-purple-500 transition"
          />
        </div>

        <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#1f1a30] text-slate-300 border border-[#372d52] hover:bg-[#2b2442] text-xs px-3.5 py-2 rounded-lg transition">
          <Filter className="w-3.5 h-3.5" />
          Filter
        </button>
      </div>

      {/* Games Table */}
      <div className="bg-[#151024] border border-[#261e3b] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#1c162e] text-slate-400 font-semibold uppercase border-b border-[#261e3b]">
              <tr>
                <th className="px-6 py-3.5">Game ID</th>
                <th className="px-6 py-3.5">Title</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Developer</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Rating</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#261e3b]">
              {filteredGames.map((game) => (
                <tr key={game.id} className="hover:bg-[#1a142c] transition-colors">
                  <td className="px-6 py-4 font-mono text-purple-400 font-medium">{game.id}</td>
                  <td className="px-6 py-4 font-semibold text-white">{game.title}</td>
                  <td className="px-6 py-4">{game.category}</td>
                  <td className="px-6 py-4 text-slate-400">{game.developer}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                      game.status === 'Published' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : game.status === 'Draft'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    }`}>
                      {game.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">{game.rating > 0 ? `⭐ ${game.rating}` : '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 text-slate-400">
                      <button className="p-1.5 hover:text-white hover:bg-[#251e38] rounded-md transition" title="View Details">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 hover:text-purple-300 hover:bg-[#251e38] rounded-md transition" title="Edit">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 hover:text-rose-400 hover:bg-[#251e38] rounded-md transition" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};