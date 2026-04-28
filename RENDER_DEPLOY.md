# Render.com'da Deploy Qilish Yo'riqnomasi

Bu loyihani Render.com'da deploy qilish uchun qadamlar.

## 1. Loyihani Tayyorlash

### Package.json'da Build Script'larni Tekshirish
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

### Environment Variables (.env.local)
Render'da quyidagi environment variable'larni sozlang:
```
NODE_ENV=production
NEXTAUTH_URL=https://your-app-name.onrender.com
NEXTAUTH_SECRET=your-secret-key-here
```

## 2. Render.com'da Web Service Yaratish

### 2.1 Render Dashboard'ga Kirish
1. [render.com](https://render.com) saytiga kiring
2. GitHub/GitLab hisobingiz bilan login qiling
3. "New +" tugmasini bosing
4. "Web Service" ni tanlang

### 2.2 Repository Ulash
1. GitHub repository'ni tanlang
2. Yoki repository URL'ini kiriting: `https://github.com/username/repository-name`

### 2.3 Service Sozlamalari

#### Basic Settings:
- **Name**: `medication-tracker` (yoki istalgan nom)
- **Region**: `Oregon (US West)` (yoki yaqin region)
- **Branch**: `main` (yoki `master`)
- **Runtime**: `Node`

#### Build & Deploy Settings:
- **Root Directory**: `.` (agar loyiha root'da bo'lsa)
- **Build Command**: 
  ```bash
  npm install && npm run build
  ```
- **Start Command**:
  ```bash
  npm start
  ```

#### Advanced Settings:
- **Node Version**: `18` (yoki `20`)
- **Auto-Deploy**: `Yes` (har commit'da avtomatik deploy)

## 3. Environment Variables Sozlash

Render Dashboard'da "Environment" bo'limiga quyidagilarni qo'shing:

```
NODE_ENV=production
NEXTAUTH_URL=https://your-app-name.onrender.com
NEXTAUTH_SECRET=generate-random-secret-key
```

### Secret Key Yaratish:
```bash
# Terminal'da ishga tushiring:
openssl rand -base64 32
```

## 4. Deploy Jarayoni

### 4.1 Deploy Boshlash
1. "Create Web Service" tugmasini bosing
2. Deploy jarayoni avtomatik boshlanadi
3. Logs'ni kuzatib boring

### 4.2 Deploy Logs'ni Kuzatish
Deploy jarayonida quyidagi bosqichlar bo'ladi:
```
==> Cloning from GitHub...
==> Installing dependencies...
==> Building application...
==> Starting application...
==> Deploy successful!
```

## 5. Domen va SSL

### 5.1 Avtomatik Domen
Render avtomatik domen beradi:
```
https://your-app-name.onrender.com
```

### 5.2 Custom Domen (Ixtiyoriy)
1. "Settings" > "Custom Domains"
2. Domen nomini qo'shing
3. DNS sozlamalarini yangilang

## 6. Monitoring va Logs

### 6.1 Logs Ko'rish
- Render Dashboard > Service > "Logs" tab
- Real-time logs ko'rish mumkin

### 6.2 Metrics
- CPU va Memory ishlatilishini kuzatish
- Response time monitoring

## 7. Troubleshooting

### Keng Tarqalgan Muammolar:

#### Build Xatoliklari:
```bash
# Agar TypeScript xatoliklari bo'lsa:
npm run build
# Local'da test qiling

# Agar dependency xatoliklari bo'lsa:
npm install
npm audit fix
```

#### Environment Variable Xatoliklari:
- Render'da Environment variables to'g'ri sozlanganini tekshiring
- NEXTAUTH_URL to'g'ri domen bilan sozlangan bo'lishi kerak

#### Memory Xatoliklari:
- Free plan'da 512MB RAM limit bor
- Agar kerak bo'lsa, Starter plan'ga o'ting ($7/month)

## 8. Performance Optimizatsiya

### 8.1 Static Files
Next.js avtomatik static files'ni optimize qiladi.

### 8.2 Caching
```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}
```

## 9. Backup va Database

### 9.1 Local Storage
Hozirda localStorage ishlatilmoqda, bu production'da muammo bo'lishi mumkin.

### 9.2 Database Qo'shish (Tavsiya)
```bash
# PostgreSQL yoki MongoDB qo'shish:
# Render Dashboard > "New +" > "PostgreSQL"
```

## 10. Deployment Checklist

- [ ] Repository GitHub'da public/private
- [ ] Package.json'da build va start scripts mavjud
- [ ] Environment variables sozlangan
- [ ] NEXTAUTH_URL to'g'ri domen bilan
- [ ] Build local'da muvaffaqiyatli
- [ ] TypeScript xatoliklari yo'q
- [ ] Dependencies yangilangan

## 11. Render Free Plan Limitlari

- **RAM**: 512MB
- **CPU**: Shared
- **Bandwidth**: 100GB/month
- **Sleep**: 15 daqiqa faoliyatsizlikdan keyin uyqu rejimi
- **Build Time**: 500 soat/month

## 12. Production URL

Deploy muvaffaqiyatli bo'lgandan keyin:
```
https://your-app-name.onrender.com
```

Bu URL orqali ilovangizga kirish mumkin bo'ladi.

---

**Eslatma**: Free plan'da service 15 daqiqa faoliyatsizlikdan keyin "uyqu rejimi"ga o'tadi. Birinchi request'da 30-60 soniya kutish kerak bo'lishi mumkin.