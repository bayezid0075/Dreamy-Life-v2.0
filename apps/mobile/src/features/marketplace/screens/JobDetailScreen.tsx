import React, { useState, useEffect } from 'react';
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
import { MediaTypeOptions } from 'expo-image-picker';
import AuroraBackground from '@/shared/components/AuroraBackground';
import TopBar from '@/shared/components/TopBar';
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
  adminApproved: boolean;
  mediaUrls: string[];
  posterUsername: string;
  posterFullName?: string;
  bids: any[];
  assignments: any[];
  submissions: any[];
}

interface SelectedFile {
  uri: string;
  name: string;
  type: string;
  size: number;
}

const MAX_FILES = 5;

function isImageUrl(url: string) {
  return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
}

export default function JobDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [bidAmount, setBidAmount] = useState('');
  const [bidMessage, setBidMessage] = useState('');

  const [proof, setProof] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const [rejectComment, setRejectComment] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [jobLightboxUrl, setJobLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('accessToken').then((t) => {
      setToken(t);
      if (t) {
        fetchJob(t);
      } else {
        setLoading(false);
      }
    });
  }, [id]);

  const fetchJob = async (t: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/marketplace/jobs/${id}`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) {
        const data = await res.json();
        setJob(data);
        setUserId(data.posterId);
      }
    } catch (err) {
      console.error('Failed to fetch job', err);
    } finally {
      setLoading(false);
    }
  };

  const pickImages = async () => {
    if (selectedFiles.length >= MAX_FILES) {
      Alert.alert('Limit', `Maximum ${MAX_FILES} files allowed`);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: MAX_FILES - selectedFiles.length,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newFiles: SelectedFile[] = result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.fileName || `image_${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
        size: asset.fileSize || 0,
      }));
      setSelectedFiles((prev) => [...prev, ...newFiles].slice(0, MAX_FILES));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (): Promise<string[]> => {
    if (selectedFiles.length === 0) return [];
    const urls: string[] = [];
    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as any);

      const res = await fetch(`${API_URL}/media/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        urls.push(data.url);
      } else {
        throw new Error('Failed to upload file');
      }
    }
    return urls;
  };

  const handlePlaceBid = async () => {
    if (!token || !job) return;
    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      return Alert.alert('Error', 'Valid bid amount is required');
    }
    if (parseFloat(bidAmount) > parseFloat(job.amount)) {
      return Alert.alert('Error', 'Bid cannot exceed job amount');
    }

    setActionLoading('bid');
    try {
      const res = await fetch(`${API_URL}/marketplace/jobs/${job.id}/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: parseFloat(bidAmount), message: bidMessage }),
      });
      if (res.ok) {
        Alert.alert('Success', 'Bid placed successfully');
        setBidAmount('');
        setBidMessage('');
        fetchJob(token);
      } else {
        const err = await res.json();
        Alert.alert('Error', err.message || 'Failed to place bid');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to place bid');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAcceptBid = async (bidId: string) => {
    if (!token || !job) return;
    setActionLoading(bidId);
    try {
      const res = await fetch(`${API_URL}/marketplace/jobs/${job.id}/bids/${bidId}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        Alert.alert('Success', 'Bid accepted');
        fetchJob(token);
      } else {
        const err = await res.json();
        Alert.alert('Error', err.message || 'Failed to accept bid');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to accept bid');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmitWork = async () => {
    if (!token || !job) return;
    if (!proof.trim() && selectedFiles.length === 0) {
      return Alert.alert('Error', 'Please provide proof text or attach files');
    }

    setActionLoading('submit');
    setUploadingFiles(true);
    try {
      const mediaUrls = await uploadFiles();
      const res = await fetch(`${API_URL}/marketplace/jobs/${job.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ proof: proof.trim(), proofMediaUrls: mediaUrls }),
      });
      if (res.ok) {
        Alert.alert('Success', 'Work submitted successfully');
        setProof('');
        setSelectedFiles([]);
        fetchJob(token);
      } else {
        const err = await res.json();
        Alert.alert('Error', err.message || 'Failed to submit work');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to submit work');
    } finally {
      setActionLoading(null);
      setUploadingFiles(false);
    }
  };

  const handleApproveSubmission = async (submissionId: string) => {
    if (!token || !job) return;
    setActionLoading(submissionId);
    try {
      const res = await fetch(`${API_URL}/marketplace/jobs/${job.id}/submissions/${submissionId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        Alert.alert('Success', 'Work approved! Payment released.');
        fetchJob(token);
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

  const handleRejectSubmission = async (submissionId: string) => {
    if (!token || !job) return;
    setActionLoading(`reject-${submissionId}`);
    try {
      const res = await fetch(`${API_URL}/marketplace/jobs/${job.id}/submissions/${submissionId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ comment: rejectComment || undefined }),
      });
      if (res.ok) {
        setRejectComment('');
        setRejectingId(null);
        Alert.alert('Success', 'Submission rejected');
        fetchJob(token);
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
    if (!token || !job) return;
    Alert.alert('Cancel Job', 'Are you sure? Funds will be refunded.', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        onPress: async () => {
          setActionLoading('cancel');
          try {
            const res = await fetch(`${API_URL}/marketplace/jobs/${job.id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              Alert.alert('Success', 'Job cancelled. Funds refunded.');
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
      <View style={styles.container}>
        <AuroraBackground />
        <TopBar title="Job Details" showBack showSearch={false} showNotification={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2d666d" />
        </View>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.container}>
        <AuroraBackground />
        <TopBar title="Job Details" showBack showSearch={false} showNotification={false} />
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyTitle}>Job Not Found</Text>
          <Text style={styles.emptySubtitle}>This job may have been removed</Text>
        </View>
      </View>
    );
  }

  const isPoster = job.posterId === userId;
  const hasPendingBid = job.bids?.some((b) => b.bidderId === userId && b.status === 'pending');
  const hasAcceptedBid = job.bids?.some((b) => b.bidderId === userId && b.status === 'accepted');
  const myAssignment = job.assignments?.find((a) => a.workerId === userId);
  const hasPendingSubmission = job.submissions?.some(
    (s) => s.workerId === userId && s.status === 'pending'
  );

  const statusColorMap: Record<string, { bg: string; text: string }> = {
    active: { bg: '#e9fdff', text: '#2d666d' },
    in_progress: { bg: '#fef7e0', text: '#b06000' },
    under_review: { bg: '#e8f0fe', text: '#1a73e8' },
    completed: { bg: '#e6f4ea', text: '#0b8043' },
    cancelled: { bg: '#fce8e6', text: '#ba1a1a' },
    pending_approval: { bg: '#fef7e0', text: '#b06000' },
  };

  const sc = statusColorMap[job.status] || { bg: '#e5e2e1', text: '#45474b' };

  return (
    <View style={styles.container}>
      <AuroraBackground />
      <TopBar title="Job Details" showBack showSearch={false} showNotification={false} />

      {/* Lightbox Modal */}
      <Modal visible={!!lightboxUrl} transparent animationType="fade">
        <TouchableOpacity
          style={styles.lightboxOverlay}
          activeOpacity={1}
          onPress={() => setLightboxUrl(null)}
        >
          <Image
            source={{ uri: lightboxUrl || '' }}
            style={styles.lightboxImage}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={styles.lightboxClose}
            onPress={() => setLightboxUrl(null)}
          >
            <Text style={styles.lightboxCloseText}>✕</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Job Image Lightbox */}
      <Modal visible={!!jobLightboxUrl} transparent animationType="fade">
        <TouchableOpacity
          style={styles.lightboxOverlay}
          activeOpacity={1}
          onPress={() => setJobLightboxUrl(null)}
        >
          <Image
            source={{ uri: jobLightboxUrl || '' }}
            style={styles.lightboxImage}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={styles.lightboxClose}
            onPress={() => setJobLightboxUrl(null)}
          >
            <Text style={styles.lightboxCloseText}>✕</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Job Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerTopRow}>
            <View style={[styles.badge, { backgroundColor: '#e9fdff' }]}>
              <Text style={[styles.badgeText, { color: '#2d666d' }]}>
                {job.type === 'single' ? 'Single Unit' : 'Multiple Unit'}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: sc.bg }]}>
              <Text style={[styles.badgeText, { color: sc.text }]}>
                {job.status.replace(/_/g, ' ')}
              </Text>
            </View>
          </View>

          <Text style={styles.title}>{job.title}</Text>
          <Text style={styles.description}>{job.description}</Text>

          <View style={styles.amountContainer}>
            <View style={styles.amountBlock}>
              <Text style={styles.amountLabel}>Budget</Text>
              <Text style={styles.amountValue}>৳{Number(job.amount).toFixed(2)}</Text>
            </View>
            <View style={styles.amountDivider} />
            <View style={styles.amountBlock}>
              <Text style={styles.amountLabel}>Per Unit</Text>
              <Text style={styles.amountValue}>৳{Number(job.unitPay).toFixed(2)}</Text>
            </View>
          </View>

          {job.type === 'multiple' && (
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Slots Filled</Text>
                <Text style={styles.progressCount}>{job.filledUnits}/{job.totalUnits}</Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${(job.filledUnits / job.totalUnits) * 100}%` },
                  ]}
                />
              </View>
            </View>
          )}

          <View style={styles.posterRow}>
            <View style={styles.posterAvatar}>
              <Text style={styles.posterInitial}>
                {job.posterUsername?.[0]?.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.posterName}>@{job.posterUsername}</Text>
          </View>
        </View>

        {/* Job Images Slider */}
        {job.mediaUrls && job.mediaUrls.length > 0 && (
          <View style={styles.imageSliderContainer}>
            <View style={styles.imageSliderTrack}>
              {job.mediaUrls.map((url, i) => (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.9}
                  onPress={() => setJobLightboxUrl(resolveMediaUrl(url))}
                  style={[
                    styles.imageSliderSlide,
                    { transform: [{ translateX: -currentSlide * (Dimensions.get('window').width - 32) }] },
                  ]}
                >
                  <Image source={{ uri: resolveMediaUrl(url) }} style={styles.imageSliderImage} resizeMode="cover" />
                </TouchableOpacity>
              ))}
            </View>
            {job.mediaUrls.length > 1 && (
              <>
                <TouchableOpacity
                  style={[styles.imageSliderArrow, { left: 8 }]}
                  onPress={() => setCurrentSlide((prev) => (prev > 0 ? prev - 1 : job.mediaUrls.length - 1))}
                >
                  <Text style={styles.imageSliderArrowText}>{'‹'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.imageSliderArrow, { right: 8 }]}
                  onPress={() => setCurrentSlide((prev) => (prev < job.mediaUrls.length - 1 ? prev + 1 : 0))}
                >
                  <Text style={styles.imageSliderArrowText}>{'›'}</Text>
                </TouchableOpacity>
                <View style={styles.imageSliderDots}>
                  {job.mediaUrls.map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.imageSliderDot,
                        i === currentSlide && styles.imageSliderDotActive,
                      ]}
                    />
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        {/* Single Unit - Bids Section */}
        {job.type === 'single' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Bids</Text>
              <Text style={styles.sectionCount}>{job.bids?.length || 0}</Text>
            </View>

            {!isPoster && !hasPendingBid && !hasAcceptedBid && job.status === 'active' && (
              <View style={styles.bidForm}>
                <Text style={styles.formLabel}>Your Bid</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Amount (৳)"
                  placeholderTextColor="#76777b"
                  value={bidAmount}
                  onChangeText={setBidAmount}
                  keyboardType="decimal-pad"
                />
                <TextInput
                  style={[styles.input, styles.messageInput]}
                  placeholder="Why you're a good fit (optional)"
                  placeholderTextColor="#76777b"
                  value={bidMessage}
                  onChangeText={setBidMessage}
                  multiline
                />
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={handlePlaceBid}
                  disabled={actionLoading === 'bid'}
                >
                  {actionLoading === 'bid' ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Place Bid</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {job.bids?.map((bid) => (
              <View key={bid.id} style={styles.bidCard}>
                <View style={styles.bidCardHeader}>
                  <View style={styles.bidUser}>
                    <View style={styles.bidAvatar}>
                      <Text style={styles.bidAvatarText}>
                        {bid.bidderUsername?.[0]?.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.bidderName}>@{bid.bidderUsername}</Text>
                  </View>
                  <Text style={styles.bidAmount}>৳{Number(bid.amount).toFixed(2)}</Text>
                </View>
                {bid.message && <Text style={styles.bidMessage}>{bid.message}</Text>}
                <View style={styles.bidFooter}>
                  <View style={[
                    styles.statusPill,
                    bid.status === 'accepted' && { backgroundColor: '#e9fdff' },
                    bid.status === 'rejected' && { backgroundColor: '#fce8e6' },
                  ]}>
                    <Text style={[
                      styles.statusPillText,
                      bid.status === 'accepted' && { color: '#2d666d' },
                      bid.status === 'rejected' && { color: '#ba1a1a' },
                    ]}>
                      {bid.status}
                    </Text>
                  </View>
                  {isPoster && bid.status === 'pending' && (
                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={() => handleAcceptBid(bid.id)}
                      disabled={actionLoading === bid.id}
                    >
                      {actionLoading === bid.id ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <Text style={styles.acceptBtnText}>Accept</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Multiple Unit - Assignments Section */}
        {job.type === 'multiple' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Workers</Text>
              <Text style={styles.sectionCount}>{job.assignments?.length || 0}</Text>
            </View>
            {job.assignments?.map((assignment) => (
              <View key={assignment.id} style={styles.assignmentCard}>
                <View style={styles.assignmentLeft}>
                  <View style={styles.bidAvatar}>
                    <Text style={styles.bidAvatarText}>
                      {assignment.workerUsername?.[0]?.toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.workerName}>@{assignment.workerUsername}</Text>
                    <Text style={styles.unitsLabel}>{assignment.units} units</Text>
                  </View>
                </View>
                <View style={[
                  styles.statusPill,
                  assignment.status === 'completed' && { backgroundColor: '#e6f4ea' },
                ]}>
                  <Text style={[
                    styles.statusPillText,
                    assignment.status === 'completed' && { color: '#0b8043' },
                  ]}>
                    {assignment.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Submissions Section */}
        {job.submissions?.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Submissions</Text>
              <Text style={styles.sectionCount}>{job.submissions.length}</Text>
            </View>
            {job.submissions.map((submission) => (
              <View key={submission.id} style={styles.submissionCard}>
                <View style={styles.submissionHeader}>
                  <View style={styles.bidUser}>
                    <View style={styles.bidAvatar}>
                      <Text style={styles.bidAvatarText}>
                        {submission.workerUsername?.[0]?.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.submitterName}>@{submission.workerUsername}</Text>
                  </View>
                  <View style={[
                    styles.statusPill,
                    submission.status === 'approved' && { backgroundColor: '#e6f4ea' },
                    submission.status === 'rejected' && { backgroundColor: '#fce8e6' },
                  ]}>
                    <Text style={[
                      styles.statusPillText,
                      submission.status === 'approved' && { color: '#0b8043' },
                      submission.status === 'rejected' && { color: '#ba1a1a' },
                    ]}>
                      {submission.status}
                    </Text>
                  </View>
                </View>

                {submission.proof && (
                  <Text style={styles.proofText}>{submission.proof}</Text>
                )}

                {submission.proofMediaUrls && submission.proofMediaUrls.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.mediaScroll}
                    contentContainerStyle={styles.mediaScrollContent}
                  >
                    {submission.proofMediaUrls.map((url: string, idx: number) => (
                      isImageUrl(url) ? (
                        <TouchableOpacity key={idx} onPress={() => setLightboxUrl(resolveMediaUrl(url))}>
                          <Image source={{ uri: resolveMediaUrl(url) }} style={styles.mediaThumb} />
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          key={idx}
                          style={styles.fileChip}
                          onPress={() => Alert.alert('File', url)}
                        >
                          <Text style={styles.fileChipIcon}>📄</Text>
                          <Text style={styles.fileChipText} numberOfLines={1}>
                            {url.split('/').pop() || 'File'}
                          </Text>
                        </TouchableOpacity>
                      )
                    ))}
                  </ScrollView>
                )}

                {submission.posterComment && (
                  <View style={styles.rejectBanner}>
                    <Text style={styles.rejectBannerText}>Rejection: {submission.posterComment}</Text>
                  </View>
                )}

                {isPoster && submission.status === 'pending' && (
                  <View style={styles.submissionActions}>
                    <TouchableOpacity
                      style={styles.approveBtn}
                      onPress={() => handleApproveSubmission(submission.id)}
                      disabled={actionLoading === submission.id}
                    >
                      {actionLoading === submission.id ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <Text style={styles.approveBtnText}>Approve & Pay</Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => setRejectingId(rejectingId === submission.id ? null : submission.id)}
                    >
                      <Text style={styles.rejectBtnText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {rejectingId === submission.id && isPoster && submission.status === 'pending' && (
                  <View style={styles.rejectForm}>
                    <TextInput
                      style={styles.input}
                      placeholder="Reason for rejection (optional)"
                      placeholderTextColor="#76777b"
                      value={rejectComment}
                      onChangeText={setRejectComment}
                    />
                    <View style={styles.rejectFormActions}>
                      <TouchableOpacity
                        style={styles.confirmRejectBtn}
                        onPress={() => handleRejectSubmission(submission.id)}
                        disabled={actionLoading === `reject-${submission.id}`}
                      >
                        {actionLoading === `reject-${submission.id}` ? (
                          <ActivityIndicator color="#ffffff" size="small" />
                        ) : (
                          <Text style={styles.confirmRejectBtnText}>Confirm</Text>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.cancelRejectBtn}
                        onPress={() => { setRejectingId(null); setRejectComment(''); }}
                      >
                        <Text style={styles.cancelRejectBtnText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Submit Work Section */}
        {(hasAcceptedBid || myAssignment) && job.status === 'in_progress' && !hasPendingSubmission && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Submit Work</Text>
            </View>
            <View style={styles.submitCard}>
              <TextInput
                style={[styles.input, styles.proofInput]}
                placeholder="Describe your completed work..."
                placeholderTextColor="#76777b"
                value={proof}
                onChangeText={setProof}
                multiline
              />

              <TouchableOpacity
                style={styles.pickFilesBtn}
                onPress={pickImages}
                disabled={selectedFiles.length >= MAX_FILES || uploadingFiles}
              >
                <Text style={styles.pickFilesBtnText}>
                  Attach Images ({selectedFiles.length}/{MAX_FILES})
                </Text>
              </TouchableOpacity>

              {selectedFiles.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.selectedFilesScroll}
                  contentContainerStyle={styles.selectedFilesContent}
                >
                  {selectedFiles.map((file, idx) => (
                    <View key={idx} style={styles.selectedFileItem}>
                      <Image source={{ uri: file.uri }} style={styles.selectedFileThumb} />
                      <TouchableOpacity
                        style={styles.removeFileBtn}
                        onPress={() => removeFile(idx)}
                      >
                        <Text style={styles.removeFileBtnText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleSubmitWork}
                disabled={actionLoading === 'submit' || uploadingFiles}
              >
                {uploadingFiles || actionLoading === 'submit' ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Submit Work</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Cancel Job Button */}
        {isPoster && (job.status === 'active' || job.status === 'pending_approval') && (
          <TouchableOpacity
            style={styles.cancelJobBtn}
            onPress={handleCancelJob}
            disabled={actionLoading === 'cancel'}
          >
            {actionLoading === 'cancel' ? (
              <ActivityIndicator color="#ba1a1a" size="small" />
            ) : (
              <Text style={styles.cancelJobBtnText}>Cancel Job</Text>
            )}
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8ff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  content: { padding: 16, paddingTop: 110 },

  // Header Card
  headerCard: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTopRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  title: { fontSize: 22, fontWeight: '800', color: '#1c1b1b', marginBottom: 8, lineHeight: 28 },
  description: { fontSize: 14, color: '#45474b', lineHeight: 21, marginBottom: 16 },

  // Amount Block
  amountContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  amountBlock: { flex: 1, alignItems: 'center' },
  amountLabel: { fontSize: 11, fontWeight: '600', color: '#76777b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  amountValue: { fontSize: 20, fontWeight: '800', color: '#1c1b1b' },
  amountDivider: { width: 1, backgroundColor: 'rgba(0,0,0,0.08)', marginHorizontal: 8 },

  // Progress
  progressContainer: { marginBottom: 12 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 12, fontWeight: '600', color: '#76777b' },
  progressCount: { fontSize: 12, fontWeight: '700', color: '#2d666d' },
  progressTrack: { height: 6, backgroundColor: 'rgba(45,102,109,0.12)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#2d666d', borderRadius: 3 },

  // Poster
  posterRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  posterAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#e9fdff', alignItems: 'center', justifyContent: 'center',
  },
  posterInitial: { fontSize: 12, fontWeight: '700', color: '#2d666d' },
  posterName: { fontSize: 13, fontWeight: '600', color: '#76777b' },

  // Sections
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1c1b1b' },
  sectionCount: {
    fontSize: 12, fontWeight: '700', color: '#76777b',
    backgroundColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 8, overflow: 'hidden',
  },

  // Bid Form
  bidForm: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  formLabel: { fontSize: 13, fontWeight: '700', color: '#45474b', marginBottom: 8 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1c1b1b',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  messageInput: { height: 70, textAlignVertical: 'top' },
  proofInput: { height: 90, textAlignVertical: 'top' },
  primaryBtn: {
    backgroundColor: '#2d666d',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },

  // Bid Card
  bidCard: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  bidCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  bidUser: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bidAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#e9fdff', alignItems: 'center', justifyContent: 'center',
  },
  bidAvatarText: { fontSize: 13, fontWeight: '700', color: '#2d666d' },
  bidderName: { fontSize: 14, fontWeight: '600', color: '#1c1b1b' },
  bidAmount: { fontSize: 17, fontWeight: '800', color: '#1c1b1b' },
  bidMessage: { fontSize: 13, color: '#45474b', lineHeight: 18, marginBottom: 8 },
  bidFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusPill: {
    backgroundColor: '#e5e2e1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPillText: { fontSize: 11, fontWeight: '700', color: '#45474b', textTransform: 'capitalize' },
  acceptBtn: { backgroundColor: '#2d666d', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 20 },
  acceptBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },

  // Assignment Card
  assignmentCard: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  assignmentLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  workerName: { fontSize: 14, fontWeight: '600', color: '#1c1b1b' },
  unitsLabel: { fontSize: 12, color: '#76777b', marginTop: 2 },

  // Submission Card
  submissionCard: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  submissionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  submitterName: { fontSize: 14, fontWeight: '600', color: '#1c1b1b' },
  proofText: { fontSize: 13, color: '#45474b', lineHeight: 19, marginBottom: 10 },
  mediaScroll: { marginBottom: 10 },
  mediaScrollContent: { gap: 8 },
  mediaThumb: { width: 88, height: 88, borderRadius: 12, backgroundColor: '#e5e2e1' },
  fileChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  fileChipIcon: { fontSize: 14 },
  fileChipText: { fontSize: 12, color: '#45474b', maxWidth: 100 },
  rejectBanner: {
    backgroundColor: '#fce8e6', borderRadius: 10, padding: 10, marginBottom: 10,
  },
  rejectBannerText: { fontSize: 12, color: '#ba1a1a', lineHeight: 17 },
  submissionActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  approveBtn: {
    flex: 1, backgroundColor: '#2d666d', borderRadius: 10,
    paddingVertical: 11, alignItems: 'center',
  },
  approveBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  rejectBtn: {
    borderRadius: 10, paddingVertical: 11, paddingHorizontal: 20,
    borderWidth: 1.5, borderColor: '#ba1a1a', alignItems: 'center',
  },
  rejectBtnText: { color: '#ba1a1a', fontSize: 14, fontWeight: '700' },
  rejectForm: {
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 12, padding: 14, marginTop: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  rejectFormActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  confirmRejectBtn: { flex: 1, backgroundColor: '#ba1a1a', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  confirmRejectBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  cancelRejectBtn: { paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  cancelRejectBtnText: { color: '#76777b', fontSize: 13, fontWeight: '600' },

  // Submit Work
  submitCard: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  pickFilesBtn: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    borderStyle: 'dashed',
  },
  pickFilesBtnText: { fontSize: 13, color: '#45474b', fontWeight: '600' },
  selectedFilesScroll: { marginBottom: 10 },
  selectedFilesContent: { gap: 8 },
  selectedFileItem: { position: 'relative' },
  selectedFileThumb: { width: 88, height: 88, borderRadius: 12, backgroundColor: '#e5e2e1' },
  removeFileBtn: {
    position: 'absolute', top: -4, right: -4,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#ba1a1a', alignItems: 'center', justifyContent: 'center',
  },
  removeFileBtnText: { color: '#ffffff', fontSize: 11, fontWeight: '700' },

  // Cancel Job
  cancelJobBtn: {
    borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8,
    borderWidth: 1.5, borderColor: '#ba1a1a', backgroundColor: 'rgba(186,26,26,0.04)',
  },
  cancelJobBtnText: { color: '#ba1a1a', fontSize: 15, fontWeight: '700' },

  // Empty State
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1c1b1b' },
  emptySubtitle: { fontSize: 14, color: '#76777b', marginTop: 4 },

  // Lightbox
  lightboxOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center',
  },
  lightboxImage: { width: '92%', height: '80%' },
  lightboxClose: {
    position: 'absolute', top: 50, right: 20,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  lightboxCloseText: { color: '#ffffff', fontSize: 18, fontWeight: '700' },

  // Image Slider
  imageSliderContainer: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  imageSliderTrack: {
    flexDirection: 'row',
    overflow: 'hidden',
  },
  imageSliderSlide: {
    width: Dimensions.get('window').width - 32,
    aspectRatio: 16 / 10,
  },
  imageSliderImage: {
    width: '100%',
    height: '100%',
  },
  imageSliderArrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageSliderArrowText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '300',
    lineHeight: 28,
  },
  imageSliderDots: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  imageSliderDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  imageSliderDotActive: {
    backgroundColor: '#ffffff',
    width: 18,
  },
});
