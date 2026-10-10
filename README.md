<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/cbbb9dcd-2a5f-412d-bd00-328b551977d2

## 📌 গিটহাব (GitHub) ও ভার্সেল (Vercel) এ ডিপ্লয়মেন্ট নির্দেশিকা

### ১. গিটহাবে (GitHub) পূর্ণাঙ্গ কোড আপডেট করার নিয়ম
আপনার লোকাল কম্পিউটারে টার্মিনাল/কমান্ড প্রম্পট ওপেন করে নিচের কমান্ডগুলো রান করুন:

```bash
# সব ফাইল স্টেজিং এ যুক্ত করুন
git add -A

# কমিট করুন
git commit -m "Restore 2026 activities, Mahfil previous logo, and full Firebase config"

# যদি গিটহাব রিমোট যুক্ত না থাকে (আপনার রিপোজিটরি লিংক দিন):
git remote add origin https://github.com/আপনার-ইউজারনেম/আপনার-রিপোজিটরি.git

# মেইন ব্রাঞ্চ নিশ্চিত করুন
git branch -M main

# গিটহাবে পুশ করুন
git push -u origin main --force
```

---

### ২. ভার্সেল (Vercel) এর সাথে ফায়ারবেস (Firebase) যুক্ত করার নিয়ম

অ্যাপের কোডের মধ্যে ফায়ারবেসের যাবতীয় কনফিগারেশন (`firebase-applet-config.json` ও `.env.production`) ইতোমধ্যে সংযুক্ত করা হয়েছে। 

ভার্সেলে ডেটা সরাসরি লাইভ রাখার জন্য নিচের ধাপগুলো অনুসরণ করুন:

1. **Vercel ড্যাশবোর্ডে যান**: [https://vercel.com](https://vercel.com)
2. **Add New Project** এ ক্লিক করে আপনার GitHub রিপোজিটরিটি সিলেক্ট করুন।
3. **Environment Variables** সেকশনে নিচের ভ্যারিয়েবলগুলো যোগ করে দিন:

| ভ্যারিয়েবলের নাম (Key) | মান (Value) |
|---|---|
| `VITE_FIREBASE_PROJECT_ID` | `solid-helper-k8gvj` |
| `VITE_FIREBASE_APP_ID` | `1:435217603340:web:948b07b66cdb5e78578729` |
| `VITE_FIREBASE_API_KEY` | `AIzaSyAxiLTIoTm4q5l6idG__fimEFPiCElpQjA` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `solid-helper-k8gvj.firebaseapp.com` |
| `VITE_FIREBASE_DATABASE_ID` | `ai-studio-sonargaoncelebra-cbbb9dcd-2a5f-412d-bd00-328b551977d2` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `solid-helper-k8gvj.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `435217603340` |

4. **Deploy** বাটনে ক্লিক করুন। 
ব্যাস! আপনার অ্যাপটি স্বয়ংক্রিয়ভাবে লাইভ ফায়ারবেস ডাটাবেজের সাথে যুক্ত হয়ে চলবে।
