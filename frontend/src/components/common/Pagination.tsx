import { useTranslation } from 'react-i18next';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisiblePages?: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 10,
}: PaginationProps) {
  const { t } = useTranslation();

  if (totalPages <= 1) return null;

  // 표시할 페이지 번호 계산
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];

    if (totalPages <= maxVisiblePages) {
      // 전체 페이지가 maxVisiblePages 이하면 모두 표시
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 현재 페이지를 중심으로 페이지 번호 계산
      const halfVisible = Math.floor((maxVisiblePages - 2) / 2); // 첫/끝 페이지 제외
      let startPage = Math.max(2, currentPage - halfVisible);
      let endPage = Math.min(totalPages - 1, currentPage + halfVisible);

      // 표시할 중간 페이지 수 조정
      const middlePages = maxVisiblePages - 2; // 첫/끝 페이지 제외
      if (endPage - startPage + 1 < middlePages) {
        if (startPage === 2) {
          endPage = Math.min(totalPages - 1, startPage + middlePages - 1);
        } else if (endPage === totalPages - 1) {
          startPage = Math.max(2, endPage - middlePages + 1);
        }
      }

      // 첫 페이지는 항상 표시
      pages.push(1);

      // 첫 페이지와 startPage 사이에 간격이 있으면 ellipsis
      if (startPage > 2) {
        pages.push('ellipsis');
      }

      // 중간 페이지들
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      // endPage와 마지막 페이지 사이에 간격이 있으면 ellipsis
      if (endPage < totalPages - 1) {
        pages.push('ellipsis');
      }

      // 마지막 페이지는 항상 표시
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex justify-center items-center gap-1 mt-6">
      <button
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {t('common.prev')}
      </button>

      <div className="flex items-center gap-1 mx-2">
        {pageNumbers.map((pageNum, index) =>
          pageNum === 'ellipsis' ? (
            <span
              key={`ellipsis-${index}`}
              className="px-2 py-2 text-gray-500 dark:text-gray-400"
            >
              ...
            </span>
          ) : (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`min-w-[36px] px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentPage === pageNum
                  ? 'bg-primary-600 text-white'
                  : 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {pageNum}
            </button>
          )
        )}
      </div>

      <button
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {t('common.next')}
      </button>
    </div>
  );
}
