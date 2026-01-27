import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function Home() {
  const { t } = useTranslation();

  const techStack = {
    backend: ['NestJS', 'Prisma (PostgreSQL)', 'Socket.IO', 'JWT Authentication'],
    frontend: ['React + TypeScript', 'Vite', 'Tailwind CSS', 'TanStack Query', 'Zustand', 'Lightweight Charts'],
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* 프로젝트 헤더 */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          {t('home.title')}
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          {t('home.subtitle')}
        </p>
      </div>

      {/* 코인 리스트 이동 버튼 */}
      <div className="flex justify-center mb-12">
        <Link
          to="/coins"
          className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <svg
            className="w-6 h-6 mr-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
          {t('home.viewCoins')}
        </Link>
      </div>

      {/* 프로젝트 설명 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {t('home.overview')}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
          {t('home.description')}
        </p>

        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          {t('home.features')}
        </h3>
        <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
          <li>{t('home.feature1')}</li>
          <li>{t('home.feature2')}</li>
          <li>{t('home.feature3')}</li>
          <li>{t('home.feature4')}</li>
          <li>{t('home.feature5')}</li>
        </ul>
      </div>

      {/* 기술 스택 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {t('home.techStack')}
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Backend
            </h3>
            <ul className="space-y-2">
              {techStack.backend.map((tech, index) => (
                <li
                  key={index}
                  className="flex items-center text-gray-600 dark:text-gray-300"
                >
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  {tech}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
              </svg>
              Frontend
            </h3>
            <ul className="space-y-2">
              {techStack.frontend.map((tech, index) => (
                <li
                  key={index}
                  className="flex items-center text-gray-600 dark:text-gray-300"
                >
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  {tech}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* GitHub 링크 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {t('home.github')}
        </h2>
        <a
          href="https://github.com/sknskin/project_coin"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-lg font-medium transition-colors"
        >
          <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
          </svg>
          github.com/sknskin/project_coin
        </a>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
          {t('home.license')}
        </p>
      </div>
    </div>
  );
}
