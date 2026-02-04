import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../common/Modal';
import ConfirmModal from '../common/ConfirmModal';
import { useUIStore } from '../../store/uiStore';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../api/auth.api';

// 한글 -> 영어 키보드 매핑
const koreanToEnglish: { [key: string]: string } = {
  'ㅂ': 'q', 'ㅈ': 'w', 'ㄷ': 'e', 'ㄱ': 'r', 'ㅅ': 't', 'ㅛ': 'y', 'ㅕ': 'u', 'ㅑ': 'i', 'ㅐ': 'o', 'ㅔ': 'p',
  'ㅁ': 'a', 'ㄴ': 's', 'ㅇ': 'd', 'ㄹ': 'f', 'ㅎ': 'g', 'ㅗ': 'h', 'ㅓ': 'j', 'ㅏ': 'k', 'ㅣ': 'l',
  'ㅋ': 'z', 'ㅌ': 'x', 'ㅊ': 'c', 'ㅍ': 'v', 'ㅠ': 'b', 'ㅜ': 'n', 'ㅡ': 'm',
  'ㅃ': 'Q', 'ㅉ': 'W', 'ㄸ': 'E', 'ㄲ': 'R', 'ㅆ': 'T', 'ㅒ': 'O', 'ㅖ': 'P',
  '가': 'rk', '나': 'sk', '다': 'ek', '라': 'fk', '마': 'ak', '바': 'qk', '사': 'tk', '아': 'dk', '자': 'wk', '차': 'ck', '카': 'zk', '타': 'xk', '파': 'vk', '하': 'gk',
};

// 한글 문자를 영어로 변환하는 함수
const convertKoreanToEnglish = (text: string): string => {
  let result = '';
  for (const char of text) {
    if (koreanToEnglish[char]) {
      result += koreanToEnglish[char];
    } else if (/[가-힣]/.test(char)) {
      // 복잡한 한글 문자는 건너뛰고 영어/숫자만 유지
      continue;
    } else if (/^[a-zA-Z0-9@._\-+]$/.test(char)) {
      result += char;
    }
  }
  return result;
};

interface FormErrors {
  email?: string;
  username?: string;
  password?: string;
  passwordConfirm?: string;
  nickname?: string;
  name?: string;
  phone?: string;
  address?: string;
  ssn?: string;
}

