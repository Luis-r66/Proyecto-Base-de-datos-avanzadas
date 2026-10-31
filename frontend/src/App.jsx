import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Header from "./components/Header";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import Buscar from "./pages/Buscar";
import ConvertirmePrestador from "./pages/ConvertirmePrestador";
import MiPortafolio from "./pages/MiPortafolio";
import CrearTrabajo from "./pages/CrearTrabajo";
import EditarTrabajo from "./pages/EditarTrabajo";
import PrestadorPublico from "./pages/PrestadorPublico";
import PortafolioDetalle from "./pages/PortafolioDetalle";
import AdminCategorias from "./pages/AdminCategorias";
import "./styles/global.css";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/prestador/:id" element={<PrestadorPublico />} />
          <Route path="/portafolio/:id" element={<PortafolioDetalle />} />
          <Route
            path="/buscar"
            element={
              <ProtectedRoute>
                <Buscar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/convertirme-prestador"
            element={
              <ProtectedRoute>
                <ConvertirmePrestador />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mi-portafolio"
            element={
              <ProtectedRoute>
                <MiPortafolio />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mi-portafolio/crear"
            element={
              <ProtectedRoute>
                <CrearTrabajo />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mi-portafolio/editar/:id"
            element={
              <ProtectedRoute>
                <EditarTrabajo />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/categorias"
            element={
              <ProtectedRoute roles={["Admin"]}>
                <AdminCategorias />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
