import { useLanguage } from '../i18n/language'
import LanguageSelect from './LanguageSelect'

// Lỗi kết nối vẫn cho chọn ngôn ngữ; không thay dữ liệu thật bằng dữ liệu mẫu.
export default function StartupError({ detail }) {
  const { t } = useLanguage()
  return <main className="startup-error">
    <LanguageSelect />
    <h1>{t('Chưa tải được nội dung', 'Content could not be loaded')}</h1>
    <p role="alert">{t('Chưa kết nối được với máy chủ. Vui lòng thử lại sau.', 'Could not connect to the server. Please try again later.')}</p>
    {detail && <p className="muted">{detail}</p>}
    <button onClick={() => location.reload()}>{t('Thử lại', 'Try again')}</button>
  </main>
}

