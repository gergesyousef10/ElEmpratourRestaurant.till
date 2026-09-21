/* ------------------------------------------------------------------
   EL EMPRATOUR CASHIER — cloud sync settings
   إعدادات المزامنة السحابية

   Leave projectId empty ("") and the till works perfectly, but each
   device keeps its own data.

   Fill these in from your Firebase project and re-upload this file to
   make the tablet, the phone and the PC share one stock count and one
   set of sales. Step-by-step instructions are in README.txt.
   ------------------------------------------------------------------ */

window.EE_FIREBASE = {
  apiKey:     "",
  authDomain: "",
  projectId:  "",
  appId:      "",

  /* The name of this restaurant's data. Leave as is unless you run a
     second branch from the same Firebase project — then give it a
     different name, e.g. "empratour-marina". */
  site:  "empratour",

  /* The till account you created in Firebase Authentication.
     The password is NOT written here — each device is asked for it
     once, in Setup -> Cloud sync. */
  email: "till@empratour.app"
};
