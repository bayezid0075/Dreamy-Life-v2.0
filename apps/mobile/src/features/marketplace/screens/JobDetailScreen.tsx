import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AuroraBackground from '@/shared/components/AuroraBackground';
import TopBar from '@/shared/components/TopBar';
import { resolveMediaUrl } from '@/shared/utils/resolveMediaUrl';
import { useMarketplaceSocket } from '@/shared/hooks/useMarketplaceSocket';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Job {
  id: string;
  posterId: string;
  title: string;
  description: string;
  type: string;
  amount: string;
  unitPay: string;
  totalUnits: number;
  filledUnits: number;
  status: string;
  adminApproved: boolean;
  mediaUrls: string[];
  link?: string;
  posterUsername: string;
  posterFullName?: string;
  posterAvatarUrl?: string;
  escrow?: any;
  submissions: any[];
  mySubmissions: any[];
  mySubmissionCount: number;
  maxSubmissions: number;
  platformFeePercent: string;
  createdAt: string;
}

interface SelectedFile {
  uri: string;
  name: string;
  type: string;
  size: number;
}

const MAX_FILES = 5;

export default function JobDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [proof, setProof] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const [rejectComment, setRejectComment] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useMarketplaceSocket({
    onJobUpdated: (data: any) => {
      if (data.job?.id === id) fetchJob();
    },
    onNewSubmission: (data: any) => {
      if (data.submission?.jobId === id) fetchJob();
    },
    onSubmissionApproved: (data: any) => {
      if (data.submission?.jobId === id) fetchJob();
    },
    onSubmissionRejected: (data: any) => {
      if (data.submission?.jobId === id) fetchJob();
    },
    onJobCancelled: (data: any) => {
      if (data.job?.id === id) fetchJob();
    },
  });

  useEffect(() => {
    AsyncStorage.getItem('accessToken').then((t) => {
      setToken(t);
      AsyncStorage.getItem('userId').then(setUserId);
      if (t) fetchJob(t);
      else setLoading(false);
    });
  }, [id]);

  const fetchJob = async (t?: string) => {
    const authToken = t || token;
    if (!authToken) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/marketplace/jobs/${id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setJob(data);
      }
    } catch (err) {
      console.error('Failed to fetch job', err);
    } finally {
      setLoading(false);
    }
  };

  const pickFiles = async () => {
    const remaining = MAX_FILES - selectedFiles.length;
    if (remaining <= 0) {
      Alert.alert('Limit', `Maximum ${MAX_FILES} files allowed`);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newFiles: SelectedFile[] = result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.uri.split('/').pop() || 'image.jpg',
        type: asset.mimeType || 'image/jpeg',
        size: asset.fileSize || 0,
      }));
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (files: SelectedFile[]): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as any);
      try {
        const res = await fetch(`${API_URL}/media/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          urls.push(data.url);
        }
      } catch (err) {
        console.error('Upload failed', err);
      }
    }
    return urls;
  };

  const handleSubmitWork = async () => {
    if (!job || !proof.trim()) return;
    setActionLoading('submit');
    try {
      let proofMediaUrls: string[] = [];
      if (selectedFiles.length > 0) {
        setUploadingFiles(true);
        proofMediaUrls = await uploadFiles(selectedFiles);
        setUploadingFiles(false);
      }

      const res = await fetch(`${API_URL}/marketplace/jobs/${job.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ proof: proof.trim(), proofMediaUrls }),
      });
      if (res.ok) {
        setProof('');
        setSelectedFiles([]);
        fetchJob();
      } else {
        const err = await res.json();
        Alert.alert('Error', err.message || 'Failed to submit');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to submit');
    } finally {
      setActionLoading(null);
      setUploadingFiles(false);
    }
  };

  const handleApproveSubmission = async (submissionId: string) => {
    if (!job) return;
    setActionLoading(submissionId);
    try {
      const res = await fetch(`${API_URL}/marketplace/jobs/${job.id}/submissions/${submissionId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchJob();
      } else {
        const err = await res.json();
        Alert.alert('Error', err.message || 'Failed to approve');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to approve');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectSubmission = async () => {
    if (!job || !rejectingId) return;
    setActionLoading(rejectingId);
    try {
      const res = await fetch(`${API_URL}/marketplace/jobs/${job.id}/submissions/${rejectingId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ comment: rejectComment || undefined }),
      });
      if (res.ok) {
        setShowRejectModal(false);
        setRejectComment('');
        setRejectingId(null);
        fetchJob();
      } else {
        const err = await res.json();
        Alert.alert('Error', err.message || 'Failed to reject');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to reject');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelJob = async () => {
    if (!job) return;
    Alert.alert('Cancel Job', 'Are you sure? Funds will be refunded.', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: async () => {
          setActionLoading('cancel');
          try {
            const res = await fetch(`${API_URL}/marketplace/jobs/${job.id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              router.back();
            } else {
              const err = await res.json();
              Alert.alert('Error', err.message || 'Failed to cancel');
            }
          } catch (err) {
            Alert.alert('Error', 'Failed to cancel');
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <AuroraBackground />
        <ActivityIndicator size="large" color="#2d666d" />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.loadingContainer}>
        <AuroraBackground />
        <Text style={{ color: '#45474b' }}>Job not found</Text>
      </View>
    );
  }

  const isPoster = job.posterId === userId;
  const canSubmit = !isPoster && job.status === 'active' && job.adminApproved && job.mySubmissionCount < job.maxSubmissions && !job.mySubmissions?.some((s: any) => s.status === 'pending');
  const pendingSubmissions = job.submissions?.filter((s: any) => s.status === 'pending') || [];
  const remainingUnits = job.totalUnits - job.filledUnits;

  return (
    <View style={styles.container}>
      <AuroraBackground />
      <TopBar title="Job Details" showBack onBack={() => router.back()} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Job Images */}
        {job.mediaUrls && job.mediaUrls.length > 0 && (
          <View style={styles.imageSlider}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                setCurrentSlide(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH));
              }}
            >
              {job.mediaUrls.map((url, i) => (
                <TouchableOpacity key={i} onPress={() => setLightboxUrl(url)}>
                  <Image
                    source={{ uri: resolveMediaUrl(url) || url }}
                    style={styles.slideImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
            {job.mediaUrls.length > 1 && (
              <View style={styles.dots}>
                {job.mediaUrls.map((_, i) => (
                  <View
                    key={i}
                    style={[styles.dot, i === currentSlide && styles.dotActive]}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Title */}
        <Text style={styles.title}>{job.title}</Text>

        {/* Description */}
        <Text style={styles.description}>{job.description}</Text>

        {/* Link Button */}
        {job.link && (
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => {}}
          >
            <Text style={styles.linkButtonText}>Visit Link</Text>
          </TouchableOpacity>
        )}

        {/* Unit Price Card */}
        <View style={styles.priceCard}>
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.priceLabel}>Per Unit Price</Text>
              <Text style={styles.priceValue}>৳{Number(job.unitPay).toFixed(2)}</Text>
            </View>
            <View style={styles.priceRight}>
              <Text style={styles.priceLabel}>Remaining</Text>
              <Text style={styles.priceValueRight}>{remainingUnits}</Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${Math.min((job.filledUnits / job.totalUnits) * 100, 100)}%` }]}
            />
          </View>
          <Text style={styles.progressText}>{job.filledUnits}/{job.totalUnits} submitted</Text>
        </View>

        {/* Submit Proof Section */}
        {canSubmit && (
          <View style={styles.submitSection}>
            <Text style={styles.sectionTitle}>Submit Proof</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Describe your work completion..."
              placeholderTextColor="#999"
              value={proof}
              onChangeText={setProof}
              multiline
              numberOfLines={3}
            />

            {/* File Selection */}
            <TouchableOpacity style={styles.attachButton} onPress={pickFiles}>
              <Text style={styles.attachButtonText}>Attach Files ({selectedFiles.length}/{MAX_FILES})</Text>
            </TouchableOpacity>

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
              <View style={styles.fileList}>
                {selectedFiles.map((file, i) => (
                  <View key={i} style={styles.fileItem}>
                    <Image source={{ uri: file.uri }} style={styles.fileThumb} />
                    <TouchableOpacity onPress={() => removeFile(i)} style={styles.removeFile}>
                      <Text style={styles.removeFileText}>x</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitButton, (!proof.trim() || actionLoading === 'submit') && styles.submitButtonDisabled]}
              onPress={handleSubmitWork}
              disabled={!proof.trim() || actionLoading === 'submit'}
            >
              <Text style={styles.submitButtonText}>
                {actionLoading === 'submit' ? 'Submitting...' : 'Submit Proof'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* My Submissions */}
        {job.mySubmissions && job.mySubmissions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Submissions</Text>
            {job.mySubmissions.map((s: any) => (
              <View key={s.id} style={styles.submissionCard}>
                <View style={styles.submissionHeader}>
                  <Text style={styles.submissionDate}>{new Date(s.createdAt).toLocaleDateString()}</Text>
                  <View style={[styles.statusBadge, s.status === 'approved' ? styles.statusApproved : s.status === 'rejected' ? styles.statusRejected : styles.statusPending]}>
                    <Text style={[styles.statusText, s.status === 'approved' ? styles.statusTextApproved : s.status === 'rejected' ? styles.statusTextRejected : styles.statusTextPending]}>
                      {s.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.submissionProof}>{s.proof}</Text>
                {s.status === 'rejected' && s.posterComment && (
                  <View style={styles.feedbackBox}>
                    <Text style={styles.feedbackLabel}>Feedback:</Text>
                    <Text style={styles.feedbackText}>{s.posterComment}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Submission limit */}
        {!isPoster && job.status === 'active' && (
          <Text style={styles.limitText}>
            Submissions: {job.mySubmissionCount}/{job.maxSubmissions}
          </Text>
        )}

        {/* Pending Submissions (Poster View) */}
        {isPoster && pendingSubmissions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending Submissions ({pendingSubmissions.length})</Text>
            {pendingSubmissions.map((s: any) => (
              <View key={s.id} style={styles.submissionCard}>
                <View style={styles.posterSubmissionHeader}>
                  <View style={styles.submissionUser}>
                    <View style={styles.miniAvatar}>
                      {s.workerAvatarUrl ? (
                        <Image source={{ uri: s.workerAvatarUrl }} style={styles.miniAvatarImage} />
                      ) : (
                        <Text style={styles.miniAvatarText}>@</Text>
                      )}
                    </View>
                    <Text style={styles.submissionUsername}>@{s.workerUsername}</Text>
                  </View>
                  <Text style={styles.submissionDate}>{new Date(s.createdAt).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.submissionProof}>{s.proof}</Text>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.approveButton, actionLoading === s.id && styles.buttonDisabled]}
                    onPress={() => handleApproveSubmission(s.id)}
                    disabled={actionLoading === s.id}
                  >
                    <Text style={styles.approveButtonText}>
                      {actionLoading === s.id ? '...' : `Approve (৳${Number(job.unitPay).toFixed(2)})`}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.rejectButton, actionLoading === s.id && styles.buttonDisabled]}
                    onPress={() => {
                      setRejectingId(s.id);
                      setShowRejectModal(true);
                    }}
                    disabled={actionLoading === s.id}
                  >
                    <Text style={styles.rejectButtonText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Cancel Job */}
        {isPoster && (job.status === 'active' || job.status === 'pending_approval') && (
          <TouchableOpacity
            style={[styles.cancelButton, actionLoading === 'cancel' && styles.buttonDisabled]}
            onPress={handleCancelJob}
            disabled={actionLoading === 'cancel'}
          >
            <Text style={styles.cancelButtonText}>
              {actionLoading === 'cancel' ? 'Cancelling...' : 'Cancel Job'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Reject Modal */}
      <Modal visible={showRejectModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reject Submission</Text>
            <Text style={styles.modalSubtitle}>Provide feedback to help the worker improve.</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Feedback (optional)..."
              placeholderTextColor="#999"
              value={rejectComment}
              onChangeText={setRejectComment}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowRejectModal(false);
                  setRejectComment('');
                  setRejectingId(null);
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalRejectButton, actionLoading === rejectingId && styles.buttonDisabled]}
                onPress={handleRejectSubmission}
                disabled={actionLoading === rejectingId}
              >
                <Text style={styles.modalRejectText}>
                  {actionLoading === rejectingId ? '...' : 'Reject'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Lightbox */}
      <Modal visible={!!lightboxUrl} transparent animationType="fade">
        <TouchableOpacity
          style={styles.lightboxOverlay}
          onPress={() => setLightboxUrl(null)}
          activeOpacity={1}
        >
          {lightboxUrl && (
            <Image
              source={{ uri: resolveMediaUrl(lightboxUrl) || lightboxUrl }}
              style={styles.lightboxImage}
              resizeMode="contain"
            />
          )}
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8ff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f8ff' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingTop: 100, paddingBottom: 40 },

  imageSlider: { borderRadius: 16, overflow: 'hidden', marginBottom: 16, backgroundColor: '#e5e2e1' },
  slideImage: { width: SCREEN_WIDTH - 32, height: 220 },
  dots: { flexDirection: 'row', justifyContent: 'center', position: 'absolute', bottom: 12, left: 0, right: 0 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)', marginHorizontal: 3 },
  dotActive: { backgroundColor: '#fff', width: 16 },

  title: { fontSize: 22, fontWeight: '700', color: '#1c1b1b', marginBottom: 8 },
  description: { fontSize: 14, color: '#45474b', lineHeight: 22, marginBottom: 16 },

  linkButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e9fdff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginBottom: 16, alignSelf: 'flex-start' },
  linkButtonText: { color: '#2d666d', fontSize: 13, fontWeight: '600' },

  priceCard: { backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', marginBottom: 16 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  priceRight: { alignItems: 'flex-end' },
  priceLabel: { fontSize: 12, color: '#76777b', marginBottom: 4 },
  priceValue: { fontSize: 24, fontWeight: '700', color: '#2d666d' },
  priceValueRight: { fontSize: 18, fontWeight: '700', color: '#1c1b1b' },
  progressBar: { height: 6, backgroundColor: '#e5e2e1', borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', backgroundColor: '#2d666d', borderRadius: 3 },
  progressText: { fontSize: 11, color: '#76777b', textAlign: 'right' },

  posterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  posterAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e5e2e1', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarImage: { width: 40, height: 40, borderRadius: 20 },
  avatarPlaceholder: { fontSize: 16, fontWeight: '600', color: '#5d5e64' },
  posterName: { fontSize: 13, fontWeight: '600', color: '#1c1b1b' },
  posterDate: { fontSize: 11, color: '#76777b' },

  submitSection: { backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1c1b1b', marginBottom: 12 },
  textInput: { backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 8, padding: 12, fontSize: 14, color: '#1c1b1b', minHeight: 80, textAlignVertical: 'top', marginBottom: 12 },
  attachButton: { backgroundColor: '#e5e2e1', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 12 },
  attachButtonText: { fontSize: 12, fontWeight: '600', color: '#45474b' },
  fileList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  fileItem: { width: 64, height: 64, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  fileThumb: { width: 64, height: 64 },
  removeFile: { position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: 8, backgroundColor: '#ba1a1a', justifyContent: 'center', alignItems: 'center' },
  removeFileText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  submitButton: { backgroundColor: '#2d666d', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  section: { marginBottom: 16 },
  submissionCard: { backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', marginBottom: 8 },
  submissionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  submissionDate: { fontSize: 11, color: '#76777b' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  statusPending: { backgroundColor: '#e5e2e1' },
  statusApproved: { backgroundColor: '#e9fdff' },
  statusRejected: { backgroundColor: '#ffd1dc' },
  statusText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  statusTextPending: { color: '#45474b' },
  statusTextApproved: { color: '#2d666d' },
  statusTextRejected: { color: '#78555e' },
  submissionProof: { fontSize: 13, color: '#45474b', marginBottom: 8 },

  posterSubmissionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  submissionUser: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  miniAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#e5e2e1', justifyContent: 'center', alignItems: 'center' },
  miniAvatarImage: { width: 28, height: 28, borderRadius: 14 },
  miniAvatarText: { fontSize: 11, fontWeight: '600', color: '#5d5e64' },
  submissionUsername: { fontSize: 13, fontWeight: '600', color: '#1c1b1b' },

  actionRow: { flexDirection: 'row', gap: 8 },
  approveButton: { flex: 1, backgroundColor: '#2d666d', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  approveButtonText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  rejectButton: { flex: 1, borderWidth: 1, borderColor: '#ba1a1a', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  rejectButtonText: { color: '#ba1a1a', fontSize: 12, fontWeight: '600' },
  buttonDisabled: { opacity: 0.5 },

  cancelButton: { borderWidth: 1, borderColor: '#ba1a1a', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  cancelButtonText: { color: '#ba1a1a', fontSize: 14, fontWeight: '600' },

  limitText: { fontSize: 11, color: '#76777b', marginBottom: 16 },

  feedbackBox: { backgroundColor: 'rgba(255,209,220,0.3)', borderRadius: 8, padding: 8, marginTop: 8 },
  feedbackLabel: { fontSize: 11, fontWeight: '600', color: '#78555e', marginBottom: 2 },
  feedbackText: { fontSize: 12, color: '#78555e' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1c1b1b', marginBottom: 8 },
  modalSubtitle: { fontSize: 13, color: '#76777b', marginBottom: 16 },
  modalInput: { backgroundColor: '#f5f5f5', borderRadius: 8, padding: 12, fontSize: 14, color: '#1c1b1b', minHeight: 80, textAlignVertical: 'top', marginBottom: 16 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancelButton: { flex: 1, borderWidth: 1, borderColor: '#e5e2e1', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  modalCancelText: { color: '#45474b', fontSize: 13, fontWeight: '600' },
  modalRejectButton: { flex: 1, backgroundColor: '#ba1a1a', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  modalRejectText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  lightboxOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  lightboxImage: { width: SCREEN_WIDTH, height: SCREEN_WIDTH },
});
