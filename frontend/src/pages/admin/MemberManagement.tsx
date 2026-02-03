import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/admin.api';
import Pagination from '../../components/common/Pagination';
import type { UserFilter, UserRole, UserStatus, ApprovalStatus, AdminUser } from '../../types/admin.types';

type SortKey = 'email' | 'username' | 'nickname' | 'role' | 'status' | 'approval' | 'joinDate' | 'lastLogin';
type SortDirection = 'asc' | 'desc' | 'none';

export default function MemberManagement() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [filter, setFilter] = useState<UserFilter>({});
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('none');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', filter],
    queryFn: () => adminApi.getUsers(filter),
  });

  const users = data?.data || [];

  const handleSearch = () => {
    setFilter((prev) => ({
      ...prev,
      search: searchText || undefined,
    }));
    setPage(1);
  };

  const handleFilterChange = (
    key: keyof UserFilter,
    value: string | undefined
  ) => {
    setFilter((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
    setPage(1);
  };

  const handleUserClick = (userId: string) => {
    navigate(`/admin/members/${userId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const getStatusBadge = (status: UserStatus) => {
    const isActive = status === 'ACTIVE';
    return (
      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}`}>
        {t(`status.${status.toLowerCase()}`)}
      </span>
    );
  };

  const getApprovalBadge = (status: ApprovalStatus) => {
    const colors: Record<string, string> = {
      APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    };
    return (
      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colors[status] || colors.PENDING}`}>
        {t(`approvalStatus.${status.toLowerCase()}`)}
      </span>
    );
  };

  const getRoleBadge = (role: UserRole) => {
    const colors: Record<string, string> = {
      ADMIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      SYSTEM: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      USER: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };
    return (
      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colors[role] || colors.USER}`}>
        {t(`roles.${role.toLowerCase()}`)}
      </span>
    );
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      if (sortDirection === 'none') {
        setSortDirection('asc');
      } else if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortDirection('none');
        setSortKey(null);
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (key: SortKey) => {
    if (sortKey !== key || sortDirection === 'none') {
      return (
        <span className="ml-1 text-gray-400">
          <svg className="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </span>
      );
    }
    if (sortDirection === 'asc') {
      return (
        <span className="ml-1 text-primary-600 dark:text-primary-400">
          <svg className="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </span>
      );
    }
    return (
      <span className="ml-1 text-primary-600 dark:text-primary-400">
        <svg className="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </span>
    );
  };

  // 역할 우선순위: SYSTEM > ADMIN > USER
  const rolePriority: Record<string, number> = {
    SYSTEM: 0,
    ADMIN: 1,
    USER: 2,
  };

  const sortedUsers = useMemo(() => {
    // 기본 정렬: 역할 우선순위 순서
    if (!sortKey || sortDirection === 'none') {
      return [...users].sort((a, b) => {
        const priorityA = rolePriority[a.role] ?? 99;
        const priorityB = rolePriority[b.role] ?? 99;
        if (priorityA !== priorityB) return priorityA - priorityB;
        // 같은 역할이면 가입일 내림차순
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    return [...users].sort((a, b) => {
      let comparison = 0;

      switch (sortKey) {
        case 'email':
          comparison = a.email.localeCompare(b.email);
          break;
        case 'username':
          comparison = a.username.localeCompare(b.username);
          break;
        case 'nickname':
          comparison = (a.nickname || '').localeCompare(b.nickname || '');
          break;
        case 'role':
          comparison = a.role.localeCompare(b.role);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'approval':
          comparison = a.approvalStatus.localeCompare(b.approvalStatus);
          break;
        case 'joinDate':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'lastLogin':
          comparison = new Date(a.lastLoginAt || 0).getTime() - new Date(b.lastLoginAt || 0).getTime();
          break;
      }

      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }, [users, sortKey, sortDirection]);

  const totalPages = Math.ceil(sortedUsers.length / pageSize);
  const paginatedUsers = sortedUsers.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('admin.memberManagement')}</h1>
        <div className="flex items-center justify-between mt-1 min-h-[36px]">
          <p className="text-gray-600 dark:text-gray-400">{t('admin.memberManagementSubtitle')}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('admin.statusFilter')}</label>
            <select
              value={filter.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value as UserStatus)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="">{t('common.all')}</option>
              <option value="ACTIVE">{t('status.active')}</option>
              <option value="INACTIVE">{t('status.inactive')}</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('admin.approvalFilter')}</label>
            <select
              value={filter.approvalStatus || ''}
              onChange={(e) => handleFilterChange('approvalStatus', e.target.value as ApprovalStatus)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="">{t('common.all')}</option>
              <option value="PENDING">{t('approvalStatus.pending')}</option>
              <option value="APPROVED">{t('approvalStatus.approved')}</option>
              <option value="REJECTED">{t('approvalStatus.rejected')}</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('admin.roleFilter')}</label>
            <select
              value={filter.role || ''}
              onChange={(e) => handleFilterChange('role', e.target.value as UserRole)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="">{t('common.all')}</option>
              <option value="USER">{t('roles.user')}</option>
              <option value="ADMIN">{t('roles.admin')}</option>
              <option value="SYSTEM">{t('roles.system')}</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder={t('admin.searchPlaceholder')}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          />
          <button
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
            onClick={handleSearch}
          >
            {t('common.search')}
          </button>
          <button
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            onClick={() => {
              setFilter({});
              setSearchText('');
              setPage(1);
            }}
          >
            {t('common.reset')}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {t('admin.totalUsers')}: <strong>{users.length}</strong>
        </div>
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(1);
          }}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        >
          <option value={10}>{t('common.viewPerPage', { count: 10 })}</option>
          <option value={20}>{t('common.viewPerPage', { count: 20 })}</option>
          <option value={50}>{t('common.viewPerPage', { count: 50 })}</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  {([
                    ['email', t('admin.email')],
                    ['username', t('admin.username')],
                    ['nickname', t('admin.nickname')],
                    ['role', t('admin.role')],
                    ['status', t('admin.status')],
                    ['approval', t('admin.approval')],
                    ['joinDate', t('admin.joinDate')],
                    ['lastLogin', t('admin.lastLogin')],
                  ] as [SortKey, string][]).map(([key, label]) => (
                    <th
                      key={key}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none"
                      onClick={() => handleSort(key)}
                    >
                      {label} {getSortIcon(key)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {paginatedUsers.map((user: AdminUser) => (
                  <tr
                    key={user.id}
                    onClick={() => handleUserClick(user.id)}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-900 dark:text-white">{user.email}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white">{user.username}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white">{user.nickname || '-'}</td>
                    <td className="px-4 py-3">{getRoleBadge(user.role)}</td>
                    <td className="px-4 py-3">{getStatusBadge(user.status)}</td>
                    <td className="px-4 py-3">{getApprovalBadge(user.approvalStatus)}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{user.lastLoginAt ? formatDate(user.lastLoginAt) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!isLoading && users.length === 0 && (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">{t('admin.noUsers')}</div>
      )}

      {!isLoading && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
