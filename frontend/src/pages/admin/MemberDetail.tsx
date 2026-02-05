import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { adminApi } from '../../api/admin.api';
import { useAuthStore } from '../../store/authStore';
import ConfirmModal from '../../components/common/ConfirmModal';
import type { UserRole, UserStatus, LoginHistory } from '../../types/admin.types';

export default function MemberDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('USER');
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-user', id],
    queryFn: () => adminApi.getUserDetail(id!),
    enabled: !!id,
  });

  const userData = data?.data;
  const isSystem = user?.role === 'SYSTEM';

  const approveMutation = useMutation({
    mutationFn: () => adminApi.approveUser(id!, selectedRole),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setShowApprovalModal(false);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => adminApi.rejectUser(id!, rejectReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setShowRejectModal(false);
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: UserStatus) => adminApi.updateUserStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setShowStatusModal(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteUser(id!),
    onSuccess: () => {
      navigate('/admin/members');
    },
  });

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    deleteMutation.mutate();
    setShowDeleteModal(false);
  };

  const handleToggleStatus = () => {
    setShowStatusModal(true);
  };

  const handleStatusConfirm = () => {
    if (!userData) return;
    const newStatus: UserStatus = userData.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    statusMutation.mutate(newStatus);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getBadge = (type: string, value: string) => {
    const colorMap: Record<string, Record<string, string>> = {
      role: {
        ADMIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
        SYSTEM: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        USER: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      },
      status: {
        ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        INACTIVE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      },
      approval: {
        APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      },
    };
    const translationMap: Record<string, string> = {
      role: `roles.${value.toLowerCase()}`,
      status: `status.${value.toLowerCase()}`,
      approval: `approvalStatus.${value.toLowerCase()}`,
    };
    return (
      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colorMap[type]?.[value] || 'bg-gray-100 text-gray-800'}`}>
        {t(translationMap[type])}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-600">{t('admin.userNotFound')}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <button
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            onClick={() => navigate('/admin/members')}
          >
            &larr; {t('common.back')}
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('admin.memberDetail')}</h1>
        </div>
        <div className="flex items-center justify-between mt-1 min-h-[36px]">
          <p className="text-gray-600 dark:text-gray-400">{userData.email}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('admin.basicInfo')}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          {[
            { label: t('admin.email'), value: userData.email },
            { label: t('admin.username'), value: userData.username },
            { label: t('admin.name'), value: userData.name },
            { label: t('admin.nickname'), value: userData.nickname || '-' },
            { label: t('admin.phone'), value: userData.phone || '-' },
            { label: t('admin.address'), value: userData.address || '-' },
            { label: t('admin.ssn'), value: userData.ssnMasked || '-' },
          ].map((item) => (
            <div key={item.label} className="flex items-center py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="w-28 text-sm font-medium text-gray-500 dark:text-gray-400">{item.label}</span>
              <span className="text-sm text-gray-900 dark:text-white">{item.value}</span>
            </div>
          ))}

          <div className="flex items-center py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="w-28 text-sm font-medium text-gray-500 dark:text-gray-400">{t('admin.role')}</span>
            {getBadge('role', userData.role)}
          </div>
          <div className="flex items-center py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="w-28 text-sm font-medium text-gray-500 dark:text-gray-400">{t('admin.status')}</span>
            {getBadge('status', userData.status)}
          </div>
          <div className="flex items-center py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="w-28 text-sm font-medium text-gray-500 dark:text-gray-400">{t('admin.approval')}</span>
            {getBadge('approval', userData.approvalStatus)}
          </div>

          {[
            { label: t('admin.joinDate'), value: formatDate(userData.createdAt) },
            { label: t('admin.lastLogin'), value: formatDate(userData.lastLoginAt || undefined) },
          ].map((item) => (
            <div key={item.label} className="flex items-center py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="w-28 text-sm font-medium text-gray-500 dark:text-gray-400">{item.label}</span>
              <span className="text-sm text-gray-900 dark:text-white">{item.value}</span>
            </div>
          ))}
        </div>

        {userData.approvalStatus === 'REJECTED' && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <h3 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">{t('admin.rejectInfo')}</h3>
            <p className="text-sm text-red-700 dark:text-red-400">
              <strong>{t('admin.rejectedAt')}:</strong> {formatDate(userData.rejectedAt || undefined)}
            </p>
            {userData.rejectReason && (
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                <strong>{t('admin.rejectReason')}:</strong> {userData.rejectReason}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('admin.actions')}</h2>

        <div className="flex flex-wrap gap-2">
          {userData.approvalStatus === 'PENDING' && (
            <>
              <button
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                onClick={() => setShowApprovalModal(true)}
              >
                {t('admin.approve')}
              </button>
              <button
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium transition-colors"
                onClick={() => setShowRejectModal(true)}
              >
                {t('admin.reject')}
              </button>
            </>
          )}

          {userData.approvalStatus === 'APPROVED' && (
            <button
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              onClick={handleToggleStatus}
            >
              {userData.status === 'ACTIVE' ? t('admin.deactivate') : t('admin.activate')}
            </button>
          )}

          {userData.approvalStatus === 'REJECTED' && isSystem && (
            <>
            <button
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                onClick={() => setShowApprovalModal(true)}
              >
                {t('admin.approve')}
              </button>
            </>
          )}

          <button
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
            onClick={handleDelete}
          >
            {t('admin.forceDelete')}
          </button>
        </div>
      </div>

      {userData.loginHistories && userData.loginHistories.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('admin.loginHistory')}</h2>
          <div className="space-y-2">
            {userData.loginHistories.slice(0, 10).map((history: LoginHistory, index: number) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 text-sm">
                <span className="text-gray-900 dark:text-white">{formatDate(history.loginAt)}</span>
                <span className="text-gray-500 dark:text-gray-400">{history.ipAddress || '-'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowApprovalModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('admin.approveTitle')}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t('admin.selectRole')}</p>
            <div className="flex flex-col gap-2 mb-4">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="radio" name="role" value="USER" checked={selectedRole === 'USER'} onChange={() => setSelectedRole('USER')} />
                {t('roles.user')}
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="radio" name="role" value="ADMIN" checked={selectedRole === 'ADMIN'} onChange={() => setSelectedRole('ADMIN')} />
                {t('roles.admin')}
              </label>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                onClick={() => approveMutation.mutate()}
                disabled={approveMutation.isPending}
              >
                {t('admin.approve')}
              </button>
              <button
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                onClick={() => setShowApprovalModal(false)}
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowRejectModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('admin.rejectTitle')}</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('admin.rejectReasonLabel')}</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none"
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={t('admin.rejectReasonPlaceholder')}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                onClick={() => rejectMutation.mutate()}
                disabled={rejectMutation.isPending}
              >
                {t('admin.reject')}
              </button>
              <button
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                onClick={() => setShowRejectModal(false)}
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title={t('admin.forceDelete')}
        message={t('admin.confirmDelete')}
        confirmText={t('admin.forceDelete')}
        cancelText={t('common.cancel')}
        variant="danger"
      />

      {/* Status Change Confirm Modal */}
      <ConfirmModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        onConfirm={handleStatusConfirm}
        title={userData?.status === 'ACTIVE' ? t('admin.deactivate') : t('admin.activate')}
        message={t('admin.confirmStatusChange')}
        confirmText={t('common.confirm')}
        cancelText={t('common.cancel')}
        variant="warning"
      />
    </div>
  );
}
