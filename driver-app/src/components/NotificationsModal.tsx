import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Bell, X, Check, Info, AlertTriangle, CheckCircle } from 'lucide-react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

interface NotificationsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function NotificationsModal({ visible, onClose }: NotificationsModalProps) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: notifRes, isLoading, refetch } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => notificationsApi.getNotifications(user?.id!),
    enabled: !!user?.id && visible,
    refetchInterval: 10000
  });

  const notifications = notifRes?.data?.data || [];

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      refetch();
    } catch (err) {
      console.warn('Failed to mark notification read:', err);
    }
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={18} color="#10b981" />;
      case 'warning':
      case 'error':
        return <AlertTriangle size={18} color="#ef4444" />;
      default:
        return <Info size={18} color="#2563eb" />;
    }
  };

  const getTimeAgo = (dateStr: string) => {
    if (!dateStr) return '';
    const diffMs = new Date().getTime() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Bell size={20} color="#0B1536" />
              <Text style={styles.title}>Notifications</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator size="large" color="#2563eb" style={{ marginVertical: 30 }} />
          ) : notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Bell size={36} color="#cbd5e1" />
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 12 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.notifItem, !item.read && styles.unreadItem]}
                  onPress={() => handleMarkRead(item.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.iconCircle}>
                    {renderIcon(item.type)}
                  </View>
                  <View style={styles.notifContent}>
                    <View style={styles.notifHeader}>
                      <Text style={styles.notifTitle}>{item.title}</Text>
                      <Text style={styles.notifTime}>{getTimeAgo(item.createdAt)}</Text>
                    </View>
                    <Text style={styles.notifMsg}>{item.message}</Text>
                  </View>
                  {!item.read && <View style={styles.unreadDot} />}
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 21, 54, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    minHeight: '50%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0B1536',
  },
  closeBtn: {
    padding: 6,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  unreadItem: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notifContent: {
    flex: 1,
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  notifTime: {
    fontSize: 11,
    color: '#94a3b8',
  },
  notifMsg: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563eb',
    marginLeft: 8,
  },
});
