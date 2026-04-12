'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Newspaper, Plus } from 'lucide-react';
import { DataTable } from '@/components/admin/DataTable';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import type { Post } from '@/types/database';

const statusLabels: Record<string, { label: string; color: string }> = {
  true: { label: 'Publié', color: 'bg-green-100 text-green-800' },
  false: { label: 'Brouillon', color: 'bg-gray-100 text-gray-800' },
};

export default function NewsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const supabase = createClient();

  useEffect(() => {
    async function fetchPosts() {
      try {
        const { data } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false });
        setPosts(data || []);
        setFilteredPosts(data || []);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, [supabase]);

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredPosts(posts);
    } else {
      const isPublished = statusFilter === 'published';
      setFilteredPosts(
        posts.filter((post) => post.is_published === isPublished)
      );
    }
  }, [statusFilter, posts]);

  const rows = filteredPosts.map((post) => [
    post.title,
    <span
      key={`status-${post.id}`}
      className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
        post.is_published
          ? statusLabels.true.color
          : statusLabels.false.color
      }`}
    >
      {post.is_published ? 'Publié' : 'Brouillon'}
    </span>,
    post.published_at ? formatDate(post.published_at) : formatDate(post.created_at),
  ]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-stone-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
            <Newspaper className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Gestion des actualités</h1>
            <p className="text-sm text-stone-600">{filteredPosts.length} article(s)</p>
          </div>
        </div>
        <Link
          href="#"
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Nouvel article
        </Link>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
            statusFilter === 'all'
              ? 'bg-green-700 text-white'
              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
          }`}
        >
          Tous
        </button>
        <button
          onClick={() => setStatusFilter('published')}
          className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
            statusFilter === 'published'
              ? 'bg-green-600 text-white'
              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
          }`}
        >
          Publiés
        </button>
        <button
          onClick={() => setStatusFilter('draft')}
          className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
            statusFilter === 'draft'
              ? 'bg-gray-600 text-white'
              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
          }`}
        >
          Brouillons
        </button>
      </div>

      {/* Posts Table */}
      <div className="bg-white rounded-lg border border-stone-200 p-6 shadow-sm">
        <DataTable
          headers={['Titre', 'Statut', 'Date']}
          rows={rows}
        />
      </div>
    </div>
  );
}
