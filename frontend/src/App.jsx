import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AppShell from "./components/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import ServicioDetalle from "./pages/ServicioDetalle";
import MisServicios from "./pages/MisServicios";
import FormServicio from "./pages/FormServicio";
import ConfirmarPedido from "./pages/ConfirmarPedido";
import Pedidos from "./pages/Pedidos";
import PedidoDetalle from "./pages/PedidoDetalle";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import MiPerfil from "./pages/MiPerfil";
import Cuenta from "./pages/Cuenta";
import Buscar from "./pages/Buscar";
import ConvertirmePrestador from "./pages/ConvertirmePrestador";
import MiPortafolio from "./pages/MiPortafolio";
import CrearTrabajo from "./pages/CrearTrabajo";
import EditarTrabajo from "./pages/EditarTrabajo";
import PrestadorPublico from "./pages/PrestadorPublico";
import PortafolioDetalle from "./pages/PortafolioDetalle";
import Negociaciones from "./pages/Negociaciones";
import NegociacionDetalle from "./pages/NegociacionDetalle";
import Favoritos from "./pages/Favoritos";
import Notificaciones from "./pages/Notificaciones";
import Mensajes from "./pages/Mensajes";
import ConversacionDetalle from "./pages/ConversacionDetalle";
import Track from "./pages/Track";
import AdminDashboard from "./pages/AdminDashboard";
import AdminVerificacion from "./pages/AdminVerificacion";
import AdminReportes from "./pages/AdminReportes";
import AdminCategorias from "./pages/AdminCategorias";
import "./styles/global.css";
import "./styles/theme.css";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/prestador/:id" element={<PrestadorPublico />} />
            <Route path="/portafolio/:id" element={<PortafolioDetalle />} />
            <Route path="/track" element={<Track />} />
            <Route path="/track/:codigo" element={<Track />} />
            <Route path="/servicio/:id" element={<ServicioDetalle />} />
            <Route path="/confirmar/:servicioId/:paquete" element={<ProtectedRoute><ConfirmarPedido /></ProtectedRoute>} />
            <Route
              path="/pedidos"
              element={
                <ProtectedRoute>
                  <Pedidos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pedidos/:id"
              element={
                <ProtectedRoute>
                  <PedidoDetalle />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mis-servicios"
              element={
                <ProtectedRoute>
                  <MisServicios />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mis-servicios/crear"
              element={
                <ProtectedRoute>
                  <FormServicio modo="crear" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mis-servicios/:id/editar"
              element={
                <ProtectedRoute>
                  <FormServicio modo="editar" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cuenta"
              element={
                <ProtectedRoute>
                  <Cuenta />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mi-perfil"
              element={
                <ProtectedRoute>
                  <MiPerfil />
                </ProtectedRoute>
              }
            />
          <Route path="/buscar" element={<Buscar />} />
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
            path="/favoritos"
            element={
              <ProtectedRoute>
                <Favoritos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notificaciones"
            element={
              <ProtectedRoute>
                <Notificaciones />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mensajes"
            element={
              <ProtectedRoute>
                <Mensajes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mensajes/:id"
            element={
              <ProtectedRoute>
                <ConversacionDetalle />
              </ProtectedRoute>
            }
          />
          <Route
            path="/negociaciones"
            element={
              <ProtectedRoute>
                <Negociaciones />
              </ProtectedRoute>
            }
          />
          <Route
            path="/negociaciones/:id"
            element={
              <ProtectedRoute>
                <NegociacionDetalle />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["Admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/verificacion"
            element={
              <ProtectedRoute roles={["Admin"]}>
                <AdminVerificacion />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reportes"
            element={
              <ProtectedRoute roles={["Admin"]}>
                <AdminReportes />
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
        </AppShell>
      </AuthProvider>
    </BrowserRouter>
  );
}
