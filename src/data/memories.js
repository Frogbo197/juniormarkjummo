import { photos } from '../lib/photos'

// Nhãn kỷ nguyên theo thiết kế; không dùng làm lịch phát hành chính thức.
const records = [
  {
    id: 'cherry',
    year: '2023–2024',
    title: 'Cherry Magic',
    roles: 'Jinta & Min',
    label: 'Star Alpha',
    image: 'HNoYWmeaIAAtCbj.jpg',
    text: 'Chương mở đầu trong góc lưu trữ những vai diễn và khoảnh khắc JuniorMark.',
  },
  {
    id: 'liners',
    year: '2024–2025',
    title: 'Perfect 10 Liners',
    roles: 'Faifa & Wine',
    label: 'Star Beta',
    image: 'HNwgVKGbsAA2z-b.jpg',
    text: 'Một chương mới với Faifa & Wine, cùng những nụ cười và dấu mốc được fandom lưu lại.',
  },
  {
    id: 'fancon',
    year: 'Fancon memories',
    title: 'Sunnymoon & ShineRise',
    roles: 'Fancon • Ánh sáng sân khấu',
    label: 'Star Zenith',
    image: 'HPWCyKybkAAHKUm.jpg',
    text: 'Âm nhạc, ánh đèn và bé Jummo trong bộ sưu tập kỷ niệm sân khấu.',
  },
  {
    id: 'romance',
    year: 'Next chapter',
    title: 'My Romance Scammer',
    roles: 'Tim & Pai',
    label: 'Star Horizon',
    image: 'HNwNJ4GbsAE5PwW.jpg',
    text: 'Tiếp nối hành trình kể chuyện của JuniorMark. Theo dõi thông báo phát hành tại GMMTV.',
  },
]
export const photoPath = (name) => '/images/fan-photos/' + name

// These are existing editorial collections, not verified event records.
// Image associations are illustrative; do not infer capture dates or attendance.
export const memories = records.map((record) => ({
  ...record,
  era: record.id,
  date: null,
  people: ['junior', 'mark'],
  type: 'collection',
  summary: record.text,
  images: photos.filter((photo) => photo.file === record.image),
  source: null,
  verified: false,
  tags: [record.roles, 'Editorial collection'],
}))
export const findMemory = (id) => memories.find((memory) => memory.id === id)
export const memoriesForPerson = (person) => memories.filter((memory) => person === 'duo' || memory.people.includes(person))
export const memoryForPhoto = (file) => memories.find((memory) => memory.images.some((photo) => photo.file === file))
