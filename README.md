
# 🌌 JuniorMark - The Celestial Record Store

Fansite **React + Vite** dành cho JuniorMark, phát triển từ thiết kế **Studio Home (Figma frame 2007:2)** và mở rộng theo hướng **Celestial Archive**.

Website tập trung vào hành trình JuniorMark, media, lịch, cộng đồng fandom và các tương tác cùng Jummo.

> Backend và tài khoản do maintainer của repository quản lý. README này tập trung vào giao diện, trải nghiệm và chức năng phía client.

## 🚀 Chạy project

Yêu cầu:

- Node.js tương thích Vite 8
- Khuyến nghị Node 22.12+ hoặc Node 24 LTS
- npm

```bash
npm install
npm run dev
```

Mặc định truy cập tại:

```text
http://localhost:5173
```

---

## ✨ Tính năng chính

| Khu vực | Nội dung |
|---|---|
| 🏠 **Studio** | Hero, record player, Living Dashboard, sinh nhật, Memory of the Day và Jummo Guide |
| 🗂️ **Archive** | Profiles, Constellation / Timeline và Visual Archive |
| 🪐 **Orbit** | Schedule, My Orbit, memories/events đã lưu và tiến độ khám phá |
| 🌠 **Community** | Starry Sky, Community Galaxy và Wall of Melody |
| 🐣 **Jummo World** | Mood GIF, Jummo Rain, secret letter, goodies và quiz |
| 🎫 **Fan Hub** | Fan Projects, New Fan Guide, Support Guide và Celestial Pass |

---

## 🎨 UI / UX

- Glassmorphism có kiểm soát cho header, menu, dialog, card và control.
- Hỗ trợ dark / light theme và ghi nhớ lựa chọn.
- Navigation desktop được gom thành 4 khu chính: **Studio, Archive, Orbit, Community**.
- Mobile navigation dùng menu dọc, tap target lớn và Archive submenu mở theo chiều dọc.
- Responsive cho desktop, tablet và mobile.
- Hỗ trợ keyboard navigation, skip link, focus state, `Escape` và `prefers-reduced-motion`.

---

## 🌌 Starry Sky

Starry Sky là khu vực cộng đồng tương tác chính của website.

- Nền sao nhiều lớp chuyển động chậm và chớp sáng.
- Các layer sao có tốc độ khác nhau để tạo chiều sâu.
- Sky hiển thị gần full viewport.
- Có chế độ **Full Sky** để xem toàn màn hình.
- Community stars vẫn có thể click và tương tác.
- Ưu tiên hiển thị **Your Star** của người dùng.
- Có chức năng **Find My Star**.
- Khi gửi ước nguyện thành công, ngôi sao sẽ có hiệu ứng bay lên trời rồi xuất hiện tại vị trí thật.

---

## 🐣 Jummo

Jummo không chỉ nằm trong Jummo World mà còn đóng vai trò UX Companion trong website.

| Khu vực | Jummo |
|---|---|
| Studio | Guide / Welcome |
| Timeline | Hướng dẫn khám phá memory |
| Schedule | Jummo Calendar |
| Media | Jummo Camera |
| 404 | Sleeping Jummo |

Jummo World gồm:

- Mood GIF
- Jummo Rain
- Secret Letter
- Goodies
- Quiz

**Jummo Rain** hiển thị 20 mascot rơi với vị trí, tốc độ và kích thước ngẫu nhiên.

---

## 🖼️ Archive & Media

### Profiles

- Chọn Junior / Mark / Jummo.
- Mở dossier nhanh bằng `Discover`.
- Liên kết tới hồ sơ đầy đủ và memory liên quan.

### Constellation of Memories

- Hiển thị hành trình JuniorMark dưới dạng chòm sao.
- Preview memory khi tương tác.
- Hỗ trợ keyboard navigation.
- Theo dõi tiến độ khám phá.

### Media Hub

- Tìm kiếm không dấu.
- Filter theo nhân vật, chủ đề, era và nguồn.
- Sort ảnh.
- Lightbox.
- Tải ảnh gốc.
- Liên kết sang memory và profile liên quan.

---

## 📅 Schedule & My Orbit

### Schedule

- Month / List view trên desktop.
- Agenda view trên mobile.
- Lọc sự kiện.
- Đổi tháng / năm.
- Export file `.ics`.
- Event demo hoặc chưa xác minh luôn được ghi nhãn rõ.

### My Orbit

Lưu lại:

- Memories
- Events
- Favorites
- Progress
- Badges

Dữ liệu guest có thể được lưu cục bộ trên trình duyệt.

---

## 💫 Community

### Community Galaxy

- Lời nhắn fandom hiển thị dưới dạng các vì sao.
- Filter theo nhóm.
- Zoom.
- Favorite.
- Your Star.
- Full Sky.

### Wall of Melody

- Lời nhắn hiển thị dưới dạng nốt nhạc.
- Có âm thanh tổng hợp khi tương tác.

Demo/local data luôn được phân biệt với dữ liệu production.

---

## 🧭 Routes

