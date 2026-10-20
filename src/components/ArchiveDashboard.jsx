import { t, useLanguage, localize } from '../i18n/language'
import { memories, findMemory } from '../data/memories'
import { photos } from '../lib/photos'
import { dailyMemory, nearestBirthday, readJourney } from '../lib/journey'

export default function ArchiveDashboard() {
  useLanguage()
  const daily = dailyMemory(), birthday = nearestBirthday(), journey = readJourney()
  const last = findMemory(journey.lastMemory)
  if (!daily || !birthday) return <p>{t("Kho lưu trữ đang chờ nội dung mới.", "The archive is waiting for new content.")}</p>
  return <section className="archive-dashboard" aria-label={t("Hiện có trong kho lưu trữ", "Now in the Archive")}>
    <div className="dashboard-now glass-soft">
      <span className="eyebrow">{t("Chào mừng đến với vũ trụ người hâm mộ của bạn", "Welcome to your living fandom universe")}</span>
      <h2>{t("Hiện có trong kho lưu trữ", "Now in the Archive")}</h2>
      <p>{t(`${memories.length} kỷ niệm biên tập · ${photos.length} ảnh có nguồn`, `${memories.length} editorial memories · ${photos.length} credited photos`)}</p>
      <p>{t('Sinh nhật sắp tới:', 'Next birthday:')} <strong>{birthday.name}</strong> · {birthday.day}/{birthday.month}/{birthday.year}{birthday.today ? t(' · Hôm nay!', ' · Today!') : ''}</p>
      <a className="text-button" href="#/schedule">{t("Khám phá lịch kỷ niệm ↗", "Explore Orbit dates ↗")}</a>
    </div>
    <article className="dashboard-memory glass-medium">
      <span className="eyebrow">{t("Kỷ niệm hôm nay", "Memory of the day")}</span>
      <h2>{localize(daily.title)}</h2><p>{localize(daily.summary)}</p>
      <a className="primary-button" href={`#/timeline?memory=${daily.id}&era=${daily.era}`}>{t("Khám phá kỷ niệm này ↗", "Explore this memory ↗")}</a>
    </article>
    <div className="dashboard-continue glass-soft">
      <h3>{t("Tiếp tục hành trình của bạn", "Continue Your Journey")}</h3>
      <p>{last ? t(`Lần khám phá gần nhất: ${localize(last.title)}`, `Last explored: ${localize(last.title)}`) : t('Chương đầu tiên đang chờ bạn.', 'Your first chapter is waiting.')} · {t(`${journey.visited.length}/${memories.length} kỷ niệm đã khám phá trên trình duyệt này.`, `${journey.visited.length}/${memories.length} memories explored on this browser.`)}</p>
      <a className="text-button" href={`#/timeline?era=${last?.era || 'cherry'}`}>{last ? t('Trở lại kỷ niệm của bạn', 'Return to your memory') : t('Bắt đầu với Cherry Magic', 'Begin with Cherry Magic')} ↗</a>
    </div>
  </section>
}

