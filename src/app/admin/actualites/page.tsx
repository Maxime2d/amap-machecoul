'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus } from 'lucide-react';
import { DataTable } from '@/components/admin/DataTable';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
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
      <AdminPageHeader
        title="Actualités"
        subtitle="Gérez les publications de l'AMAP"
        imageUrl="https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=900&q=75"
      />

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
