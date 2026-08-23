import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';

interface RechargeResultModalProps {
  visible: boolean;
  success: boolean;
  phoneNumber: string;
  operator: string;
  amount: number;
  onClose: () => void;
  onViewHistory: () => void;
}

const OPERATOR_NAMES: Record<string, string> = {
  gp: 'Grameenphone',
  bl: 'Banglalink',
  rb: 'Robi',
  al: 'Airtel',
  tt: 'Teletalk',
  st: 'Smart Telecom',
};

function maskPhoneNumber(phone: string): string {
  if (phone.length !== 11) return phone;
  return `${phone.slice(0, 3)}*****${phone.slice(-3)}`;
}

export default function RechargeResultModal({
  visible,
  success,
  phoneNumber,
  operator,
  amount,
  onClose,
  onViewHistory,
}: RechargeResultModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={[styles.iconWrap, success ? styles.iconSuccess : styles.iconFailed]}>
            <Text style={styles.iconText}>{success ? '✓' : '✕'}</Text>
          </View>

          <Text style={[styles.title, success ? styles.titleSuccess : styles.titleFailed]}>
            {success ? 'Recharge Successful' : 'Recharge Failed'}
          </Text>

          <View style={styles.detailsBox}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Phone Number</Text>
              <Text style={styles.detailValue}>+880{maskPhoneNumber(phoneNumber)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Operator</Text>
              <Text style={styles.detailValue}>{OPERATOR_NAMES[operator] || operator}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amount</Text>
              <Text style={styles.detailValue}>৳{amount.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.historyBtn} onPress={onViewHistory} activeOpacity={0.7}>
              <Text style={styles.historyBtnText}>View History</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.doneBtn, success ? styles.doneBtnSuccess : styles.doneBtnFailed]} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  container: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconSuccess: {
    backgroundColor: '#dcfce7',
  },
  iconFailed: {
    backgroundColor: '#fee2e2',
  },
  iconText: {
    fontSize: 32,
    fontWeight: '800',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  titleSuccess: {
    color: '#16a34a',
  },
  titleFailed: {
    color: '#dc2626',
  },
  detailsBox: {
    width: '100%',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  historyBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  historyBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
  },
  doneBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnSuccess: {
    backgroundColor: '#16a34a',
  },
  doneBtnFailed: {
    backgroundColor: '#dc2626',
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});
