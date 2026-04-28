# Deployment Checklist

## Pre-Deployment

### 1. Code Tayyorlash
- [ ] Barcha xatoliklar tuzatilgan
- [ ] TypeScript xatoliklari yo'q
- [ ] `npm run build` local'da muvaffaqiyatli
- [ ] `npm start` local'da ishlaydi
- [ ] Console'da critical xatoliklar yo'q

### 2. Environment Variables
- [ ] `.env.local` faylida kerakli o'zgaruvchilar
- [ ] Production URL'lari to'g'ri
- [ ] API key'lar va secret'lar xavfsiz

### 3. Dependencies
- [ ] `package.json` yangilangan
- [ ] Barcha dependencies o'rnatilgan
- [ ] `npm audit` xavfsizlik tekshiruvi o'tkazilgan

## Render.com Setup

### 1. Repository
- [ ] GitHub'da repository public yoki Render'ga access berilgan
- [ ] Latest code push qilingan
- [ ] Main branch'da barcha o'zgarishlar

### 2. Web Service Yaratish
- [ ] Render.com'da login
- [ ] "New Web Service" yaratilgan
- [ ] Repository ulangan
- [ ] Build command: `npm install && npm run build`
- [ ] Start command: `npm start`
- [ ] Node version: 18 yoki 20

### 3. Environment Variables
```
NODE_ENV=production
NEXTAUTH_URL=https://your-app-name.onrender.com
NEXTAUTH_SECRET=your-generated-secret
```

## Post-Deployment

### 1. Functionality Test
- [ ] Asosiy sahifa ochiladi
- [ ] Shifokor login/register ishlaydi
- [ ] Shartnoma yaratish ishlaydi
- [ ] Bemor sahifasi ochiladi
- [ ] Dori qabul qilish ishlaydi
- [ ] Tovush/alarm ishlaydi
- [ ] Share funksiyalari ishlaydi

### 2. Performance
- [ ] Sahifa tezligi qabul qilinadigan
- [ ] Mobile'da to'g'ri ko'rinadi
- [ ] Responsive design ishlaydi

### 3. Monitoring
- [ ] Render logs'ni tekshirish
- [ ] Error monitoring sozlash
- [ ] Performance metrics kuzatish

## Troubleshooting

### Build Xatoliklari
```bash
# Local'da test qilish:
npm run build
npm start

# Dependencies muammosi:
rm -rf node_modules package-lock.json
npm install
```

### Runtime Xatoliklari
- Render logs'ni tekshiring
- Environment variables to'g'ri sozlanganini tekshiring
- Memory limit'ni tekshiring (512MB free plan'da)

### Performance Muammolari
- Static files caching
- Image optimization
- Code splitting
- Bundle size optimization

## Production URLs

### Main App
```
https://your-app-name.onrender.com
```

### API Endpoints
```
https://your-app-name.onrender.com/api/contracts
https://your-app-name.onrender.com/api/logs/[id]
```

### Patient Links
```
https://your-app-name.onrender.com/bemor/[id]
https://your-app-name.onrender.com/oila/[id]
```

## Backup Plan

### 1. Local Backup
- [ ] Code repository backup
- [ ] Database export (agar mavjud bo'lsa)
- [ ] Environment variables backup

### 2. Alternative Deployment
- [ ] Vercel account tayyorlash
- [ ] Netlify account tayyorlash
- [ ] Alternative hosting options

## Security Checklist

- [ ] HTTPS majburiy
- [ ] Environment variables xavfsiz
- [ ] No sensitive data in code
- [ ] Security headers sozlangan
- [ ] CORS to'g'ri sozlangan

## Final Steps

1. **Domain Setup** (ixtiyoriy)
   - Custom domain qo'shish
   - SSL certificate tekshirish

2. **Monitoring Setup**
   - Error tracking (Sentry)
   - Analytics (Google Analytics)
   - Uptime monitoring

3. **Documentation Update**
   - README.md yangilash
   - API documentation
   - User guide

---

**Eslatma**: Free plan'da service 15 daqiqa faoliyatsizlikdan keyin uyqu rejimiga o'tadi. Production uchun Starter plan ($7/month) tavsiya etiladi.