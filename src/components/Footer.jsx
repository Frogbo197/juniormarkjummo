import { t, useLanguage } from '../i18n/language'
import ThemeToggle from './ThemeToggle'

export default function Footer() {
  useLanguage()
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div>
            <h2>{t("✧ Tiệm đĩa giữa những vì sao", "✧ The Celestial Record Store")}</h2>
            <p>
              {t("Giai điệu từ Mark, câu chuyện từ Junior, Jummo dẫn lối", "Music from Mark, Stories from Junior, Guided by Jummo")}
              <br />
              {t("dưới những chòm sao đêm.", "under midnight constellations.")}
            </p>
          </div>
          <div className="footer-links">
            <a href="https://www.gmm-tv.com/" target="_blank" rel="noreferrer">
              GMMTV
            </a>
            <a href="https://www.youtube.com/@gmmtv" target="_blank" rel="noreferrer">
              YouTube
            </a>
            <a href="https://x.com/GMMTV" target="_blank" rel="noreferrer">
              X (Twitter)
            </a>
            <a href="https://open.spotify.com/search/JuniorMark" target="_blank" rel="noreferrer">
              Spotify
            </a>
            <ThemeToggle />
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} {t('Cộng đồng JuniorMark. Được tạo nên bằng ánh sao và yêu thương.', 'JuniorMark Fanclub. Crafted with starlight & love.')}</p>
          <p>{t("Trang người hâm mộ không chính thức • Nguồn ảnh trong thư viện", "Unofficial fansite • Photo credits in the gallery")}</p>
          <div className="footer-extra">
            <a href="/beta.html">{t("Thử và góp ý", "Beta feedback")}</a>
            <a href="#/profiles/junior">{t("Ghi chú bên đĩa nhạc", "Liner Notes")}</a>
            <a href="#/studio?section=record-player">{t("Tần số vũ trụ", "Cosmic Frequency")}</a>
            <a href="#/jummo">{t("Câu chuyện linh vật Jummo", "Jummo Mascot Lore")}</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
