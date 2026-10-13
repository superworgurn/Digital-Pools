

# 🌊 Digital Pools — Smart Aquatics Platform & Digital Twin

[![Svelte](https://img.shields.io/badge/Svelte-5%2F4-FF3E00?style=for-the-badge&logo=svelte&logoColor=white)](https://svelte.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Canvas 3D Engine](https://img.shields.io/badge/3D%20Engine-Custom%20Canvas%20Renderer-0ea5e9?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

> **Digital Pools** คือระบบบริหารจัดการสระว่ายน้ำอัจฉริยะในรูปแบบ **Digital Twin 3D Web Application** ที่จำลองพื้นที่จริงแบบเรียลไทม์ เชื่อมโยงข้อมูลโทรมาตร IoT สภาพแวดล้อม การจัดการคิว การจองตู้ล็อกเกอร์ คอร์สเรียนว่ายน้ำ สระเด็ก และระบบวิเคราะห์ข้อมูลเชิงบริหาร (Executive Dashboard) สำหรับเจ้าหน้าที่และผู้ใช้บริการ

---

## 📸 ภาพรวมระบบและฟีเจอร์เด่น (Key Features)

### 1. 🌐 Interactive 3D Digital Twin Engine
* **เรนเดอร์ 3D แบบเรียลไทม์บน HTML5 Canvas:** ไม่ต้องพึ่งพาโมเดลภายนอกขนาดใหญ่ ทำงานได้ลื่นไหล 60 FPS ทั้งบน Desktop และอุปกรณ์พกพา
* **สภาพแวดล้อมสระว่ายน้ำเสมือนจริง:**
  * ผิวน้ำพร้อม Wave Simulation ไดนามิก แสงแดด และประกายน้ำ
  * สระหลัก 4 เลนพร้อมทุ่นกั้น และ NPC นักว่ายน้ำขยับตามท่วงท่าจริง
  * **โซนสระว่ายน้ำเด็ก (Kids Pool Zone):** สระน้ำตื้นสีสันสดใส สไลเดอร์น้ำเด็ก น้ำพุเห็ดลายจุด ห่วงยางเป็ดเหลือง และเด็กๆ เล่นน้ำกระจาย
  * **ฉากหลังและสิ่งอำนวยความสะดวก:** ร้าน 7-Eleven พร้อมป้ายทาวเวอร์ทรงสูง มอเตอร์ไซค์เดลิเวอรี ตู้ ATM ห้องน้ำชาย-หญิง และโซนตู้ล็อกเกอร์
  * **Living NPCs:** ตัวละครเดินเข้าคิวเช็คอิน นั่ง/นอนคุยกันริมสระ พร้อม Bubble บทสนทนาลอยสมจริง

### 2. 🚶 First-Person Player Mode (โหมดเดินสำรวจ)
* **เดินสำรวจพื้นที่ระดับสายตา (Eye-level 1.65m):** เข้าชมจุดต่างๆ ทั้งหน้าสระ ป้อมไลฟ์การ์ด สระเด็ก และหน้าร้านสะดวกซื้อ
* **ควบคุมคล่องตัว (Desktop & Mobile):**
  * คีย์บอร์ด **W, A, S, D** หรือ **ปุ่มลูกศร** (รองรับทั้งแป้นพิมพ์ภาษาอังกฤษและภาษาไทย)
  * วิ่งเร็ว (Sprint) ด้วยปุ่ม **Shift** หรือปุ่มสายฟ้าบนหน้าจอ
  * หันมองรอบทิศทาง 360° ด้วยการคลิกลากเมาส์
  * หน้าจอสัมผัส: Virtual D-Pad 4 ทิศทางขนาดใหญ่ พร้อมสลับเดิน/วิ่งเร็ว

### 3. 🎫 จุดให้บริการ & ระบบจอง (Point-of-Service Hotspots)
* **เคาน์เตอร์ต้อนรับ & จองรอบว่ายน้ำ:**
  * จองรอบ Morning, Afternoon, Night พร้อมระบุจำนวนสมาชิกที่มาด้วยกัน
  * คำนวณราคารวมอัตโนมัติ และตรวจสอบจำนวนที่นั่งว่างแบบ Real-time
  * สามารถแก้ไขจำนวนคน หรือยกเลิกการจองได้ตราบใดที่ยังไม่ได้ชำระเงิน และล็อกสิทธิ์ทันทีหลังจ่ายเงิน
* **ระบบเช็คอิน Day Pass & QR/RFID:**
  * ลงทะเบียนเช็คอินด่วน ระบุจำนวนคนในกลุ่ม
  * รองรับการแก้ไข/ยกเลิกก่อนจ่ายเงิน และมีปุ่มเช็คเอาท์เพื่อคืนความจุสระ
* **โซนตู้ล็อกเกอร์ (Locker Management):** ผังตู้ 1–30 แสดงสถานะตู้ว่าง/ไม่ว่าง/ตู้ของฉัน พร้อมระบบคืนตู้ทั้งหมด
* **คอร์สเรียนว่ายน้ำ (Training Classes):** สมัครเรียนแบบเดี่ยวหรือกลุ่ม แก้ไข/ยกเลิกก่อนจ่ายเงิน
* **คุณภาพน้ำ & เซนเซอร์ IoT:** วัดค่า pH, คลอรีน, อุณหภูมิ, ORP, Turbidity, TDS พร้อม Telemetry Ping รายจุด
* **ป้อมไลฟ์การ์ด & ปฏิบัติการฉุกเฉิน (Emergency Action):**
  * สัญญาณเตือนภัยไซเรนหมุนรอบป้อม
  * ไลฟ์การ์ดลงมาจากป้อมเพื่อเดินลาดตระเวนรอบขอบสระน้ำพร้อมโทรโข่งและทุ่นกู้ภัย

### 4. 📊 Manager Executive Dashboard
* สรุปภาพรวมและสถิติเชิงลึก **รายวัน (Daily)**, **รายสัปดาห์ (Weekly)**, และ **รายเดือน (Monthly)**
* **วิเคราะห์ความหนาแน่นผู้เข้าใช้:** ระบุช่วงเวลาคนเล่นเยอะ (Peak Hours) และช่วงคนเล่นน้อย (Off-Peak Hours)
* **กราฟรายรับและสัดส่วนรายได้:** จำแนกตามบัตรรายวัน, คอร์สเรียน, สมาชิก และบริการเสริม
* **สถิติคุณภาพน้ำสุขอนามัย:** อัตราการกรองและการหมุนเวียนน้ำเฉลี่ย

### 5. 🔐 Role-Based Access Control (RBAC)
| บทบาท (Role) | สิทธิ์การเข้าถึง |
| :--- | :--- |
| **Guest (ไม่ได้ล็อกอิน)** | เข้าชม 3D Digital Twin, สลับมุมกล้อง, เปิด Player Mode ได้อิสระ (บล็อกการจอง, ล็อกเกอร์, คอร์สเรียน, และปุ่มฉุกเฉิน) |
| **User (สมาชิกทั่วไป)** | จองรอบว่ายน้ำ, เช็คอิน, จองล็อกเกอร์, สมัครคอร์สเรียน, แจ้งเหตุฉุกเฉิน (ซ่อนปุ่ม Dashboard) |
| **Admin (ผู้ดูแลระบบ)** | สิทธิ์เต็มทุกระบบ พร้อมเข้าถึง **Manager Executive Dashboard** |
---

## 🔑 บัญชีสำหรับทดสอบระบบ (Demo Accounts)

สามารถกดปุ่มลัด **Demo Quick Login** บนหน้าต่างเข้าสู่ระบบ หรือกรอกข้อมูลดังนี้:

| Role | Username | Password | ความสามารถหลัก |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | เห็นสระ 3D + เปิด **Manager Dashboard** ได้ |
| **User** | `user` | `user123` | ใช้งานสระ 3D, จองรอบ, ล็อกเกอร์ (ซ่อน Dashboard) |
| **Guest** | *(ไม่ต้องล็อกอิน)* | — | สำรวจ 3D ได้อย่างเดียว ระบบจะเตือนให้ล็อกอินเมื่อทำรายการ |

---

## 🛠️ สถาปัตยกรรมเทคโนโลยี (Tech Stack)

* **Framework:** [Svelte 5](https://svelte.dev/)
* **Build Tool:** [Vite 5](https://vitejs.dev/)
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **Styling:** [TailwindCSS v4](https://tailwindcss.com/)
* **Graphics:** Custom Isometric / Perspective Software 3D Engine (`CanvasRenderingContext2D`)
* **State Management:** Svelte Writable Stores
* **Icons:** [Lucide Svelte](https://lucide.dev/)

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```text
pool-digital-twin/
├── src/
│   ├── assets/              # Static assets & branding
│   ├── lib/
│   │   ├── components/
│   │   │   ├── HotspotModal.svelte   # หน้าต่างจัดการจุดบริการ (จอง, คลาส, ล็อกเกอร์, IoT)
│   │   │   ├── LoginPage.svelte      # หน้าต่างเข้าสู่ระบบ & สลับสิทธิ์
│   │   │   ├── ManagerDrawer.svelte  # Executive Dashboard รายวัน/สัปดาห์/เดือน
│   │   │   ├── Navbar.svelte         # เมนูหลัก, สลับมุมมองกล้อง, สถานะผู้ใช้
│   │   │   ├── Scene3D.svelte        # Canvas Controller, Controls, D-Pad
│   │   │   └── ToastContainer.svelte # ระบบแจ้งเตือน Real-time Notification
│   │   ├── engine3d.ts      # Custom 3D Math, Mesh Projection, NPCs & Wave Physics
│   │   └── stores.ts        # Central Data Stores (Auth, IoT, Capacity, Bookings)
│   ├── types.ts             # TypeScript Interfaces & Data Models
│   ├── App.svelte           # Root Application Component
│   ├── app.css              # Global styles & Glassmorphism design tokens
│   └── main.ts              # Entry point
├── public/                  # Public web assets
├── vite.config.js           # Vite build configuration (allowedHosts support)
├── package.json
└── README.md
```

## 🚀 การติดตั้งและเริ่มใช้งาน (Getting Started)

### ความต้องการของระบบ (Prerequisites)

-   [Node.js](https://nodejs.org/) (เวอร์ชัน 18.x ขึ้นไป แนะนำ 20.x LTS)
    
      
    
-   npm หรือ pnpm / yarn
    
      
    

### 1. โคลนโปรเจกต์และติดตั้ง Dependency

Bash

```
# Clone the repository
git clone https://github.com/superworgurn/Digital-Pools.git

# เข้าสู่โฟลเดอร์โปรเจกต์
cd pool-digital-twin

# ติดตั้งแพ็กเกจ
npm install
```

### 2. รันระบบในสภาพแวดล้อม Development

Bash

```
npm run dev
```

เปิดเบราว์เซอร์ไปที่: `http://localhost:5173`

  

### 3. ตรวจสอบและ Build สำหรับ Production

Bash

```
npm run build
```

ไฟล์พร้อม Deploy จะถูกสร้างขึ้นที่โฟลเดอร์ `dist/`

## 📲 คีย์ลัดสำหรับ LINE Official Account (LINE OA Deep Linking)

คุณสามารถนำพารามิเตอร์ (URL Parameters) เหล่านี้ไปผูกกับปุ่มบน **Rich Menu**, **Flex Message**, **Broadcast Card** หรือ **Quick Reply** เพื่อให้ผู้ใช้งานที่กดผ่าน LINE สามารถเปิดฟังก์ชันที่ต้องการได้ทันทีโดยไม่ต้องกดค้นหาเอง:

| ลำดับ | ปุ่มบน LINE OA | URL Parameters | ตัวอย่าง URL สำหรับผูกกับปุ่ม | การทำงานของระบบ |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **สแกนเช็คอิน / ซื้อบัตร** | `?modal=reception&tab=checkin` | `https://your-domain.com/?modal=reception&tab=checkin` | เปิดหน้าต่างเช็คอิน Day Pass พร้อมฟอร์มระบุจำนวนสมาชิกทันที |
| **2** | **จองรอบว่ายน้ำล่วงหน้า** | `?modal=reception&tab=primary` | `https://your-domain.com/?modal=reception&tab=primary` | เปิดหน้าต่างเลือกรอบเวลา (เช้า/บ่าย/ค่ำ) และจำนวนคนที่มาจอง |
| **3** | **เช็คตู้ล็อกเกอร์ว่าง** | `?modal=locker` | `https://your-domain.com/?modal=locker` | เปิดผังตู้ล็อกเกอร์ 1–30 แสดงสถานะตู้ว่าง/ไม่ว่างแบบเรียลไทม์ |
| **4** | **สมัครคอร์สเรียนว่ายน้ำ** | `?modal=training` | `https://your-domain.com/?modal=training` | เปิดตารางคอร์สเรียน ข้อมูลโค้ช และระบบเลือกจำนวนผู้สมัคร |
| **5** | **คุณภาพน้ำ IoT เรียลไทม์** | `?modal=water` | `https://your-domain.com/?modal=water` | เปิดหน้าต่างตรวจวัดค่า pH, คลอรีน, อุณหภูมิ และ Telemetry Ping |
| **6** | **เดินสำรวจสระ 3D (FPS)** | `?player=true` | `https://your-domain.com/?player=true` | เข้าสู่ First-Person Player Mode ยืนหน้าทางเข้าพร้อมเดินสำรวจทันที |
| **7** | **เข้าสู่ระบบสมาชิก** | `?login=true` | `https://your-domain.com/?login=true` | เด้งหน้าต่างเข้าสู่ระบบ (Login Modal) ขึ้นมากลางจอทันที |
| **8** | **เช็คอินเฉพาะบุคคล (Dynamic)** | `?modal=reception&tab=checkin&code={LINE_ID}&name={NAME}` | `https://your-domain.com/?modal=reception&tab=checkin&code=LINE-U8890&name=คุณสมชาย` | เด้งหน้าเช็คอิน พร้อมกรอกชื่อและรหัสสมาชิกให้อัตโนมัติไม่ต้องพิมพ์เอง |

> **💡 เคล็ดลับเพิ่มเติม:**
> * สามารถรวมพารามิเตอร์มุมกล้องได้ เช่น `https://your-domain.com/?view=pool` เพื่อซูมมองมุมหน้าสระ
> * สำหรับปุ่มแจ้งเหตุด่วน สามารถใส่ `?emergency=true` เพื่อกระตุ้นระบบไซเรนและไลฟ์การ์ดได้ทันที

  
## 🎮 การควบคุมในโหมดเดินสำรวจ (Controls Reference)

| อุปกรณ์ | การสั่งการ | ผลลัพธ์ |
| :--- | :--- | :--- |
| **Keyboard** | `W` / `S` (หรือ `ไ` / `ห`) | เดินหน้า / ถอยหลัง |
| **Keyboard** | `A` / `D` (หรือ `ฟ` / `ก`) | ก้าวไปทางซ้าย / ก้าวไปทางขวา |
| **Keyboard** | `Shift` (กดค้าง) | วิ่งเร็ว (Sprint Mode) |
| **Keyboard** | `ESC` | ออกจาก Player Mode |
| **Mouse** | คลิกซ้ายค้าง + ลาก | หันมุมมองสายตา 360° |
| **Touchscreen** | Virtual D-Pad (มุมล่างซ้าย) | เดิน 4 ทิศทาง |
| **Touchscreen** | ปุ่ม ⚡ (ข้าง D-Pad) | สลับโหมดเดิน / วิ่งเร็ว |
| **Touchscreen** | ลากนิ้วบนพื้นที่ว่าง | หมุนมุมกล้องรอบทิศทาง |

## 📄 ใบอนุญาต (License)

โปรเจกต์นี้เผยแพร่ภายใต้ใบอนุญาต **MIT License** สามารถนำไปศึกษา พัฒนาต่อยอด หรือประยุกต์ใช้งานเชิงพาณิชย์ได้อย่างเสรี
