import React, { Suspense } from "react";
import MyRouter from "routers/index";
import "i18n"
import { AuthProvider } from "firebase/authManager";
import { DBProvider } from "firebase/firestoreManager";

function App() {
  return (
    <Suspense fallback="...">
      <div className="bg-white text-base dark:bg-neutral-900 text-neutral-900 dark:text-neutral-200">
        <AuthProvider>
          <DBProvider>
          <MyRouter />
          </DBProvider>
        </AuthProvider>
      </div>
    </Suspense>
  );
}

export default App;
