import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { itemCategories, categoryGroups, getCategoryById } from '../data/categories';
import { getQuestionsForCategory } from '../data/questions';

export default function IdentifyScreen() {
  const { goTo, session, selectCategory, computeResult } = useApp();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return itemCategories;
    return itemCategories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.group.toLowerCase().includes(q)
    );
  }, [search]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const group of categoryGroups) {
      const items = filtered.filter((c) => c.group === group);
      if (items.length > 0) map.set(group, items);
    }
    return map;
  }, [filtered]);

  const handleSelect = (id: string) => {
    selectCategory(id);
    const cat = getCategoryById(id);
    const qs = getQuestionsForCategory(id);

    if (cat?.skipWizard || qs.length === 0) {
      computeResult();
      goTo('result');
    } else {
      goTo('wizard');
    }
  };

  return (
    <div className="min-h-full flex flex-col bg-airport-light">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 pt-12 pb-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => goTo('camera')}
              className="text-sm font-medium text-slate-500 hover:text-slate-700"
            >
              ← Back
            </button>
          </div>

          {session.photoUrl && (
            <div className="mb-4 flex items-center gap-3">
              <img
                src={session.photoUrl}
                alt="Your item"
                className="w-14 h-14 rounded-xl object-cover border border-slate-200"
              />
              <p className="text-sm text-slate-500">Your captured item</p>
            </div>
          )}

          <h2 className="text-xl font-bold text-slate-800 mb-3">What is this item?</h2>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-100 text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-airport-blue/30"
            />
          </div>
        </div>
      </header>

      {/* Categories */}
      <main className="flex-1 px-4 py-4 max-w-lg mx-auto w-full overflow-y-auto">
        {grouped.size === 0 && (
          <p className="text-center text-slate-400 mt-8 text-sm">
            No matching items found. Try a different search term.
          </p>
        )}

        {Array.from(grouped.entries()).map(([group, items]) => (
          <div key={group} className="mb-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 px-1">
              {group}
            </h3>
            <div className="space-y-1.5">
              {items.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleSelect(cat.id)}
                  className="w-full bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md active:bg-slate-50 transition-all text-left"
                >
                  <span className="text-2xl w-10 text-center flex-shrink-0">{cat.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{cat.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{cat.description}</p>
                  </div>
                  <span className="text-slate-300 text-lg flex-shrink-0">›</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
