import "./app.css";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth";
import Login from "../modules/Login";
import { RequireAuth } from "../components/RequireAuth";
import Home from "../modules/Home";
import Playground from "../modules/Playground";
import { RequireNonAuth } from "../components/RequireNonAuth";
import { ModalProvider } from "./modal";
import { Bounce, ToastContainer } from "react-toastify";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ModalProvider>
          <Routes>
            <Route
              path="/login"
              element={
                <RequireNonAuth>
                  <Login></Login>
                </RequireNonAuth>
              }
            ></Route>
            <Route
              path="/app"
              element={
                <RequireAuth>
                  <Home></Home>
                </RequireAuth>
              }
            ></Route>
            <Route
              path="/playground/:id"
              element={
                <RequireAuth>
                  <Playground></Playground>
                </RequireAuth>
              }
            ></Route>
            <Route
              path="/"
              element={<Navigate to="/app" replace></Navigate>}
            ></Route>
            <Route
              path="*"
              element={<Navigate to="/app" replace></Navigate>}
            ></Route>
          </Routes>
        </ModalProvider>
      </AuthProvider>
      <ToastContainer
        position="bottom-center"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        transition={Bounce}
      />
    </BrowserRouter>
  );
};

export default App;
