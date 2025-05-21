import { Routes } from '@angular/router';
import { LoginComponent } from '../components/auth/login/login.component';
import { RegisterComponent } from '../components/auth/register/register.component';
import { HomepageComponent } from '../components/homepage/homepage.component';
import { CategoriasComponent } from '../components/categorias/categorias.component';
import { ProductosComponent } from '../components/productos/productos.component';
import { AdministracionComponent } from '../components/administracion/administracion.component';
import { PedidosUsuarioComponent } from '../components/pedidos-usuario/pedidos-usuario.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomepageComponent},
  { path: 'productos', component: ProductosComponent },
  { path: 'catalogo', component: CategoriasComponent},
  { path: 'signup', component: RegisterComponent },
  { path: 'administracion', component: AdministracionComponent },
  { path: 'pedidos', component: PedidosUsuarioComponent },
  { path: '', redirectTo: '/home', pathMatch: 'full' }, 
  
];
