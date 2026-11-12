# Focal Studio — Thai Game Localization Archive

เว็บไซต์คลังแพตช์เกมแปลภาษาไทยของ **Focal Studio** ออกแบบในธีม **Blue (Miku) / White / Black** สไตล์ Cyber-Pixel พร้อมระบบจัดการรายการเกมผ่านไฟล์ JSON ใช้งานบน **GitHub Pages** ได้ทันทีโดยไม่ต้องมี Backend

---

## โครงสร้างไฟล์

```text
.
├── index.html                        # หน้าเว็บหลัก
├── .nojekyll                         # ปิดการประมวลผล Jekyll บน GitHub Pages
├── README.md                         # คู่มือการใช้งานและอัปเดตเว็บ
├── data/
│   └── mods.json                     # ฐานข้อมูลรายการเกมและเวอร์ชันแพตช์ทั้งหมด
├── tools/
│   └── cover-maker.html              # เครื่องมือสร้างภาพปก 920×430 (460:215)
└── assets/
    ├── css/
    │   ├── fonts.css                 # ฟอนต์ Chakra Petch
    │   ├── style.css                 # สไตล์ Layout หลัก
    │   └── theme.css                 # ธีม Miku Blue / White / Black + ปรับแต่งมือถือ
    ├── images/
    │   ├── favicon.svg               # ไอคอนแท็บเบราว์เซอร์
    │   ├── focal-logo.svg            # โลโก้ Focal Studio (พื้นมืด)
    │   ├── focal-logo-light.svg      # โลโก้ Focal Studio (พื้นสว่าง)
    │   └── games/
    │       └── clannad/
    │           └── cover.png         # ภาพปกและภาพตัวอย่างแยกตามโฟลเดอร์เกม
    └── js/
        └── main.js                   # สคริปต์โหลด JSON, ค้นหา, แบ่งหน้า, Modal และ Canvas
```

---

## การอัปเดต Version ของแพตช์ (แก้ไขที่เดียวอัปเดตทั้งการ์ด)

ใน `data/mods.json` ให้แก้ไขแค่ฟิลด์ **`"modVersion"`** จุดเดียว (ไม่ต้องแก้ `"version"` ซ้ำใน `updates` รายการแรก):

```json
{
  "id": "clannad-patch-th",
  "title": "Clannad Patch ไทย",
  "modVersion": "1.1",
  "updatedDate": "15 พ.ย. 2569",
  "updates": [
    {
      "notes": "- แก้ไขคำผิดบทที่ 3\n- ปรับปรุงตัวติดตั้ง Windows"
    }
  ]
}
```

* เมื่อเปลี่ยน `"modVersion"` (เช่น `"1.0"` → `"1.1"`) ระบบจะอัปเดตให้พร้อมกันทั้ง **ท้ายการ์ด**, **หน้าต่างรายละเอียด (Modal)** และ **หัวข้อบันทึกเวอร์ชันล่าสุด (`เวอร์ชั่น 1.1`)** อัตโนมัติ
* หากต้องการเก็บประวัติเวอร์ชันเก่าต่อท้าย ให้เพิ่ม object ใหม่ไว้ด้านบนแล้วใส่ `"version": "เวอร์ชั่น 1.0"` เฉพาะรายการเก่าด้านล่าง
* วันที่ `"updatedDate"` ของเกมแรกใน `data/mods.json` จะซิงก์ไปแสดงในช่อง **อัปเดตล่าสุด** บนส่วน Hero ของหน้าแรกให้อัตโนมัติ

---

## วิธีเพิ่มเกมใหม่

1. **สร้างภาพปก (920×430)**:
   * เปิด `tools/cover-maker.html` ในเบราว์เซอร์
   * อัปโหลดรูปเกม กรอกชื่อเกม/รายละเอียด แล้วกด **ดาวน์โหลด `cover.png`**
   * นำไปวางที่ `assets/images/games/<ชื่อเกม>/cover.png`
2. **เพิ่มข้อมูลเกมใน `data/mods.json`**:
   * กด **คัดลอกโค้ดสำหรับ `mods.json`** จากหน้า Cover Maker ไปวางต่อใน array ของ `data/mods.json`
   * ใส่ลิงก์ดาวน์โหลด (รองรับ Google Drive แบบแชร์สาธารณะ) ใน `"downloadUrl"`
   * *(ถ้ามีภาพตัวอย่างเพิ่มเติม)* วางไฟล์ในโฟลเดอร์เกมเดียวกันแล้วใส่ path ใน `"screenshots": ["./assets/images/games/<ชื่อเกม>/ss1.png"]`

---

## การอัปโหลดขึ้น GitHub Pages

1. Push ไฟล์ทั้งหมดขึ้น GitHub Repository
2. เข้าเมนู **Settings → Pages**
3. ตรง **Build and deployment** เลือก `Deploy from a branch` → Branch `main` → Folder `/ (root)` → กด **Save**
4. รอสักครู่ เว็บจะพร้อมใช้งานที่ `https://<username>.github.io/<repo-name>/`