export default function AuthModal() {
  const { t } = useTranslation();
  const { isAuthModalOpen, authModalMode, closeAuthModal, setAuthModalMode } = useUIStore();
  const { login, register, isLoggingIn, isRegistering, loginError, registerError, registerSuccess, registerData, resetRegister } = useAuth();

  // 로그인 폼
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberUsername, setRememberUsername] = useState(false);

  // refs for focus management
  const usernameInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // 회원가입 폼
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [nickname, setNickname] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [ssnFirst, setSsnFirst] = useState('');
  const [ssnSecond, setSsnSecond] = useState('');

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // 회원가입 성공 시 처리
  useEffect(() => {
    if (registerSuccess && registerData) {
      setIsSuccessModalOpen(true);
    }
  }, [registerSuccess, registerData]);

  // 모달이 열릴 때 저장된 아이디 불러오기 및 포커스 설정
  useEffect(() => {
    if (isAuthModalOpen && authModalMode === 'login') {
      const savedUsername = localStorage.getItem('savedUsername');
      const savedRemember = localStorage.getItem('rememberUsername') === 'true';

      if (savedRemember && savedUsername) {
        setEmailOrUsername(savedUsername);
        setRememberUsername(true);
        // 아이디가 저장되어 있으면 비밀번호 입력으로 포커스
        setTimeout(() => {
          passwordInputRef.current?.focus();
        }, 100);
      } else {
        setRememberUsername(false);
        // 아이디가 저장되어 있지 않으면 아이디 입력으로 포커스
        setTimeout(() => {
          usernameInputRef.current?.focus();
        }, 100);
      }
    }
  }, [isAuthModalOpen, authModalMode]);

  const validatePassword = (pwd: string): string | undefined => {
    if (pwd.length < 10) {
      return t('auth.passwordTooShort');
    }
    if (!/[A-Za-z]/.test(pwd)) {
      return t('auth.passwordNoLetter');
    }
    if (!/\d/.test(pwd)) {
      return t('auth.passwordNoNumber');
    }
    if (!/[@$!%*#?&]/.test(pwd)) {
      return t('auth.passwordNoSpecial');
    }
    return undefined;
  };

  const validateForm = async (): Promise<boolean> => {
    const errors: FormErrors = {};

    // 이메일 검증
    if (!email) {
      errors.email = t('auth.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = t('auth.emailInvalid');
    } else {
      try {
        const { available } = await authApi.checkEmail(email);
        if (!available) {
          errors.email = t('auth.emailTaken');
        }
      } catch {
        // 네트워크 오류 무시
      }
    }

    // 아이디 검증
    if (!username) {
      errors.username = t('auth.usernameRequired');
    } else if (username.length < 4) {
      errors.username = t('auth.usernameTooShort');
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.username = t('auth.usernameInvalid');
    } else {
      try {
        const { available } = await authApi.checkUsername(username);
        if (!available) {
          errors.username = t('auth.usernameTaken');
        }
      } catch {
        // 네트워크 오류 무시
      }
    }

    // 비밀번호 검증
    const passwordError = validatePassword(password);
    if (passwordError) {
      errors.password = passwordError;
    }

    // 비밀번호 확인 검증
    if (password !== passwordConfirm) {
      errors.passwordConfirm = t('auth.passwordMismatch');
    }

    // 닉네임 검증 (선택값이지만 입력 시 중복 체크)
    if (nickname) {
      try {
        const { available } = await authApi.checkNickname(nickname);
        if (!available) {
          errors.nickname = t('auth.nicknameTaken');
        }
      } catch {
        // 네트워크 오류 무시
      }
    }

    // 성명 검증
    if (!name || name.length < 2) {
      errors.name = t('auth.nameRequired');
    }

    // 연락처 검증 (숫자만, 하이픈 없음)
    if (!phone) {
      errors.phone = t('auth.phoneRequired');
    } else if (!/^[0-9]+$/.test(phone) || phone.length < 10 || phone.length > 11) {
      errors.phone = t('auth.phoneInvalid');
    }

    // 주소 검증
    if (!address || address.length < 5) {
      errors.address = t('auth.addressRequired');
    }

    // 주민등록번호 검증
    if (!ssnFirst || ssnFirst.length !== 6 || !/^\d{6}$/.test(ssnFirst)) {
      errors.ssn = t('auth.ssnInvalid');
    } else if (!ssnSecond || ssnSecond.length !== 7 || !/^\d{7}$/.test(ssnSecond)) {
      errors.ssn = t('auth.ssnInvalid');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 아이디 저장 처리
    if (rememberUsername) {
      localStorage.setItem('savedUsername', emailOrUsername);
      localStorage.setItem('rememberUsername', 'true');
    } else {
      localStorage.removeItem('savedUsername');
      localStorage.setItem('rememberUsername', 'false');
    }
    login({ emailOrUsername, password: loginPassword });
  };

  // 아이디 입력 핸들러 (한글 -> 영어 자동 변환)
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 한글이 포함되어 있으면 영어로 변환
    const converted = convertKoreanToEnglish(value);
    // 영어, 숫자, 이메일 관련 특수문자만 허용
    const filtered = converted.replace(/[^a-zA-Z0-9@._\-+]/g, '');
    setEmailOrUsername(filtered);
  };

  // IME 조합 이벤트 처리 (한글 입력 완료 시 변환)
  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value;
    const converted = convertKoreanToEnglish(value);
    const filtered = converted.replace(/[^a-zA-Z0-9@._\-+]/g, '');
    setEmailOrUsername(filtered);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = await validateForm();
    if (isValid) {
      setIsConfirmModalOpen(true);
    }
  };

  const handleRegisterConfirm = async () => {
    setIsConfirmModalOpen(false);
    try {
      await register({
        email,
        username,
        password,
        nickname: nickname || undefined,
        name,
        phone,
        address,
        ssn: `${ssnFirst}-${ssnSecond}`,
      });
    } catch {
      // Error is handled by the hook
    }
  };

  const handleSuccessClose = () => {
    setIsSuccessModalOpen(false);
    resetRegister();
    closeAuthModal();
    // 폼 초기화
    setEmail('');
    setUsername('');
    setPassword('');
    setPasswordConfirm('');
    setNickname('');
    setName('');
    setPhone('');
    setAddress('');
    setSsnFirst('');
    setSsnSecond('');
    setFormErrors({});
  };

  const switchMode = () => {
    setAuthModalMode(authModalMode === 'login' ? 'register' : 'login');
    setFormErrors({});
  };

  const error = authModalMode === 'login' ? loginError : registerError;
  const isLoading = authModalMode === 'login' ? isLoggingIn : isRegistering;

  return (
    <Modal
      isOpen={isAuthModalOpen}
      onClose={closeAuthModal}
      title={authModalMode === 'login' ? t('auth.login') : t('auth.register')}
      size={authModalMode === 'register' ? 'xl' : 'md'}
      autoFocus={false}
    >
      {authModalMode === 'login' ? (
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label htmlFor="emailOrUsername" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t('auth.emailOrUsername')}
            </label>
            <input
              ref={usernameInputRef}
              type="text"
              id="emailOrUsername"
              value={emailOrUsername}
              onChange={handleUsernameChange}
              onCompositionEnd={handleCompositionEnd}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
              autoComplete="username"
              style={{ imeMode: 'disabled' }}
            />
          </div>

          <div>
            <label htmlFor="loginPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t('auth.password')}
            </label>
            <input
              ref={passwordInputRef}
              type="password"
              id="loginPassword"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value.replace(/[ㄱ-ㅎㅏ-ㅣ가-힣]/g, ''))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
              autoComplete="current-password"
            />
          </div>

          <div className="flex">
            <label htmlFor="rememberUsername" className="inline-flex items-center cursor-pointer select-none group">
              <div className="relative">
                <input
                  type="checkbox"
                  id="rememberUsername"
                  checked={rememberUsername}
                  onChange={(e) => setRememberUsername(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-4 h-4 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 peer-checked:bg-primary-600 peer-checked:border-primary-600 transition-colors peer-focus:ring-2 peer-focus:ring-primary-500 peer-focus:ring-offset-1 dark:peer-focus:ring-offset-gray-800">
                  <svg
                    className={`w-4 h-4 text-white ${rememberUsername ? 'opacity-100' : 'opacity-0'} transition-opacity`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
                {t('auth.rememberUsername')}
              </span>
            </label>
          </div>

          {error && (
            <p className="text-sm text-red-600 whitespace-pre-line">
              {(error as Error).message || t('auth.error')}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? t('auth.processing') : t('auth.login')}
          </button>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            {t('auth.noAccount')}{' '}
            <button type="button" onClick={switchMode} className="text-primary-600 hover:underline">
              {t('auth.register')}
            </button>
          </p>
        </form>
      ) : (
        <form onSubmit={handleRegisterSubmit} className="space-y-3">
          {/* 이메일, 아이디 - 2열 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('auth.email')} <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm ${formErrors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                required
                autoComplete="email"
              />
              {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('auth.username')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('auth.usernameHint')}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm ${formErrors.username ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                required
                autoComplete="username"
              />
              {formErrors.username && <p className="text-xs text-red-500 mt-1">{formErrors.username}</p>}
            </div>
          </div>

          {/* 비밀번호, 비밀번호 확인 - 2열 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('auth.password')} <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value.replace(/[ㄱ-ㅎㅏ-ㅣ가-힣]/g, ''))}
                placeholder={t('auth.passwordHint')}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm ${formErrors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                required
                autoComplete="new-password"
              />
              {formErrors.password && <p className="text-xs text-red-500 mt-1">{formErrors.password}</p>}
            </div>

            <div>
              <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('auth.passwordConfirm')} <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="passwordConfirm"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value.replace(/[ㄱ-ㅎㅏ-ㅣ가-힣]/g, ''))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm ${formErrors.passwordConfirm ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                required
                autoComplete="new-password"
              />
              {formErrors.passwordConfirm && <p className="text-xs text-red-500 mt-1">{formErrors.passwordConfirm}</p>}
            </div>
          </div>

          {/* 성명, 닉네임 - 2열 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('auth.name')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm ${formErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                required
                autoComplete="name"
              />
              {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
            </div>

            <div>
              <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('auth.nicknameOptional')}
              </label>
              <input
                type="text"
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm ${formErrors.nickname ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                autoComplete="nickname"
              />
              {formErrors.nickname && <p className="text-xs text-red-500 mt-1">{formErrors.nickname}</p>}
            </div>
          </div>

          {/* 연락처, 주민등록번호 - 2열 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('auth.phone')} <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="01012345678"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm ${formErrors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                required
                autoComplete="tel"
                maxLength={11}
              />
              {formErrors.phone && <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>}
            </div>

            <div>
              <label htmlFor="ssn" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('auth.ssn')} <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  id="ssnFirst"
                  value={ssnFirst}
                  onChange={(e) => setSsnFirst(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="900101"
                  className={`flex-1 px-2 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm ${formErrors.ssn ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                  required
                  maxLength={6}
                />
                <span className="text-gray-500">-</span>
                <input
                  type="password"
                  id="ssnSecond"
                  value={ssnSecond}
                  onChange={(e) => setSsnSecond(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="*******"
                  className={`flex-1 px-2 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm ${formErrors.ssn ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                  required
                  maxLength={7}
                />
              </div>
              {formErrors.ssn && <p className="text-xs text-red-500 mt-1">{formErrors.ssn}</p>}
            </div>
          </div>

          {/* 주소 - 전체 너비 */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('auth.address')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm ${formErrors.address ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
              required
              autoComplete="street-address"
            />
            {formErrors.address && <p className="text-xs text-red-500 mt-1">{formErrors.address}</p>}
          </div>

          {error && (
            <p className="text-sm text-red-600 whitespace-pre-line">
              {(error as Error).message || t('auth.error')}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? t('auth.processing') : t('auth.register')}
          </button>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            {t('auth.hasAccount')}{' '}
            <button type="button" onClick={switchMode} className="text-primary-600 hover:underline">
              {t('auth.login')}
            </button>
          </p>
        </form>
      )}

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleRegisterConfirm}
        title={t('auth.register')}
        message={t('auth.registerConfirm', { email })}
        confirmText={t('auth.register')}
        cancelText={t('common.cancel')}
        isLoading={isRegistering}
      />

      <ConfirmModal
        isOpen={isSuccessModalOpen}
        onClose={handleSuccessClose}
        onConfirm={handleSuccessClose}
        title={t('auth.registerSuccess')}
        message={registerData?.message || t('auth.registerSuccessMessage')}
        confirmText={t('common.confirm')}
        showCancel={false}
      />
    </Modal>
  );
}
