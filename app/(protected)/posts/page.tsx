'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const POSTS_API = 'https://localhost:7185/Posts';

const getAuthHeaders = () => {
  const headers: Record<string, string> = {};
  if (typeof window === 'undefined') return headers;
  const token = localStorage.getItem('token');
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

type Post = {
  id: number;
  title?: string;
  content?: string;
  createdAt?: string;
  authorName?: string;
  Title?: string;
  Content?: string;
  CreatedAt?: string;
  AuthorName?: string;
};

function postTitle(p: Post) {
  return p.title ?? p.Title ?? '';
}
function postContent(p: Post) {
  return p.content ?? p.Content ?? '';
}
function postCreatedAt(p: Post) {
  return p.createdAt ?? p.CreatedAt ?? '';
}
function postAuthorName(p: Post) {
  return p.authorName ?? p.AuthorName ?? '';
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

export default function PostsPage() {
  const { t } = useTranslation();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editAuthorName, setEditAuthorName] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        const headers = getAuthHeaders();
        const [countRes, dataRes] = await Promise.all([
          fetch(`${POSTS_API}/count`, { headers }),
          fetch(`${POSTS_API}/paginate?page=1`, { headers }),
        ]);
        if (!countRes.ok || !dataRes.ok) throw new Error(t('failedToFetchPosts'));
        const total: number = await countRes.json();
        const data: Post[] = await dataRes.json();
        const ps = data.length || 1;
        setPageSize(ps);
        setPosts(data);
        setTotalPages(Math.max(1, Math.ceil(total / ps)));
      } catch (err) {
        console.error(err);
        setError(t('failedToLoadPosts'));
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const goToPage = async (page: number) => {
    if (page < 1) return;
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      const [countRes, dataRes] = await Promise.all([
        fetch(`${POSTS_API}/count`, { headers }),
        fetch(`${POSTS_API}/paginate?page=${page}`, { headers }),
      ]);
      if (!countRes.ok || !dataRes.ok) throw new Error(t('failedToFetchPosts'));
      const total: number = await countRes.json();
      const data: Post[] = await dataRes.json();
      const ps = pageSize;
      const newTotalPages = Math.max(1, Math.ceil(total / ps));
      const safePage = Math.min(page, newTotalPages);
      if (safePage < page) {
        const safeRes = await fetch(`${POSTS_API}/paginate?page=${safePage}`, { headers });
        setPosts(await safeRes.json());
        setCurrentPage(safePage);
      } else {
        setPosts(data);
        setCurrentPage(page);
      }
      setTotalPages(newTotalPages);
    } catch (err) {
      console.error(err);
      setError(t('failedToLoadPosts'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <main className="text-slate-800">{t('loadingPosts')}</main>;
  }

  if (error) {
    return <main className="text-red-600">{error}</main>;
  }

  return (
    <main className="min-h-full bg-transparent">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{t('posts')}</h1>
              <p className="text-xs text-gray-500">
                {t('postsSubtitle')}
              </p>
            </div>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
              {t('inTotal', { count: posts.length })}
            </span>
          </div>

          <form
            className="flex flex-col gap-3"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!title.trim() || !content.trim() || !authorName.trim()) return;
              const res = await fetch(POSTS_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({
                  title: title.trim(),
                  content: content.trim(),
                  authorName: authorName.trim(),
                  createdAt: new Date().toISOString(),
                }),
              });
              if (!res.ok) return;
              setTitle('');
              setContent('');
              setAuthorName('');
              await goToPage(currentPage);
            }}
          >
            <input
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-black focus:border-slate-400 focus:ring-0"
              placeholder={t('title')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className="min-h-[80px] rounded-lg border border-slate-200 px-3 py-2 text-sm text-black focus:border-slate-400 focus:ring-0"
              placeholder={t('content')}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <input
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-black focus:border-slate-400 focus:ring-0"
              placeholder={t('authorName')}
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
            />
            <button
              type="submit"
              className="mt-1 inline-flex items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800"
            >
              {t('addPost')}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">
              {t('allPosts')}
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {posts.map((post) => {
              const isEditing = editingId === post.id;
              return (
                <div
                  key={post.id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-black"
                >
                  {isEditing ? (
                    <div className="flex flex-col gap-2">
                      <input
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-black focus:border-slate-400 focus:ring-0"
                        placeholder={t('title')}
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                      />
                      <textarea
                        className="min-h-[60px] rounded-lg border border-slate-200 px-3 py-2 text-sm text-black focus:border-slate-400 focus:ring-0"
                        placeholder={t('content')}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                      />
                      <input
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-black focus:border-slate-400 focus:ring-0"
                        placeholder={t('author')}
                        value={editAuthorName}
                        onChange={(e) => setEditAuthorName(e.target.value)}
                      />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-gray-900 truncate">
                          {postTitle(post)}
                        </span>
                        <span className="shrink-0 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600">
                          {t('idLabel')} {post.id}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {postContent(post)}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {postAuthorName(post)} · {formatDate(postCreatedAt(post))}
                      </p>
                    </>
                  )}

                  <div className="mt-2 flex items-center justify-end gap-2">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-white"
                          onClick={async () => {
                            const currentPostId = post.id;
                            try {
                              const res = await fetch(
                                `${POSTS_API}/${currentPostId}`,
                                {
                                  method: 'PUT',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    ...getAuthHeaders(),
                                  },
                                  body: JSON.stringify({
                                    id: currentPostId,
                                    title: editTitle.trim(),
                                    content: editContent.trim(),
                                    authorName: editAuthorName.trim(),
                                    createdAt: postCreatedAt(post) || new Date().toISOString(),
                                  }),
                                },
                              );
                              if (!res.ok) return;
                              const raw = await res.json();
                              const updated: Post = {
                                id: raw.id ?? raw.Id ?? currentPostId,
                                title: raw.title ?? raw.Title ?? '',
                                content: raw.content ?? raw.Content ?? '',
                                createdAt: raw.createdAt ?? raw.CreatedAt ?? '',
                                authorName: raw.authorName ?? raw.AuthorName ?? '',
                              };
                              setPosts((prev) =>
                                prev.map((p) => {
                                  const pId = p.id ?? (p as { Id?: number }).Id;
                                  return pId === currentPostId ? updated : p;
                                }),
                              );
                            } finally {
                              setEditingId(null);
                            }
                          }}
                        >
                          {t('save')}
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800"
                          onClick={() => setEditingId(null)}
                        >
                          {t('cancel')}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800"
                        onClick={() => {
                          setEditingId(post.id);
                          setEditTitle(postTitle(post));
                          setEditContent(postContent(post));
                          setEditAuthorName(postAuthorName(post));
                        }}
                      >
                        {t('edit')}
                      </button>
                    )}
                    <button
                      type="button"
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-xs text-white"
                      onClick={async () => {
                        const res = await fetch(
                          `${POSTS_API}/${post.id}`,
                          { method: 'DELETE', headers: getAuthHeaders() },
                        );
                        if (!res.ok) return;
                        await goToPage(currentPage);
                      }}
                    >
                      {t('delete')}
                    </button>
                  </div>
                </div>
              );
            })}

            {posts.length === 0 && (
              <div className="col-span-full py-6 text-center text-xs text-gray-500">
                {t('noPostsYet')}
              </div>
            )}

            <div className="col-span-full mt-4 flex items-center justify-center gap-1 border-t border-slate-200 pt-4">
              <button
                type="button"
                className="rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 disabled:opacity-50"
                disabled={currentPage <= 1}
                onClick={() => goToPage(currentPage - 1)}
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`rounded px-2.5 py-1.5 text-sm ${p === currentPage ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                  onClick={() => goToPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                className="rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 disabled:opacity-50"
                disabled={currentPage >= totalPages}
                onClick={() => goToPage(currentPage + 1)}
              >
                ›
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
