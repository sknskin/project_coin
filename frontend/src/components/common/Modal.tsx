import { useEffect, useRef, useCallback } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  autoFocus?: boolean;
}

export default function Modal({ isOpen, onClose, title, children, autoFocus = true }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  const focusFirstInput = useCallback(() => {
    if (!modalRef.current || !autoFocus) return;

    // 약간의 지연 후 첫 번째 입력 요소에 포커스
    requestAnimationFrame(() => {
      const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
        'input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled])'
      );

      if (focusableElements && focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    });
  }, [autoFocus]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      // 현재 포커스된 요소 저장
      previousActiveElement.current = document.activeElement;

      // 스크롤바 너비 계산
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      // HTML 요소에도 스타일 적용하여 레이아웃 시프트 방지
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.paddingRight = `${scrollbarWidth}px`;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;

      document.addEventListener('keydown', handleEscape);

      // 첫 번째 입력 요소에 포커스
      focusFirstInput();
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.documentElement.style.overflow = '';
      document.documentElement.style.paddingRight = '';
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';

      // 모달 닫힐 때 이전 요소로 포커스 복원
      if (previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, onClose, focusFirstInput]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      <div
        ref={modalRef}
        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
