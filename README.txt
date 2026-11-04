EL EMPRATOUR CASHIER — تشغيل المزامنة السحابية (Firebase)
=========================================================

الكاشير شغال من غير Firebase، بس كل جهاز بيبقى ليه بياناته لوحده.
لو عايز التابلت والموبايل والكمبيوتر يشوفوا نفس المخزن ونفس المبيعات، اعمل الخطوات دي مرة واحدة بس:


1) اعمل مشروع Firebase
   - ادخل https://console.firebase.google.com
   - Add project  ->  سميه مثلاً  empratour-till
   - Google Analytics: مش لازم، اقفله.

2) شغّل تسجيل الدخول (Authentication)
   - Build -> Authentication -> Get started
   - Sign-in method -> Email/Password -> Enable -> Save
   - Users -> Add user
       Email:     till@empratour.app
       Password:  اختار كلمة سر قوية واحفظها (هتكتبها على كل جهاز مرة واحدة)
   - Settings -> Authorized domains -> Add domain
       ضيف عنوان الموقع اللي الكاشير متركب عليه، مثلاً:
       gergesyousef10.github.io

3) شغّل قاعدة البيانات (Firestore)
   - Build -> Firestore Database -> Create database
   - Location: اختار  eur3 (europe-west)  أو أقرب حاجة ليك
   - Start in production mode
   - افتح تاب Rules، امسح اللي فيه، والصق محتوى ملف  firestore.rules  كله -> Publish

4) هات بيانات المشروع
   - الترس (Project settings) -> General -> Your apps -> اضغط أيقونة الويب  </>
   - سمي الـ app أي اسم -> Register app (ماتعلمش على Firebase Hosting)
   - هيظهرلك  firebaseConfig  فيه apiKey و authDomain و projectId و appId

5) املأ ملف config.js
   انسخ الأربع قيم دول بس في config.js:
       apiKey:     "AIza....",
       authDomain: "empratour-till.firebaseapp.com",
       projectId:  "empratour-till",
       appId:      "1:....:web:....",
   وسيب  site  و  email  زي ما هم.
   ارفع config.js على GitHub مكان القديم.
   (الـ apiKey مش سر — اللي بيحمي البيانات هو كلمة السر وقواعد firestore.rules)

6) على كل جهاز
   - افتح الكاشير -> Setup -> Cloud sync (المزامنة السحابية)
   - اكتب كلمة السر بتاعة till@empratour.app -> Connect
   - أول جهاز يتوصل بيرفع بياناته، والباقيين بيسحبوا منه.


نشر الكاشير على GitHub Pages (لو مش متركب)
-------------------------------------------
   Repository -> Settings -> Pages
   Source: Deploy from a branch  ->  Branch: main  /  (root)  -> Save
   بعد دقيقة هيبقى على:
   https://gergesyousef10.github.io/ElEmpratourRestaurant.till/


مشاكل شائعة
-----------
 - "auth/unauthorized-domain" : ضيف عنوان الموقع في Authorized domains (خطوة 2).
 - "permission-denied"        : القواعد مش متنشرة، أو الإيميل في firestore.rules
                                مختلف عن اللي في config.js.
 - "wrong-password"           : كلمة السر غلط، أو غيرها من Authentication -> Users.