| Route | Trang | Chức năng |
|---|---|---|
| `#/studio` | Studio | Hero, record player, dashboard, birthday, Jummo |
| `#/profiles` | Character Stage | Chọn Junior / Mark / Jummo |
| `#/profiles/junior` | Junior Profile | Hồ sơ Junior và journey |
| `#/profiles/mark` | Mark Profile | Hồ sơ Mark và journey |
| `#/timeline` | Constellation | Hành trình và memories |
| `#/media` | Visual Archive | Search, filter, lightbox, download |
| `#/schedule` | Schedule | Calendar, agenda mobile, ICS |
| `#/orbit` | My Orbit | Saved items, progress, badges |
| `#/account` | My Orbit / Account | Dữ liệu cá nhân và tiến độ |
| `#/sky` | Starry Sky | Community Galaxy, Full Sky, Your Star |
| `#/wall` | Wall of Melody | Community notes |
| `#/jummo` | Jummo World | Mood, rain, letter, goodies, quiz |
| `#/projects` | Fan Hub | Projects, guide, support, Celestial Pass |

---

## 🧩 File quan trọng

| File | Vai trò |
|---|---|
| `src/App.jsx` | Layout, routing và các khu chính |
| `src/index.css` | Theme và màu sắc chung |
| `src/App.css` | CSS chính của Studio |
| `src/components/Header.jsx` | Header và navigation |
| `src/components/Hero.jsx` | Hero |
| `src/components/RecordPlayer.jsx` | Record player |
| `src/components/Birthdays.jsx` | Countdown sinh nhật |
| `src/components/ThemeToggle.jsx` | Dark / light theme |
| `src/components/Dialog.jsx` | Dialog và focus |
| `src/data/memories.js` | Nguồn dữ liệu memory chung |
| `src/pages/shared.jsx` | Shared UI components |
| `src/pages/Pages.css` | Visual system, glass và responsive |
| `src/pages/StarSkyBackground.jsx` | Background Starry Sky |
| `src/pages/StarSkyBackground.css` | Star drift / twinkle animation |
| `src/pages/CharacterStage.jsx` | Character selector |
| `src/pages/ProfileDossier.jsx` | Dossier nhanh |
| `src/pages/Profiles.jsx` | Hồ sơ đầy đủ |
| `src/pages/Timeline.jsx` | Constellation of Memories |
| `src/pages/MediaHub.jsx` | Visual Archive |
| `src/pages/Schedule.jsx` | Calendar / agenda / ICS |
| `src/pages/Community.jsx` | Starry Sky và Wall of Melody |
| `src/pages/JummoWorld.jsx` | Jummo World và Jummo Rain |
| `src/pages/Projects.jsx` | Fan Hub |
| `src/pages/MyOrbit.jsx` | Saved data, progress và badges |
| `src/lib/photos.js` | Ảnh, credit và metadata |
| `src/lib/archive.js` | Search, calendar, quiz, download, audio |
| `src/lib/helpers.js` | Validation, theme và birthday |
| `src/lib/useRoute.js` | Hash routing, focus và scroll |

---

## 📦 Jummo Assets

| Asset | Sử dụng |
|---|---|
| `public/images/main_mas.png` | Studio / Timeline |
| `public/images/camera_ms.png` | Media |
| `public/images/calender_ms.png` | Schedule |
| `public/images/sleep_ms.png` | 404 |
| `public/images/jummo_rain.png` | Jummo Rain |

---

## ⚠️ Giới hạn hiện tại

- Một số event và Fan Project là **DEMO / SAMPLE / UNCONFIRMED**.
- Media chưa có ngày chụp đáng tin cậy cho toàn bộ ảnh.
- Fan Projects không nhận quyên góp hoặc thực hiện giao dịch.
- Không tạo file tải giả cho asset chưa được cung cấp.
- Ảnh giữ watermark, credit và metadata nguồn khi có.
- Demo/local community data không được trình bày như production data.
- Shareable card không chứa email, UUID hoặc account ID.
- Midnight Archive hiện vẫn là ý tưởng mở rộng.
- Production hosting phụ thuộc môi trường deploy của repository.

---

## 🧪 Kiểm tra trước khi bàn giao

```bash
npm test
npm run lint
npm run build
```

Nên chạy lại các lệnh trên trước mỗi commit hoặc PR có thay đổi lớn về UI, routing hoặc interaction.

---

## 📝 Quy ước dữ liệu

- `src/data/memories.js` là nguồn dữ liệu chung cho era và memory.
- Tránh duplicate nội dung giữa Timeline, Profiles và Media.
- Không tự suy đoán metadata chưa được xác minh.
- Community, Schedule và Fan Projects phải phân biệt rõ dữ liệu thật với dữ liệu minh họa.
- Interaction và animation mới phải tiếp tục hỗ trợ keyboard, focus và `prefers-reduced-motion`.
- Không công khai email, UUID hoặc dữ liệu tài khoản nhạy cảm trên UI/share card.

---

## 💛 JuniorMark Celestial Archive

Một không gian nhỏ để lưu lại hành trình, hình ảnh, kỷ niệm và những lời nhắn của fandom dành cho JuniorMark.
````
