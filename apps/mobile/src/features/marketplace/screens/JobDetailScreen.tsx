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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AuroraBackground from '@/shared/components/AuroraBackground';
import TopBar from '@/shared/components/TopBar';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4080';

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
  posterUsername: string;
  posterFullName?: string;
  bids: any[];
  assignments: any[];
  submissions: any[];
}

export default function JobDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Bid form
  const [bidAmount, setBidAmount] = useState('');
  const [bidMessage, setBidMessage] = useState('');

  // Submit form
  const [proof, setProof] = useState('');

  useEffect(() => {
    AsyncStorage.getItem('accessToken').then((t) => {
      setToken(t);
      if (t) {
        fetchJob(t);
        fetchUserId(t);
      } else {
        setLoading(false);
      }
    });
  }, [id]);

  const fetchUserId = async (t: string) => {
    try {
      const res = await fetch(`${API_URL}/wallet`, { headers: { Authorization: `Bearer ${t}` } });
      if (res.ok) {
        // We'll get userId from the job data instead
      }
    } catch (err) {}
  };

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
    if (!proof.trim()) return Alert.alert('Error', 'Proof of work is required');

    setActionLoading('submit');
    try {
      const res = await fetch(`${API_URL}/marketplace/jobs/${job.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ proof: proof.trim() }),
      });
      if (res.ok) {
        Alert.alert('Success', 'Work submitted successfully');
        setProof('');
        fetchJob(token);
      } else {
        const err = await res.json();
        Alert.alert('Error', err.message || 'Failed to submit work');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to submit work');
    } finally {
      setActionLoading(null);
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
          <ActivityIndicator size="large" color="#5d5e64" />
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
          <Text style={styles.emptyText}>Job not found</Text>
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

  return (
    <View style={styles.container}>
      <AuroraBackground />
      <TopBar title="Job Details" showBack showSearch={false} showNotification={false} />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{job.type === 'single' ? 'Single Unit' : 'Multiple Unit'}</Text>
            </View>
            <View style={[styles.statusBadge, job.status === 'active' && styles.activeBadge]}>
              <Text style={[styles.statusText, job.status === 'active' && styles.activeText]}>
                {job.status.replace('_', ' ')}
              </Text>
            </View>
          </View>
          <Text style={styles.title}>{job.title}</Text>
          <Text style={styles.description}>{job.description}</Text>
          <View style={styles.amountRow}>
            <Text style={styles.amount}>৳{Number(job.amount).toFixed(2)}</Text>
            <Text style={styles.unitPay}>৳{Number(job.unitPay).toFixed(2)}/unit</Text>
          </View>
          <Text style={styles.poster}>Posted by @{job.posterUsername}</Text>
        </View>

        {/* Single Unit - Bids Section */}
        {job.type === 'single' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bids ({job.bids?.length || 0})</Text>

            {!isPoster && !hasPendingBid && !hasAcceptedBid && job.status === 'active' && (
              <View style={styles.bidForm}>
                <TextInput
                  style={styles.input}
                  placeholder="Your bid amount (৳)"
                  placeholderTextColor="#76777b"
                  value={bidAmount}
                  onChangeText={setBidAmount}
                  keyboardType="decimal-pad"
                />
                <TextInput
                  style={[styles.input, styles.messageInput]}
                  placeholder="Message (optional)"
                  placeholderTextColor="#76777b"
                  value={bidMessage}
                  onChangeText={setBidMessage}
                />
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={handlePlaceBid}
                  disabled={actionLoading === 'bid'}
                >
                  {actionLoading === 'bid' ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.actionBtnText}>Place Bid</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {job.bids?.map((bid) => (
              <View key={bid.id} style={styles.bidCard}>
                <View style={styles.bidHeader}>
                  <Text style={styles.bidder}>@{bid.bidderUsername}</Text>
                  <Text style={styles.bidAmount}>৳{Number(bid.amount).toFixed(2)}</Text>
                </View>
                {bid.message && <Text style={styles.bidMessage}>{bid.message}</Text>}
                <View style={styles.bidStatus}>
                  <Text style={[styles.bidStatusText, bid.status === 'accepted' && styles.acceptedText]}>
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
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text style={styles.acceptBtnText}>Accept Bid</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Multiple Unit - Assignments Section */}
        {job.type === 'multiple' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Workers ({job.filledUnits}/{job.totalUnits})
            </Text>
            {job.assignments?.map((assignment) => (
              <View key={assignment.id} style={styles.assignmentCard}>
                <View style={styles.assignmentHeader}>
                  <Text style={styles.worker}>@{assignment.workerUsername}</Text>
                  <Text style={styles.units}>{assignment.units} units</Text>
                </View>
                <Text style={styles.assignmentStatus}>{assignment.status}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Submissions Section */}
        {job.submissions?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Submissions</Text>
            {job.submissions.map((submission) => (
              <View key={submission.id} style={styles.submissionCard}>
                <View style={styles.submissionHeader}>
                  <Text style={styles.submitter}>@{submission.workerUsername}</Text>
                  <Text style={[styles.submissionStatus, submission.status === 'approved' && styles.approvedText]}>
                    {submission.status}
                  </Text>
                </View>
                <Text style={styles.proof}>{submission.proof}</Text>
                {isPoster && submission.status === 'pending' && (
                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={() => handleApproveSubmission(submission.id)}
                    disabled={actionLoading === submission.id}
                  >
                    {actionLoading === submission.id ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text style={styles.approveBtnText}>Approve & Pay</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Submit Work Section */}
        {(hasAcceptedBid || myAssignment) && job.status === 'in_progress' && !hasPendingSubmission && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Submit Work</Text>
            <TextInput
              style={[styles.input, styles.proofInput]}
              placeholder="Describe your work completion..."
              placeholderTextColor="#76777b"
              value={proof}
              onChangeText={setProof}
              multiline
            />
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleSubmitWork}
              disabled={actionLoading === 'submit'}
            >
              {actionLoading === 'submit' ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.actionBtnText}>Submit Work</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Cancel Job Button */}
        {isPoster && (job.status === 'active' || job.status === 'pending_approval') && (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleCancelJob}
            disabled={actionLoading === 'cancel'}
          >
            {actionLoading === 'cancel' ? (
              <ActivityIndicator color="#ba1a1a" />
            ) : (
              <Text style={styles.cancelBtnText}>Cancel Job</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8ff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingTop: 110, paddingBottom: 40 },
  headerCard: {
    backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  typeBadge: { backgroundColor: '#e9fdff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  typeText: { fontSize: 11, fontWeight: '600', color: '#2d666d' },
  statusBadge: { backgroundColor: '#e5e2e1', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  activeBadge: { backgroundColor: '#e9fdff' },
  statusText: { fontSize: 11, fontWeight: '600', color: '#45474b', textTransform: 'capitalize' },
  activeText: { color: '#2d666d' },
  title: { fontSize: 20, fontWeight: '700', color: '#1c1b1b', marginBottom: 8 },
  description: { fontSize: 14, color: '#45474b', lineHeight: 20, marginBottom: 12 },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amount: { fontSize: 24, fontWeight: '700', color: '#1c1b1b' },
  unitPay: { fontSize: 14, color: '#76777b' },
  poster: { fontSize: 12, color: '#76777b', marginTop: 8 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1c1b1b', marginBottom: 12 },
  bidForm: {
    backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 12, padding: 12, marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 8, paddingHorizontal: 12,
    paddingVertical: 10, fontSize: 14, color: '#1c1b1b', marginBottom: 8,
  },
  messageInput: { height: 60, textAlignVertical: 'top' },
  proofInput: { height: 80, textAlignVertical: 'top' },
  actionBtn: { backgroundColor: '#2d666d', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  actionBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  bidCard: {
    backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 12, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  bidHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  bidder: { fontSize: 14, fontWeight: '600', color: '#1c1b1b' },
  bidAmount: { fontSize: 16, fontWeight: '700', color: '#1c1b1b' },
  bidMessage: { fontSize: 13, color: '#45474b', marginBottom: 4 },
  bidStatus: { marginTop: 4 },
  bidStatusText: { fontSize: 11, fontWeight: '600', color: '#76777b', textTransform: 'capitalize' },
  acceptedText: { color: '#2d666d' },
  acceptBtn: { backgroundColor: '#2d666d', borderRadius: 8, paddingVertical: 8, alignItems: 'center', marginTop: 8 },
  acceptBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '600' },
  assignmentCard: {
    backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 12, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  assignmentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  worker: { fontSize: 14, fontWeight: '600', color: '#1c1b1b' },
  units: { fontSize: 14, color: '#76777b' },
  assignmentStatus: { fontSize: 11, fontWeight: '600', color: '#76777b', textTransform: 'capitalize' },
  submissionCard: {
    backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 12, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  submissionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  submitter: { fontSize: 14, fontWeight: '600', color: '#1c1b1b' },
  submissionStatus: { fontSize: 11, fontWeight: '600', color: '#76777b', textTransform: 'capitalize' },
  approvedText: { color: '#2d666d' },
  proof: { fontSize: 13, color: '#45474b', lineHeight: 18 },
  approveBtn: { backgroundColor: '#2d666d', borderRadius: 8, paddingVertical: 8, alignItems: 'center', marginTop: 8 },
  approveBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '600' },
  cancelBtn: {
    borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8,
    borderWidth: 1, borderColor: '#ba1a1a',
  },
  cancelBtnText: { color: '#ba1a1a', fontSize: 14, fontWeight: '600' },
  emptyText: { fontSize: 16, color: '#76777b' },
});
