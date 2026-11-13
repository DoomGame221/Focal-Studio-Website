# Focal Studio — Cyber-Pixel Works & Localization Showcase

เว็บไซต์แสดงผลงานและคลังโปรเจกต์ของ **Focal Studio** ออกแบบในธีม **Blue (Miku) / White / Black** สไตล์ Cyber-Pixel รองรับการแยกหมวดหมู่ผลงาน (**แปลภาษาเกม**, **GitHub Project**, และ **กำลังพัฒนา**) ผ่านไฟล์ JSON พร้อมใช้งานบน **GitHub Pages** ได้ทันทีโดยไม่ต้องมี Backend

---

## โครงสร้างไฟล์

```text
.
├── index.html                        # หน้าเว็บหลัก (หมวดหมู่: ผลงานทั้งหมด / แปลภาษาเกม / GitHub Project / กำลังพัฒนา)
├── .nojekyll                         # ปิดการประมวลผล Jekyll บน GitHub Pages
├── README.md                         # คู่มือการใช้งานและอัปเดตเว็บ
├── data/
│   └── mods.json                     # ฐานข้อมูลผลงานทุกหมวดหมู่ (แปลเกม + GitHub Project)
├── tools/
│   └── cover-maker.html              # เครื่องมือสร้างภาพปก 920×430 และสร้างโค้ด JSON แยกตามหมวดหมู่
└── assets/
    ├── css/
    │   ├── fonts.css                 # ฟอนต์ Chakra Petch
    │   ├── style.css                 # สไตล์ Layout หลัก
    │   └── theme.css                 # ธีม Miku Blue / White / Black, แท็บหมวดหมู่ และปรับแต่งมือถือ
    ├── images/
    │   ├── favicon.svg               # ไอคอนแท็บเบราว์เซอร์
    │   ├── focal-aperture.svg        # ไอคอน Focus Cursor & Aperture
    │   ├── focal-logo.svg            # โลโก้ Focal Studio (พื้นมืด)
    │   ├── focal-logo-light.svg      # โลโก้ Focal Studio (พื้นสว่าง)
    │   ├── games/                    # ภาพปกและภาพตัวอย่างหมวดแปลภาษาเกม
    │   │   └── clannad/cover.png
    │   └── projects/                 # (ทางเลือก) ภาพปกหมวด GitHub Project
    └── js/
        └── main.js                   # สคริปต์โหลด JSON, กรองหมวดหมู่, ค้นหา, แบ่งหน้า, Modal และ Focus Cursor
```

---

## โครงสร้างหมวดหมู่ผลงาน (`category` และ `status`)

ใน `data/mods.json` แต่ละรายการสามารถกำหนดหมวดหมู่ได้ดังนี้:

* **`"category": "translation"`** — หมวด **แปลภาษาเกม** (แสดงลิงก์ `Steam` และ `ดาวน์โหลด`)
* **`"category": "github"`** — หมวด **GitHub Project** (รองรับ `"repoUrl"`, `"demoUrl"`, `"techStack"` และ `"coverFallbackTag"` กรณีไม่มีภาพปก)
* **`"status": "developing"`** — แสดงเพิ่มในแท็บ **กำลังพัฒนา** พร้อมป้ายสถานะ **กำลังพัฒนา**

### ตัวอย่างรายการ GitHub Project ใน `data/mods.json`

```json
{
  "id": "my-github-project",
  "category": "github",
  "title": "ชื่อโปรเจกต์ GitHub",
  "status": "published",
  "badge": "PROJECT",
  "coverImage": "",
  "coverFallbackTag": "GITHUB PROJECT",
  "techStack": ["JavaScript", "HTML5", "CSS3"],
  "updatedDate": "13 พ.ย. 2569",
  "gameVersion": "GitHub Repository",
  "modVersion": "1.0",
  "repoUrl": "https://github.com/username/repo-name",
  "demoUrl": "https://username.github.io/repo-name/",
  "installGuide": "วิธีใช้งานหรือ Clone โปรเจกต์...",
  "updates": [
    {
      "notes": "- รายละเอียดเวอร์ชันล่าสุด"
    }
  ]
}
```

---

## การอัปเดต Version ของแพตช์ / โปรเจกต์ (แก้ไขที่เดียวอัปเดตทั้งการ์ด)

ใน `data/mods.json` ให้แก้ไขแค่ฟิลด์ **`"modVersion"`** จุดเดียว (ไม่ต้องแก้ `"version"` ซ้ำใน `updates` รายการแรก):

```json
{
  "id": "clannad-patch-th",
  "category": "translation",
  "title": "Clannad Patch ไทย",
  "modVersion": "10.5",
  "updatedDate": "13 พ.ย. 2569",
  "updates": [
    {
      "notes": "- อัปเดตแพตช์ Clannad เวอร์ชัน 10.5"
    }
  ]
}
```

* เมื่อเปลี่ยน `"modVersion"` (เช่น `"10.5"` → `"10.6"`) ระบบจะอัปเดตให้พร้อมกันทั้ง **ท้ายการ์ด**, **หน้าต่างรายละเอียด (Modal)** และ **หัวข้อบันทึกเวอร์ชันล่าสุด (`เวอร์ชั่น 10.6`)** อัตโนมัติ
* หากต้องการเก็บประวัติเวอร์ชันเก่าต่อท้าย ให้เพิ่ม object ใหม่ไว้ด้านบนแล้วใส่ `"version": "เวอร์ชั่น 10.5"` เฉพาะรายการเก่าด้านล่าง
* วันที่ `"updatedDate"` ของรายการแรกใน `data/mods.json` จะซิงก์ไปแสดงในช่อง **อัปเดตล่าสุด** บนส่วน Hero ของหน้าแรกให้อัตโนมัติ

---

## วิธีเพิ่มผลงานใหม่ (แปลเกม หรือ GitHub Project)

1. **สร้างภาพปก 920×430 (ถ้าต้องการ)**:
   * เปิด `tools/cover-maker.html` ในเบราว์เซอร์
   * เลือกหมวดหมู่ (`แปลภาษาเกม` หรือ `GitHub Project`), อัปโหลดรูป (ถ้ามี) และกรอกรายละเอียด
   * กด **ดาวน์โหลด `cover.png`** นำไปวางที่ `assets/images/games/<ชื่อโฟลเดอร์>/cover.png` หรือ `assets/images/projects/<ชื่อโฟลเดอร์>/cover.png` *(สำหรับ GitHub Project หากปล่อย `"coverImage": ""` ระบบจะสร้างปก Cyber-Grid ให้อัตโนมัติ)*
2. **เพิ่มข้อมูลใน `data/mods.json`**:
   * กด **คัดลอกโค้ดสำหรับ `mods.json`** จากหน้า Cover Maker ไปวางต่อใน array ของ `data/mods.json`
   * ใส่ `"downloadUrl"` / `"steamUrl"` สำหรับหมวดแปลเกม หรือ `"repoUrl"` / `"demoUrl"` สำหรับหมวด GitHub Project

---

## การอัปโหลดขึ้น GitHub Pages

1. Push ไฟล์ทั้งหมดขึ้น GitHub Repository
2. เข้าเมนู **Settings → Pages**
3. ตรง **Build and deployment** เลือก `Deploy from a branch` → Branch `main` → Folder `/ (root)` → กด **Save**
4. รอสักครู่ เว็บจะพร้อมใช้งานที่ `https://<username>.github.io/<repo-name>/`
