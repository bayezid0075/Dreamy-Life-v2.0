import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import AuroraBackground from '@/shared/components/AuroraBackground';
import TopBar from '@/shared/components/TopBar';
import GlassPanel from '@/shared/components/GlassPanel';
import { useI18n } from '@/shared/i18n';
import { resolveMediaUrl } from '@/shared/utils/resolveMediaUrl';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

interface Job {
  id: string;
  posterId: string;
  title: string;
  description: string;
  type: 'single' | 'multiple';
  amount: string;
  unitPay: string;
  totalUnits: number;
  filledUnits: number;
  status: string;
  mediaUrls: string[];
  createdAt: string;
  posterUsername: string;
  posterFullName?: string;
  posterAvatarUrl?: string;
}

export default function MarketplaceScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'available' | 'posted' | 'assigned'>('available');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [postedJobs, setPostedJobs] = useState<Job[]>([]);
  const [assignedJobs, setAssignedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    AsyncStorage.getItem('accessToken').then((t) => {
      setToken(t);
      if (t) fetchAll(t);
      else setLoading(false);
    });
  }, []);

  const fetchAll = async (t: string) => {
    setLoading(true);
    try {
      const [jobsRes, postedRes, submissionsRes] = await Promise.all([
        fetch(`${API_URL}/marketplace/jobs/available`, { headers: { Authorization: `Bearer ${t}` } }),
        fetch(`${API_URL}/marketplace/jobs/posted`, { headers: { Authorization: `Bearer ${t}` } }),
        fetch(`${API_URL}/marketplace/jobs/my-submissions`, { headers: { Authorization: `Bearer ${t}` } }),
      ]);

      if (jobsRes.ok) {
        const data = await jobsRes.json();
        setJobs(data.jobs || data || []);
      }
      if (postedRes.ok) {
        const data = await postedRes.json();
        setPostedJobs(data.jobs || []);
      }
      if (submissionsRes.ok) {
        const data = await submissionsRes.json();
        setAssignedJobs(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch marketplace data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (token) fetchAll(token);
  };

  const filteredJobs = jobs.filter((j) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return j.title.toLowerCase().includes(q) || j.description.toLowerCase().includes(q);
  });

  const renderJobItem = ({ item }: { item: Job }) => {
    const remainingUnits = item.totalUnits - item.filledUnits;
    const imageUrl = item.mediaUrls?.[0] ? resolveMediaUrl(item.mediaUrls[0]) : item.posterAvatarUrl ? resolveMediaUrl(item.posterAvatarUrl) : null;
    return (
      <TouchableOpacity
        style={styles.jobCard}
        onPress={() => router.push(`/marketplace/${item.id}`)}
      >
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.jobImage} resizeMode="cover" />
        ) : (
          <View style={styles.jobImagePlaceholder}>
            <Text style={styles.jobImagePlaceholderIcon}>💼</Text>
          </View>
        )}
        <View style={styles.jobContent}>
          <View style={styles.jobHeader}>
            {remainingUnits > 0 && (
              <View style={styles.remainingBadge}>
                <Text style={styles.remainingText}>{remainingUnits} left</Text>
              </View>
            )}
            <Text style={styles.jobAmount}>৳{Number(item.unitPay).toFixed(0)}<Text style={styles.perUnit}>/unit</Text></Text>
          </View>
          <Text style={styles.jobTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.jobDescription} numberOfLines={2}>{item.description}</Text>
          <View style={styles.jobFooter}>
            <Text style={styles.jobPoster}>@{item.posterUsername}</Text>
            <Text style={styles.jobUnits}>{item.filledUnits}/{item.totalUnits} submitted</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPostedItem = ({ item }: { item: Job }) => {
    const imageUrl = item.mediaUrls?.[0] ? resolveMediaUrl(item.mediaUrls[0]) : null;
    return (
      <TouchableOpacity
        style={styles.jobCard}
        onPress={() => router.push(`/marketplace/${item.id}`)}
      >
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.jobImage} resizeMode="cover" />
        ) : null}
        <View style={styles.jobContent}>
          <View style={styles.jobHeader}>
            <View style={[styles.statusBadge, item.status === 'active' && styles.activeBadge]}>
              <Text style={[styles.statusText, item.status === 'active' && styles.activeText]}>
                {item.status.replace('_', ' ')}
              </Text>
            </View>
            <Text style={styles.jobAmount}>৳{Number(item.unitPay).toFixed(0)}<Text style={styles.perUnit}>/unit</Text></Text>
          </View>
          <Text style={styles.jobTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.jobFooter}>
            <Text style={styles.jobUnits}>{item.filledUnits}/{item.totalUnits} submitted</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderAssignedItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.jobCard}
      onPress={() => router.push(`/marketplace/${item.jobId}`)}
    >
      <View style={styles.jobHeader}>
        <View style={[styles.statusBadge, item.status === 'approved' && styles.activeBadge]}>
          <Text style={[styles.statusText, item.status === 'approved' && styles.activeText]}>
            {item.status}
          </Text>
        </View>
        <Text style={styles.jobAmount}>৳{Number(item.jobUnitPay).toFixed(0)}<Text style={styles.perUnit}>/unit</Text></Text>
      </View>
      <Text style={styles.jobTitle} numberOfLines={2}>{item.jobTitle}</Text>
      <View style={styles.jobFooter}>
        <Text style={styles.jobPoster}>@{item.posterUsername}</Text>
      </View>
    </TouchableOpacity>
  );

  const tabs = [
    { key: 'available', label: t('browseJobs') },
    { key: 'posted', label: t('myJobs') },
    { key: 'assigned', label: 'My Submissions' },
  ];

  return (
    <View style={styles.container}>
      <AuroraBackground />
      <TopBar title={t('browseJobs')} showBack showSearch={false} showNotification={false} />

      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key as typeof activeTab)}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'available' && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={t('searchJobs')}
            placeholderTextColor="#76777b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5d5e64" />
        </View>
      ) : (
        <FlatList
          data={activeTab === 'available' ? filteredJobs : activeTab === 'posted' ? postedJobs : assignedJobs}
          keyExtractor={(item) => item.id}
          renderItem={activeTab === 'assigned' ? renderAssignedItem : activeTab === 'posted' ? renderPostedItem : renderJobItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>💼</Text>
              <Text style={styles.emptyText}>
                {activeTab === 'available' && t('noJobsFound')}
                {activeTab === 'posted' && t('noJobsPostedYet')}
                {activeTab === 'assigned' && 'No submissions yet'}
              </Text>
              {activeTab === 'posted' && (
                <TouchableOpacity
                  style={styles.postBtn}
                  onPress={() => router.push('/marketplace/post')}
                >
                  <Text style={styles.postBtnText}>{t('postJob')}</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {activeTab === 'posted' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/marketplace/post')}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8ff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 16, gap: 6, marginTop: 100, marginBottom: 12 },
  tab: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  activeTab: { backgroundColor: '#1c1b1b', borderColor: '#1c1b1b' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#45474b' },
  activeTabText: { color: '#ffffff' },
  searchContainer: { paddingHorizontal: 16, marginBottom: 12 },
  searchInput: {
    backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 9999,
    paddingHorizontal: 20, paddingVertical: 12, fontSize: 15, color: '#1c1b1b',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  jobCard: {
    backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 16, marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', overflow: 'hidden',
  },
  jobImage: { width: '100%', height: 160 },
  jobImagePlaceholder: {
    width: '100%', height: 120,
    backgroundColor: 'rgba(233,253,255,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  jobImagePlaceholderIcon: { fontSize: 36 },
  jobContent: { padding: 16 },
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  remainingBadge: { backgroundColor: '#1c1b1b', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  remainingText: { fontSize: 10, fontWeight: '600', color: '#fff' },
  jobAmount: { fontSize: 18, fontWeight: '700', color: '#2d666d' },
  perUnit: { fontSize: 11, fontWeight: '400', color: '#76777b' },
  jobTitle: { fontSize: 16, fontWeight: '600', color: '#1c1b1b', marginBottom: 4 },
  jobDescription: { fontSize: 13, color: '#45474b', lineHeight: 18, marginBottom: 8 },
  jobFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  jobPoster: { fontSize: 12, color: '#76777b' },
  jobUnits: { fontSize: 12, color: '#76777b' },
  statusBadge: { backgroundColor: '#e5e2e1', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  activeBadge: { backgroundColor: '#e9fdff' },
  statusText: { fontSize: 11, fontWeight: '600', color: '#45474b', textTransform: 'capitalize' },
  activeText: { color: '#2d666d' },
  emptyContainer: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 16, color: '#76777b', textAlign: 'center', lineHeight: 24 },
  postBtn: { marginTop: 16, backgroundColor: '#2d666d', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
  postBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 56, height: 56,
    borderRadius: 28, backgroundColor: '#2d666d', justifyContent: 'center', alignItems: 'center',
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 4,
  },
  fabText: { fontSize: 24, color: '#ffffff', fontWeight: '300' },
});
