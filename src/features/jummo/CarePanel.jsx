import { Bath, Moon, Smile, Utensils } from 'lucide-react'
import { t as tr } from '../../i18n/language'
import './CarePanel.css'

export default function CarePanel({ stats }) {
  const rows = [
    ['mood', Smile, tr('Tâm trạng', 'Mood'), '#4f9a65'],
    ['fullness', Utensils, tr('No bụng', 'Fullness'), '#e59739'],
    ['cleanliness', Bath, tr('Sạch sẽ', 'Cleanliness'), '#4c9fcc'],
    ['energy', Moon, tr('Năng lượng', 'Energy'), '#9670bf'],
  ]
  return <aside className="jr-care-panel jr-care-pet" aria-label={tr('Chỉ số của Jummo', 'Jummo care stats')}>
    {rows.map(([key, Icon, label]) => <div className={`jr-care-row${stats[key] < 20 ? ' is-low' : ''}`} key={key} title={label} style={{ '--care-fill': `${stats[key]}%`, '--care-color': stats[key] < 20 ? '#ef7060' : stats[key] < 50 ? '#f2bc47' : '#8acb55' }}>
      <Icon size={15} aria-hidden="true" />
      <span className="jr-care-name">{label}</span>
      <div className="jr-care-track" role="progressbar" aria-label={label} aria-valuenow={stats[key]} aria-valuemin={0} aria-valuemax={100} aria-valuetext={`${Math.round(stats[key])}%${stats[key] < 20 ? tr(' — cần chăm sóc', ' — needs care') : ''}`}><span /></div>
      <span>{Math.round(stats[key])}%{stats[key] < 20 && <b aria-hidden="true"> !</b>}</span>
    </div>)}
  </aside>
}
