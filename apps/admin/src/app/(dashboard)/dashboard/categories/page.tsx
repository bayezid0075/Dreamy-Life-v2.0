'use client';

import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Subcategory {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  productCount?: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  productCount?: number;
  isActive?: boolean;
  subcategories?: Subcategory[];
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupSuccess, setPopupSuccess] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategorySlug, setNewCategorySlug] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);

  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);

  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [newSubcategorySlug, setNewSubcategorySlug] = useState('');
  const [addingSubTo, setAddingSubTo] = useState<string | null>(null);
  const [savingSub, setSavingSub] = useState(false);

  const [editingSub, setEditingSub] = useState<string | null>(null);
  const [editSubName, setEditSubName] = useState('');
  const [editSubSlug, setEditSubSlug] = useState('');
  const [savingEditSub, setSavingEditSub] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const getToken = () => localStorage.getItem('accessToken');

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/categories/all`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data.data) ? data.data : Array.isArray(data.categories) ? data.categories : Array.isArray(data) ? data : [];
        setCategories(items);
      }
    } catch {}
    setLoading(false);
  };

  const showPopup = (success: boolean, message: string) => {
    setPopupSuccess(success);
    setPopupMessage(message);
    setPopupVisible(true);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setAddingCategory(true);
    try {
      const res = await fetch(`${API_URL}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          slug: newCategorySlug.trim() || newCategoryName.trim().toLowerCase().replace(/\s+/g, '-'),
        }),
      });
      if (res.ok) {
        showPopup(true, 'Category created successfully');
        setNewCategoryName('');
        setNewCategorySlug('');
        fetchCategories();
      } else {
        const data = await res.json();
        showPopup(false, data.message || 'Failed to create category');
      }
    } catch {
      showPopup(false, 'Network error');
    }
    setAddingCategory(false);
  };

  const handleUpdateCategory = async (categoryId: string) => {
    if (!editName.trim()) return;
    setSavingCategory(true);
    try {
      const res = await fetch(`${API_URL}/categories/${categoryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          name: editName.trim(),
          slug: editSlug.trim() || editName.trim().toLowerCase().replace(/\s+/g, '-'),
        }),
      });
      if (res.ok) {
        showPopup(true, 'Category updated successfully');
        setEditingCategory(null);
        fetchCategories();
      } else {
        const data = await res.json();
        showPopup(false, data.message || 'Failed to update category');
      }
    } catch {
      showPopup(false, 'Network error');
    }
    setSavingCategory(false);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? This will fail if products use it.')) return;
    try {
      const res = await fetch(`${API_URL}/categories/${categoryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        showPopup(true, 'Category deleted successfully');
        fetchCategories();
      } else {
        const data = await res.json();
        showPopup(false, data.message || 'Failed to delete category. It may have products assigned.');
      }
    } catch {
      showPopup(false, 'Network error');
    }
  };

  const handleAddSubcategory = async (categoryId: string) => {
    if (!newSubcategoryName.trim()) return;
    setSavingSub(true);
    try {
      const res = await fetch(`${API_URL}/categories/${categoryId}/subcategories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          name: newSubcategoryName.trim(),
          slug: newSubcategorySlug.trim() || newSubcategoryName.trim().toLowerCase().replace(/\s+/g, '-'),
        }),
      });
      if (res.ok) {
        showPopup(true, 'Subcategory created successfully');
        setNewSubcategoryName('');
        setNewSubcategorySlug('');
        setAddingSubTo(null);
        fetchCategories();
      } else {
        const data = await res.json();
        showPopup(false, data.message || 'Failed to create subcategory');
      }
    } catch {
      showPopup(false, 'Network error');
    }
    setSavingSub(false);
  };

  const handleUpdateSubcategory = async (subId: string) => {
    if (!editSubName.trim()) return;
    setSavingEditSub(true);
    try {
      const res = await fetch(`${API_URL}/categories/subcategories/${subId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          name: editSubName.trim(),
          slug: editSubSlug.trim() || editSubName.trim().toLowerCase().replace(/\s+/g, '-'),
        }),
      });
      if (res.ok) {
        showPopup(true, 'Subcategory updated successfully');
        setEditingSub(null);
        fetchCategories();
      } else {
        const data = await res.json();
        showPopup(false, data.message || 'Failed to update subcategory');
      }
    } catch {
      showPopup(false, 'Network error');
    }
    setSavingEditSub(false);
  };

  const handleDeleteSubcategory = async (subId: string) => {
    if (!confirm('Are you sure you want to delete this subcategory?')) return;
    try {
      const res = await fetch(`${API_URL}/categories/subcategories/${subId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        showPopup(true, 'Subcategory deleted successfully');
        fetchCategories();
      } else {
        const data = await res.json();
        showPopup(false, data.message || 'Failed to delete subcategory');
      }
    } catch {
      showPopup(false, 'Network error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Category Management</h1>
          <p className="text-on-surface-variant font-body-sm mt-1">Manage product categories and subcategories</p>
        </div>
      </div>

      <div className="glass-panel rounded-xl p-4 border border-outline-variant">
        <h3 className="text-title-sm font-semibold text-primary mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          Add New Category
        </h3>
        <div className="flex flex-col md:flex-row items-start md:items-end gap-3">
          <div className="flex-1 w-full">
            <label className="text-body-sm text-on-surface-variant mb-1 block">Name</label>
            <input
              type="text"
              placeholder="Category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-outline bg-surface text-primary text-sm"
            />
          </div>
          <div className="flex-1 w-full">
            <label className="text-body-sm text-on-surface-variant mb-1 block">Slug (auto-generated if empty)</label>
            <input
              type="text"
              placeholder="category-slug"
              value={newCategorySlug}
              onChange={(e) => setNewCategorySlug(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-outline bg-surface text-primary text-sm"
            />
          </div>
          <button
            onClick={handleAddCategory}
            disabled={addingCategory || !newCategoryName.trim()}
            className="flex items-center gap-1.5 px-6 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #2d666d, #0d9488)' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              {addingCategory ? 'progress_activity' : 'add'}
            </span>
            {addingCategory ? 'Adding...' : 'Add'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : categories.length === 0 ? (
        <div className="glass-panel rounded-xl p-12 text-center border border-outline-variant">
          <span className="material-symbols-outlined text-on-surface-variant mb-3 block" style={{ fontSize: 48 }}>category</span>
          <p className="text-on-surface-variant">No categories found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((category) => {
            const isExpanded = expandedId === category.id;
            const isEditing = editingCategory === category.id;
            return (
              <div key={category.id} className="glass-panel rounded-xl border border-outline-variant overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : category.id)}
                        className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-surface-variant/50 transition-colors flex-shrink-0"
                      >
                        <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 20, transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
                          chevron_right
                        </span>
                      </button>
                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="px-2 py-1 rounded-lg border border-outline bg-surface text-primary text-sm flex-1"
                            placeholder="Name"
                          />
                          <input
                            type="text"
                            value={editSlug}
                            onChange={(e) => setEditSlug(e.target.value)}
                            className="px-2 py-1 rounded-lg border border-outline bg-surface text-primary text-sm flex-1"
                            placeholder="Slug"
                          />
                          <button
                            onClick={() => handleUpdateCategory(category.id)}
                            disabled={savingCategory}
                            className="px-3 py-1 rounded-lg text-xs font-semibold text-white"
                            style={{ background: '#059669' }}
                          >
                            {savingCategory ? '...' : 'Save'}
                          </button>
                          <button
                            onClick={() => setEditingCategory(null)}
                            className="px-3 py-1 rounded-lg text-xs font-semibold border border-outline text-on-surface-variant"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold text-primary">{category.name}</span>
                          <span className="text-body-sm text-on-surface-variant ml-2">/{category.slug}</span>
                        </div>
                      )}
                    </div>

                    {!isEditing && (
                      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                        <span className="text-body-sm text-on-surface-variant">{category.productCount || 0} products</span>
                        <button
                          onClick={() => {
                            setEditingCategory(category.id);
                            setEditName(category.name);
                            setEditSlug(category.slug);
                          }}
                          className="p-1.5 rounded-lg hover:bg-surface-variant/50 text-on-surface-variant transition-colors"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-on-surface-variant transition-colors"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-outline-variant bg-surface-variant/20">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-body-sm font-semibold text-primary">Subcategories</h4>
                        {addingSubTo !== category.id && (
                          <button
                            onClick={() => {
                              setAddingSubTo(category.id);
                              setNewSubcategoryName('');
                              setNewSubcategorySlug('');
                            }}
                            className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-on-surface transition-colors"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span>
                            Add Subcategory
                          </button>
                        )}
                      </div>

                      {addingSubTo === category.id && (
                        <div className="flex items-center gap-2 mb-3 p-3 rounded-lg bg-surface border border-outline-variant">
                          <input
                            type="text"
                            placeholder="Subcategory name"
                            value={newSubcategoryName}
                            onChange={(e) => setNewSubcategoryName(e.target.value)}
                            className="flex-1 px-2 py-1 rounded-lg border border-outline bg-surface text-primary text-sm"
                          />
                          <input
                            type="text"
                            placeholder="Slug"
                            value={newSubcategorySlug}
                            onChange={(e) => setNewSubcategorySlug(e.target.value)}
                            className="flex-1 px-2 py-1 rounded-lg border border-outline bg-surface text-primary text-sm"
                          />
                          <button
                            onClick={() => handleAddSubcategory(category.id)}
                            disabled={savingSub || !newSubcategoryName.trim()}
                            className="px-3 py-1 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                            style={{ background: '#059669' }}
                          >
                            {savingSub ? '...' : 'Add'}
                          </button>
                          <button
                            onClick={() => setAddingSubTo(null)}
                            className="px-3 py-1 rounded-lg text-xs font-semibold border border-outline text-on-surface-variant"
                          >
                            Cancel
                          </button>
                        </div>
                      )}

                      {category.subcategories && category.subcategories.length > 0 ? (
                        <div className="space-y-2">
                          {category.subcategories.map((sub) => (
                            <div key={sub.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface border border-outline-variant">
                              {editingSub === sub.id ? (
                                <div className="flex items-center gap-2 flex-1">
                                  <input
                                    type="text"
                                    value={editSubName}
                                    onChange={(e) => setEditSubName(e.target.value)}
                                    className="px-2 py-1 rounded-lg border border-outline bg-surface text-primary text-sm flex-1"
                                  />
                                  <input
                                    type="text"
                                    value={editSubSlug}
                                    onChange={(e) => setEditSubSlug(e.target.value)}
                                    className="px-2 py-1 rounded-lg border border-outline bg-surface text-primary text-sm flex-1"
                                  />
                                  <button
                                    onClick={() => handleUpdateSubcategory(sub.id)}
                                    disabled={savingEditSub}
                                    className="px-3 py-1 rounded-lg text-xs font-semibold text-white"
                                    style={{ background: '#059669' }}
                                  >
                                    {savingEditSub ? '...' : 'Save'}
                                  </button>
                                  <button
                                    onClick={() => setEditingSub(null)}
                                    className="px-3 py-1 rounded-lg text-xs font-semibold border border-outline text-on-surface-variant"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <div>
                                    <span className="text-sm font-medium text-primary">{sub.name}</span>
                                    <span className="text-body-sm text-on-surface-variant ml-2">/{sub.slug}</span>
                                    {sub.productCount !== undefined && (
                                      <span className="text-body-sm text-on-surface-variant ml-2">({sub.productCount})</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => {
                                        setEditingSub(sub.id);
                                        setEditSubName(sub.name);
                                        setEditSubSlug(sub.slug);
                                      }}
                                      className="p-1.5 rounded-lg hover:bg-surface-variant/50 text-on-surface-variant transition-colors"
                                    >
                                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>edit</span>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteSubcategory(sub.id)}
                                      className="p-1.5 rounded-lg hover:bg-red-50 text-on-surface-variant transition-colors"
                                    >
                                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete</span>
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-body-sm text-on-surface-variant text-center py-3">No subcategories</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {popupVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setPopupVisible(false)}>
          <div className="glass-panel rounded-2xl p-8 text-center max-w-sm w-full mx-4 shadow-2xl border border-outline-variant" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: popupSuccess ? '#d1fae5' : '#fee2e2' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 32, color: popupSuccess ? '#059669' : '#dc2626' }}>
                {popupSuccess ? 'check_circle' : 'error'}
              </span>
            </div>
            <h3 className="text-title-lg font-semibold text-primary mb-2">{popupSuccess ? 'Success' : 'Error'}</h3>
            <p className="text-on-surface-variant mb-4">{popupMessage}</p>
            <button
              onClick={() => setPopupVisible(false)}
              className="px-6 py-2 rounded-lg text-white font-semibold"
              style={{ background: popupSuccess ? '#059669' : '#dc2626' }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
