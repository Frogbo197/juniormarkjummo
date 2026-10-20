import { t, useLanguage, localize } from '../i18n/language'
import { catalog } from '../data/catalog'
export default function Hero() {
  useLanguage()
  const hero = catalog.editorial_entries.filter(e => e.section === 'hero')
  return <section className="hero-section" id="studio" aria-labelledby="home-title">
    <div className="eyebrow-pill"><img src="/images/figma/96c9d.svg" width="12" height="14" alt="" /> {t("TẦN SỐ NỬA ĐÊM • PHÒNG THU 432 HZ", "MIDNIGHT FREQUENCY • 432 HZ STUDIO ROOM")}</div>
    <h1 id="home-title">{t("TIỆM ĐĨA GIỮA NHỮNG VÌ SAO", "THE CELESTIAL RECORD STORE")}</h1>
    <p className="hero-subtitle">{t("Giai điệu từ Mark, câu chuyện từ Junior", "Music from Mark, Stories from Junior")}<br className="mobile-break" /> {t("• Jummo dẫn lối dưới bầu trời sao", "• Guided by Jummo under starry skies")}</p>
    <div className="hero-photos">
      {hero.map((item,i) => <a className={'hero-photo ' + (i % 2 ? 'blue-photo' : 'gold-photo')} href={i % 2 ? '#/media' : '#/profiles'} key={item.id}>
        <img className="photo" src={item.image} alt={localize(item.title)} fetchPriority="high" />
        <span className="photo-badge">{localize(item.tag)}</span>
        <div className="photo-caption"><small>{localize(item.subtitle)}</small><h2>{localize(item.title)}</h2><p>{localize(item.body)}</p></div>
      </a>)}
    </div>
  </section>
}


